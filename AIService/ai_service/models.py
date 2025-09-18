"""
Pydantic models for the AI Service.

Contains all request/response models and data validation schemas.
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator


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