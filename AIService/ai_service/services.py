"""
Business logic services for the AI Service.

Contains the main AI service class and authentication service.
"""

import asyncio
import logging
import platform
from typing import AsyncGenerator, List, Tuple

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .backends import OllamaBackend
from .config import Config
from .models import HealthResponse, StreamChunk

logger = logging.getLogger(__name__)


class AIService:
    """Main AI service class."""
    
    def __init__(self):
        """Initialize AI service with appropriate backend."""
        self.start_time = asyncio.get_event_loop().time()
        self.backend = self._initialize_backend()
        self.analysis_prompt_template = self._load_prompt_template()
    
    def _initialize_backend(self) -> OllamaBackend:
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