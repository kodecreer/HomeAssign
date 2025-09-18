# Product Page Reviewer

A microservices-based tool that analyzes product pages for UI/UX strengths and weaknesses using AI to improve conversion rates.

## Quick Setup

To run the application:

1. Create a virtual environment called `venv` in root directory
2. Install dependencies listed in each service's requirements
3. Install Ollama and Gemma3:4b: `ollama pull gemma3:4b` after installing Ollama
4. Run the script `start-services.sh` - it should be working

**Note:** Dockerfiles are available for each service if that's more convenient.

## Approach 
Main approach I did was microservice architecture. Main reason is kind of pegged into that if doing a AI service. Since you usually don't want the server to do inference and servers for inference are pretty expensive to scale. This decoupling lets me scale any part on demand according to the traffic. Helping cut costs while keeping things simple and not try to fight tech stacks at what they are best at. I like to Vibe code and didn't see any rules against it. So this may be funny, but I just created a technical spec that outlined every engineering decision I want inside the app. From what tech stack to use to how I want it to solve a specific problem. After seeding in the technical document, I went on a walk and let Claude Code do its thing. After it stopped being useful, I made it clean up the project so its readable for a human and created extensive documentation so I can pick up whats going on and start coding. Specifically I created a file to onboard me into the project as if it was to train another employee how to get productive ASAP. I then just filled in TODOs in the code and let Claude Code fill in specific snippets. Since I had extra free time, I also added taking a screenshot feature cause why not? UI/UX is more visual thing than just order of the text. I picked specifically the backend because it would make most users be super scared if they got a screenshot taken on their local host. I filled in the TODOs and just as before let Claude Code write in the code. I make sure it stays in the human readable project design so the vibe code debugging problem doesn't waste my time. That way I can tell it specifically where to fix stuff instead of hoping it just get things right. I am definitely downplaying the coding I did, but thats the simplest way to describe it. I did code a decent amount of parts, but vibe coding helped a lot with the prototype. I did have a API key thing into there, but its not working super well so I just ignore it. Though in production I would put more effort in that part so a hacker don't hog the AI inference. I would keep the microservice architecture.Super scalable. Typescript is very easy to scale and is fast enough for most projects. Both to fix vibe code and to move fast with static type checks to prevent bugs as the project expand. I would also do cloudflare anti-bot to prevent the website from being a easy target against competitors. In addition to that I would make heavy use of caching and using services like BrightData to avoid issues of the web scraping arms race. I also picked Ollama for a specific reason being it is able to wrap around both llama.cpp for consumer devices and vLLM for batch serving in production. Both portable and robust wrapper across both services. I didn't implement batch processing, but that would a start in the microservice before it goes live. Probably the most important thing I would also take a lot more time for a heavily scrutinized code review. As in my opinion it kind of makes you feel like a manager, but you still have the same risks if you let bad code getting shipped the AI help built. I think another given is going in and redoing the CSS and website titles / icons to align with the branding of the service so it doesn't look generic but professional and simple. I would also use a more powerful multi-modal AI in production.

## Architecture

The system consists of three decoupled services:

- **AIService** (Python): VLLM server with deepseek-r1 1.5b model for analysis
- **MainService** (TypeScript/Express): Web scraping, API, and frontend
- **TestsService** (Python): Independent testing for both services

## Prerequisites

- Python 3.8+ (for AIService and TestsService)
- Node.js 18+ (for MainService)
- 8GB+ RAM (for VLLM model)

## Quick Start

### 1. Set up AIService (Python)

```bash
cd AIService
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```bash
AI_SERVICE_API_KEY=ai_service_key_12345_secure_token
```

Start the AI service:
```bash
python main.py
```

The AI service will be available at `http://localhost:8001`

### 2. Set up MainService (TypeScript)

```bash
cd MainService
npm install
```

Create `.env` file:
```bash
PORT=3000
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=ai_service_key_12345_secure_token
```

Build and start:
```bash
npm run build
npm start
```

Or for development:
```bash
npm run dev
```

The main service will be available at `http://localhost:3000`

### 3. Test the Services

```bash
cd TestsService
pip install requests
python main.py
```

## API Documentation

### MainService Endpoints

#### Analyze Product Page
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.socolachocolates.com/collections/chocolate-truffles/products/assorted-chocolate-truffle-box"
  }'
```

Response:
```json
{
  "analysis": "Overall analysis text...",
  "url": "https://...",
  "strengths": ["Clear product imagery", "Simple checkout process"],
  "weaknesses": ["Lack of urgency indicators", "Missing reviews"],
  "recommendations": ["Add customer reviews", "Include trust badges"],
  "metadata": {
    "title": "Product Page Title",
    "imageCount": 15,
    "linkCount": 42,
    "contentLength": 2847,
    "scrapedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Health Check
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

### AIService Endpoints

#### Direct Analysis (requires API key)
```bash
curl -X POST http://localhost:8001/analyze \
  -H "Authorization: Bearer ai_service_key_12345_secure_token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Product page content to analyze...",
    "url": "https://example.com/product"
  }'
```

#### AI Service Health
```bash
curl http://localhost:8001/health
```

## Frontend Usage

1. Open `http://localhost:3000` in your browser
2. Enter a product page URL
3. Click "Analyze Page"
4. View the structured analysis results

## Example URLs to Test

- `https://www.socolachocolates.com/collections/chocolate-truffles/products/assorted-chocolate-truffle-box`
- `https://www.apple.com/iphone/`
- `https://www.nike.com/t/air-max-270-mens-shoes-KkLcGR`

## Development

### Project Structure

```
├── AIService/              # Python VLLM service
│   ├── main.py            # FastAPI server with deepseek-r1
│   ├── requirements.txt   # Python dependencies
│   └── .env              # API key configuration
├── MainService/           # TypeScript Express service
│   ├── src/
│   │   ├── index.ts      # Express server
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic
│   ├── public/           # Frontend HTML/CSS/JS
│   ├── package.json      # Node.js dependencies
│   └── .env             # Service configuration
├── TestsService/          # Python testing service
│   └── main.py           # End-to-end tests
└── README.md             # This file
```

### Running in Development Mode

1. **AIService**: `python main.py`
2. **MainService**: `npm run dev`
3. **TestsService**: `python main.py`

### Building for Production

```bash
# MainService
cd MainService
npm run build
npm start
```

## API Key Management

### Development
Both services use the same API key stored in `.env` files:
```
AI_SERVICE_API_KEY=ai_service_key_12345_secure_token
```

### Production
For production deployment, implement the API key rotation script:

```bash
python scripts/rotate_api_keys.py
```

## Troubleshooting

### Common Issues

1. **VLLM Model Loading Failed**
   - Ensure you have sufficient RAM (8GB+)
   - Check internet connection for model download
   - Try running with `--model-path` flag for local models

2. **Connection Refused Between Services**
   - Verify both services are running
   - Check ports 3000 and 8001 are available
   - Ensure API keys match in both .env files

3. **Web Scraping Failures**
   - Some sites block scrapers - this is expected
   - Try different URLs if tests fail
   - Check network connectivity

### Logs

- **AIService**: Logs printed to console
- **MainService**: Logs printed to console
- **TestsService**: Comprehensive test output

## Performance Notes

- **First Request**: ~30-60 seconds (model loading)
- **Subsequent Requests**: ~5-15 seconds
- **Model Memory**: ~2-4GB RAM
- **Concurrent Requests**: Limited by GPU/CPU resources

## Security Considerations

- API keys are required for AI service access
- No authentication on MainService (add as needed)
- Web scraping respects robots.txt where possible
- Content is processed locally (no external API calls)

## Extending the System

### Adding New Analysis Features
1. Modify the prompt in `AIService/main.py`
2. Update response parsing logic
3. Adjust frontend to display new fields

### Adding Authentication
1. Implement auth middleware in MainService
2. Add user management endpoints
3. Secure the frontend with login

### Scaling for Production
1. Use container orchestration (Docker/Kubernetes)
2. Implement load balancing
3. Add database for result caching
4. Set up monitoring and logging

## Author

**Kode Creer** <kode.creer@gmail.com>

## License

This project is unlicensed - all rights reserved.

Copyright © 2024-2025 Kode Creer. All rights reserved.

No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.