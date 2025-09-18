# Product Page Reviewer

A microservices-based tool that analyzes product pages for UI/UX strengths and weaknesses using AI to improve conversion rates.

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