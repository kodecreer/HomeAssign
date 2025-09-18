"""
Product Page Analyzer AI Service

A high-performance FastAPI service that provides AI-powered analysis of web pages
for conversion rate optimization. Uses Ollama backend with VLLM support.

Architecture:
- FastAPI with async/await patterns for high concurrency
- Pydantic models for type safety and validation
- Bearer token authentication for security
- Streaming responses for real-time feedback
- Comprehensive error handling and logging
- Modular design for maintainability

Author: kodecreer <kode.creer@gmail.com>
Version: 1.0.0
License: All rights reserved - Unlicensed
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, status

from ai_service.config import Config, setup_logging
from ai_service.routes import router, set_ai_service
from ai_service.services import AIService

# Setup logging
logger = setup_logging()

# Global State
ai_service_instance = None


# === Lifecycle Management ===
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global ai_service_instance
    
    # Startup
    logger.info("Starting AI Service...")
    try:
        Config.validate()
        ai_service_instance = AIService()
        set_ai_service(ai_service_instance)
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

# Include routes
app.include_router(router)


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