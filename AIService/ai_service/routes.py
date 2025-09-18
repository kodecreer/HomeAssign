"""
API routes for the AI Service.

Contains all FastAPI route handlers and endpoint definitions.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from .models import AnalysisRequest, HealthResponse
from .services import AIService

logger = logging.getLogger(__name__)

# Global service instance
ai_service: Optional[AIService] = None

# Create router
router = APIRouter()


def set_ai_service(service: AIService):
    """Set the global AI service instance."""
    global ai_service
    ai_service = service


@router.get("/health", response_model=HealthResponse, tags=["Health"])
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


@router.post("/analyze/stream", tags=["Analysis"])
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
                yield f"{chunk.model_dump_json()}\n"
        except Exception as e:
            logger.error(f"Streaming analysis failed: {e}")
            from .models import StreamChunk
            error_chunk = StreamChunk(type="error", message=str(e))
            yield f"{error_chunk.model_dump_json()}\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )