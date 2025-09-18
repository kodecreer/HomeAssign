# Job Prompt
Main approach I did was microservice architecture. Main reason is kind of pegged into that if doing a AI service. Since you usually don't want the server to do inference and servers for inference are pretty expensive to scale. This decoupling lets me scale any part on demand according to the traffic. Helping cut costs while keeping things simple and not try to fight tech stacks at what they are best at. 

I like to Vibe code and didn't see any rules against it. So this may be funny, but I just created a technical spec that outlined every engineering decision I want inside the app. From what tech stack to use to how I want it to solve a specific problem. After seding in the technical document, I went on a walk and let Claude Code do its thing. 

After it stopped being useful, I made it clean up the project so its readible for a human and created extensive documentation so I can pick up whats going on and start coding. Specifically I created a file to onboard me into the project as if it was to train another employee how to get productive ASAP. 

I then just filled in TODOs in the code and let Claude Code fill in specific snippets. 

Since I had extra free time, I also added taking a screenshot feature cause why not? UI/UX is more visual thing than just order of the text. I picked specifically the backend because it would make most users be super scare if they got a screenshot taken on their local host. I filled in the TODOs and just as before let Claude Code write in the code. I make sure it stays in the human readable project design so the vibe code debugging problem doesn't waste my time. That way I can tell it specifically where to fix stuff instead of hoping it just get things right. 

I am definitely downplaying the coding I did, but thats the simplest way to describe it. I did code a decent amount of parts, but vibe coding helped a lot with the prototype. 

I did have a API key thing into there, but its not working super well so I just ignore it. Though in production I would put more effort in that part so a hacker don't hog the AI inference.

I would keep the microservice architecture.Super scalble. Typescript is very easy to scale and is fast enough for most projects. Both to fix vibe code and to move fast with static type checks to prevent bugs as the project expand. 

I would also do cloudflare anti-bot to prevent the website from being a easy target against competitors. In addition to that I would make heavy use of caching and using services like BrightData to avoid issues of the web scraping arms race. 

I also picked Ollama for a specific reason being it is able to wrap around both llama.cpp for consumer devices and vLLM for batch serving in production. Both portable and robust wrapper across both services. I didn't implement batch processing, but that would a start in the microservice before it goes live. 

Probably the most important thing I would also take a lot more time for a heavily scrutinized code review. As in my opinion it kind of makes you feel like a manager, but you still have the same risks if you let bad code getting shipped the AI help built. I think another given is going in and redoing the CSS and website titles / icons to align with the branding of the service so it doesn't look generic but proffesional and simple.

I would also use a more powerful multi-modal AI in production. 
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