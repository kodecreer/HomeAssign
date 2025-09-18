# AI Service

A high-performance FastAPI service that provides AI-powered analysis of web pages for conversion rate optimization.

## Features

- **FastAPI Framework**: High-performance async API with automatic OpenAPI documentation
- **AI-Powered Analysis**: Uses Ollama with DeepSeek R1 model for intelligent product page analysis
- **Streaming Responses**: Real-time analysis generation with Server-Sent Events
- **Modular Architecture**: Clean separation of concerns for maintainability
- **Type Safety**: Full Pydantic model validation and type hints
- **Production Ready**: Comprehensive logging, error handling, and health checks

## Architecture

```
ai_service/
├── config.py      # Configuration management and logging
├── models.py      # Pydantic data models and validation
├── backends.py    # AI backend implementations (Ollama)
├── services.py    # Business logic and AI service orchestration
└── routes.py      # FastAPI route handlers and endpoints
```

## Quick Start

### Prerequisites

- Python 3.8+
- Ollama installed with DeepSeek R1 model
- Virtual environment (recommended)

### Method 1: Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd AIService

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# AI_SERVICE_API_KEY=your-secret-key
# HOST=0.0.0.0
# PORT=8001
# LOG_LEVEL=INFO

# 5. Ensure Ollama is running with the model
ollama pull deepseek-r1:1.5b
ollama serve

# 6. Start the service
python main.py
```

### Method 2: Docker Setup

```bash
# 1. Build the Docker image
docker build -t ai-service .

# 2. Run with environment variables
docker run -d \
  --name ai-service \
  -p 8001:8001 \
  -e AI_SERVICE_API_KEY=your-secret-key \
  -e HOST=0.0.0.0 \
  -e PORT=8001 \
  --network host \
  ai-service

# 3. Check logs
docker logs ai-service

# 4. Stop the service
docker stop ai-service
```


### Access the Service

The API will be available at:
- **Main API**: http://localhost:8001
- **Interactive docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Health check**: http://localhost:8001/health

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status and model information.

### Streaming Analysis
```
POST /analyze/stream
Content-Type: application/json

{
  "content": "Web page content to analyze...",
  "url": "https://example.com/product-page"
}
```
Returns streaming analysis with strengths, weaknesses, and recommendations.

## Configuration

Environment variables in `.env`:

```bash
AI_SERVICE_API_KEY=your-api-key-here
HOST=0.0.0.0
PORT=8001
LOG_LEVEL=INFO
```

## Development

### Running Tests

```bash
# Run tests
python -m pytest tests/

# Run specific test
python tests/test_product_page_reviewer.py
```

### Code Quality

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy ai_service/
```

## Deployment

The service is production-ready and can be deployed using:

- **Docker**: Build container with `Dockerfile`
- **Cloud Platforms**: Deploy to AWS, GCP, Azure
- **Process Managers**: Use with PM2, systemd, or supervisor

## License

This project is unlicensed - all rights reserved.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions, please open an issue on the GitHub repository.