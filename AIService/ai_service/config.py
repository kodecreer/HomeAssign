"""
Configuration module for the AI Service.

Contains all configuration settings, environment variables, and logging setup.
"""

import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


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


def setup_logging():
    """Configure logging for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('ai_service.log', mode='a')
        ]
    )
    return logging.getLogger(__name__)


logger = setup_logging()