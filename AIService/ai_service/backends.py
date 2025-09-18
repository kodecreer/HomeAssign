"""
AI Backend implementations for the AI Service.

Contains abstract base class and concrete implementations for different AI backends.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator

from .config import Config

logger = logging.getLogger(__name__)


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
            self.model_name = 'gemma3:4b' #Deep seek isn't multimodal. I want to try PDFs to see if that works#deepseek-r1:1.5b'
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