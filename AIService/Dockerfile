# AIService Dockerfile - Production Ready
# Author: Kode Creer <kode.creer@gmail.com>
# License: All rights reserved - Unlicensed

# Use Python 3.11 slim image for smaller size and security
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables for production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

# Install system dependencies with security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies with security considerations
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip check

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1001 aiservice && \
    mkdir -p /app/logs /app/models && \
    chown -R aiservice:aiservice /app
    
# Copy application code
COPY --chown=aiservice:aiservice . .

# Switch to non-root user
USER aiservice

# Expose port
EXPOSE 8001

# Health check with longer timeout for AI model loading
HEALTHCHECK --interval=30s --timeout=60s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start the application with proper signal handling
CMD ["python", "-u", "main.py"]