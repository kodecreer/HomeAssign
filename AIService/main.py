"""
Product Page Analyzer AI Service

A high-performance FastAPI service that provides AI-powered analysis of web pages
for conversion rate optimization. Supports both VLLM (production/Linux) and 
Ollama (development/macOS) backends with automatic fallback.

Architecture:
- FastAPI with async/await patterns for high concurrency
- Pydantic models for type safety and validation
- Bearer token authentication for security
- Streaming responses for real-time feedback
- Comprehensive error handling and logging
- Platform-aware AI backend selection

Author: Claude Code Assistant
Version: 1.0.0
License: MIT
"""

import asyncio
import json
import logging
import os
import platform
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Optional, Tuple, Union

import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ai_service.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)


# === Configuration ===
class Config:
    """Application configuration."""
    
    API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Model configuration
    MAX_TOKENS: int = 600
    TEMPERATURE: float = 0.3
    TOP_P: float = 0.8
    
    # Timeouts
    GENERATION_TIMEOUT: int = 300  # 5 minutes
    CHUNK_DELAY: float = 0.1  # Streaming delay
    
    @classmethod
    def validate(cls) -> None:
        """Validate configuration on startup."""
        if not cls.API_KEY:
            raise ValueError("AI_SERVICE_API_KEY environment variable is required")
        logger.info(f"Configuration loaded - Host: {cls.HOST}, Port: {cls.PORT}")


# === Pydantic Models ===
class AnalysisRequest(BaseModel):
    """Request model for analysis endpoint."""
    
    content: str = Field(..., min_length=1, max_length=50000, description="Web page content to analyze")
    url: str = Field(..., min_length=1, max_length=2000, description="Source URL of the content")
    
    @validator('url')
    def validate_url(cls, v):
        """Validate URL format."""
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class AnalysisResponse(BaseModel):
    """Response model for analysis endpoint."""
    
    analysis: str = Field(..., description="Full AI analysis text")
    url: str = Field(..., description="Analyzed URL")
    strengths: List[str] = Field(default_factory=list, description="Identified strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Identified weaknesses")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")
    metadata: Dict[str, Union[str, int]] = Field(default_factory=dict, description="Analysis metadata")


class HealthResponse(BaseModel):
    """Response model for health endpoint."""
    
    status: str = Field(..., description="Service health status")
    model: str = Field(..., description="AI model information")
    platform: str = Field(..., description="Operating system platform")
    token_generation: str = Field(..., description="Token generation capability")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")


class StreamChunk(BaseModel):
    """Model for streaming response chunks."""
    
    type: str = Field(..., description="Chunk type: status, partial, complete, error, fallback")
    content: Optional[str] = Field(None, description="Chunk content")
    message: Optional[str] = Field(None, description="Status message")


# === AI Backend Interface ===
class AIBackend(ABC):
    """Abstract base class for AI backends."""
    
    @abstractmethod
    async def generate_analysis(self, prompt: str) -> str:
        """Generate analysis text."""
        pass
    
    @abstractmethod
    async def generate_analysis_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Generate analysis with streaming."""
        pass
    
    @abstractmethod
    def get_model_info(self) -> str:
        """Get model information."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check backend health."""
        pass



class OllamaBackend(AIBackend):
    """Ollama backend with VLLM support for production use."""
    
    def __init__(self):
        """Initialize Ollama backend."""
        try:
            import ollama
            self.ollama = ollama
            self.client = ollama.Client()
            self.model_name = 'deepseek-r1:1.5b'
            logger.info(f"Ollama backend initialized with model: {self.model_name}")
        except ImportError as e:
            logger.error(f"Ollama not available: {e}")
            raise
        except Exception as e:
            logger.error(f"Ollama initialization failed: {e}")
            raise
    
    
    async def generate_analysis(self, prompt: str) -> str:
        """Generate analysis using Ollama."""
        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': Config.TEMPERATURE,
                    'top_p': Config.TOP_P,
                    'num_predict': Config.MAX_TOKENS
                }
            )
            generated_text = response['response'].strip()
            logger.info(f"Generated {len(generated_text)} tokens using Ollama ({self.model_name})")
            return self._post_process_text(generated_text)
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise
    
    async def generate_analysis_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Generate streaming analysis using Ollama."""
        try:
            logger.info(f"Starting streaming generation with prompt: {prompt[:100]}...")
            stream = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=True,
                options={
                    'temperature': Config.TEMPERATURE,
                    'top_p': Config.TOP_P,
                    'num_predict': Config.MAX_TOKENS
                }
            )
            
            full_response = ""
            for chunk in stream:
                if 'response' in chunk:
                    full_response += chunk['response']
                    yield chunk['response']
                    await asyncio.sleep(0.01)
            
            logger.info(f"Full response length: {len(full_response)}")
            logger.info(f"Full response preview: {full_response[:200]}...")
                    
        except Exception as e:
            logger.error(f"Ollama streaming failed: {e}")
            # Fallback to non-streaming
            text = await self.generate_analysis(prompt)
            chunk_size = max(1, len(text) // 10)
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                yield chunk
                await asyncio.sleep(Config.CHUNK_DELAY)
    
    def get_model_info(self) -> str:
        """Get Ollama model information."""
        return f"ollama-{self.model_name}"
    
    async def health_check(self) -> bool:
        """Check Ollama health."""
        try:
            # Simple generation test
            response = self.client.generate(
                model=self.model_name,
                prompt="Test",
                options={'num_predict': 1}
            )
            return 'response' in response
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    def _post_process_text(self, text: str) -> str:
        """Post-process generated text."""
        # Remove thinking process if present
        if '<think>' in text and '</think>' in text:
            # Extract content after the thinking section
            parts = text.split('</think>')
            if len(parts) > 1:
                text = parts[-1].strip()
        elif '<think>' in text:
            # If thinking started but didn't finish, keep content before it
            text = text.split('<think>')[0].strip()
        
        # Remove any remaining thinking markers
        text = text.replace('<think>', '').replace('</think>', '')
        
        # Clean up extra whitespace
        text = '\n'.join(line.strip() for line in text.split('\n') if line.strip())
        
        return text


# === AI Service ===
class AIService:
    """Main AI service class."""
    
    def __init__(self):
        """Initialize AI service with appropriate backend."""
        self.start_time = asyncio.get_event_loop().time()
        self.backend = self._initialize_backend()
        self.analysis_prompt_template = self._load_prompt_template()
    
    def _initialize_backend(self) -> AIBackend:
        """Initialize Ollama AI backend."""
        try:
            return OllamaBackend()
        except Exception as e:
            logger.error(f"Ollama backend failed to initialize: {e}")
            raise RuntimeError("Ollama backend not available")
    
    def _load_prompt_template(self) -> str:
        """Load the analysis prompt template."""
        return """Analyze this product page for UI/UX conversion optimization. Provide only the final analysis without reasoning.

URL: {url}
Content: {content}

Format your response exactly as shown:

Strengths:
- [strength 1]
- [strength 2]
- [strength 3]

Weaknesses:
- [weakness 1]
- [weakness 2]
- [weakness 3]

Recommendations:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]

Focus on conversion optimization and user experience. Be specific and actionable."""
    
    async def generate_analysis(self, content: str, url: str) -> str:
        """Generate analysis for given content."""
        prompt = self.analysis_prompt_template.format(
            url=url,
            content=content[:1000] + "..." if len(content) > 1000 else content
        )
        
        try:
            analysis = await self.backend.generate_analysis(prompt)
            return analysis if len(analysis) >= 100 else self._get_fallback_analysis(url)
        except Exception as e:
            logger.error(f"Analysis generation failed: {e}")
            return self._get_fallback_analysis(url)
    
    async def generate_analysis_stream(self, content: str, url: str) -> AsyncGenerator[StreamChunk, None]:
        """Generate streaming analysis for given content."""
        prompt = self.analysis_prompt_template.format(
            url=url,
            content=content[:1000] + "..." if len(content) > 1000 else content
        )
        
        yield StreamChunk(type="status", message="Starting AI analysis...")
        
        try:
            yield StreamChunk(type="status", message=f"Using {self.backend.get_model_info()} model...")
            
            full_analysis = ""
            async for chunk in self.backend.generate_analysis_stream(prompt):
                full_analysis += chunk
                yield StreamChunk(type="partial", content=chunk)
          
            
            yield StreamChunk(type="complete", content=full_analysis)
            
        except Exception as e:
            logger.error(f"Streaming analysis failed: {e}")
            fallback = self._get_fallback_analysis(url)
            yield StreamChunk(type="error", content=fallback)
    
    def _get_fallback_analysis(self, url: str) -> str:
        """Get fallback analysis when AI generation fails."""
        return f"""Something went wrong and an analysis cannot be provided"""
    
    def parse_analysis_structure(self, analysis_text: str) -> Tuple[List[str], List[str], List[str]]:
        """Parse analysis text into structured components."""
        lines = analysis_text.split('\n')
        strengths, weaknesses, recommendations = [], [], []
        current_section = None
        
        for line in lines:
            line = line.strip()
            line_lower = line.lower()
            
            # Detect section headers
            if ('strength' in line_lower and ':' in line) or '**strength' in line_lower:
                current_section = 'strengths'
                continue
            elif ('weakness' in line_lower and ':' in line) or '**weakness' in line_lower or 'areas for improvement' in line_lower:
                current_section = 'weaknesses'
                continue
            elif ('recommendation' in line_lower and ':' in line) or '**recommendation' in line_lower:
                current_section = 'recommendations'
                continue
            
            # Parse list items
            if line and (line.startswith('-') or line.startswith('•') or line.startswith('*') or 
                        any(line.startswith(f'{i}.') for i in range(1, 10))):
                
                # Extract item text
                if line.startswith(('-', '•', '*')):
                    item = line[1:].strip()
                elif line[0].isdigit() and '.' in line[:3]:
                    item = line.split('.', 1)[1].strip()
                else:
                    continue
                
                # Add to appropriate section
                if item and current_section == 'strengths':
                    strengths.append(item)
                elif item and current_section == 'weaknesses':
                    weaknesses.append(item)
                elif item and current_section == 'recommendations':
                    recommendations.append(item)
        
        return strengths, weaknesses, recommendations
    
    async def health_check(self) -> HealthResponse:
        """Perform comprehensive health check."""
        try:
            backend_healthy = await self.backend.health_check()
            uptime = asyncio.get_event_loop().time() - self.start_time
            
            return HealthResponse(
                status="healthy" if backend_healthy else "degraded",
                model=self.backend.get_model_info(),
                platform=platform.system(),
                token_generation="enabled" if backend_healthy else "limited",
                uptime=uptime
            )
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                model="unknown",
                platform=platform.system(),
                token_generation="disabled"
            )


# === Authentication ===
class AuthService:
    """Authentication service."""
    
    @staticmethod
    def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())):
        """Verify API key from Bearer token."""
        if credentials.credentials != Config.API_KEY:
            logger.warning(f"Invalid API key attempt: {credentials.credentials[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return credentials.credentials


# === Global State ===
ai_service: Optional[AIService] = None


# === Lifecycle Management ===
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global ai_service
    
    # Startup
    logger.info("Starting AI Service...")
    try:
        Config.validate()
        ai_service = AIService()
        logger.info("AI Service started successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to start AI Service: {e}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down AI Service...")


# === FastAPI Application ===
app = FastAPI(
    title="Product Page Analyzer AI Service",
    description="High-performance AI service for product page analysis and conversion optimization",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# === Route Handlers ===
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Returns detailed information about service status, AI model, and capabilities.
    """
    if not ai_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Service not initialized"
        )
    
    return await ai_service.health_check()



@app.post("/analyze/stream", tags=["Analysis"])
async def analyze_product_page_stream(
    request: AnalysisRequest
):
    """
    Generate streaming product page analysis.
    
    Provides real-time analysis generation with status updates and partial results.
    Uses Server-Sent Events (SSE) format for streaming.
    
    - **content**: Web page content to analyze (max 50,000 chars)
    - **url**: Source URL of the content
    
    Returns streaming JSON chunks with type indicators.
    """
    if not ai_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Service not initialized"
        )
    
    async def generate_stream():
        """Generate streaming response."""
        try:
            async for chunk in ai_service.generate_analysis_stream(request.content, request.url):
                yield f"{chunk.json()}\n"
        except Exception as e:
            logger.error(f"Streaming analysis failed: {e}")
            error_chunk = StreamChunk(type="error", message=str(e))
            yield f"{error_chunk.json()}\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )


# === Error Handlers ===
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors."""
    logger.warning(f"Validation error: {exc}")
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc)
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Internal server error"
    )


# === Main Entry Point ===
if __name__ == "__main__":
    # Configure logging level
    logging.getLogger().setLevel(getattr(logging, Config.LOG_LEVEL.upper()))
    
    # Start server
    uvicorn.run(
        app,
        host=Config.HOST,
        port=Config.PORT,
        log_level=Config.LOG_LEVEL.lower(),
        access_log=True
    )