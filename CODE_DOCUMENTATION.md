# Product Page Reviewer - Code Documentation

## Architecture Overview

The Product Page Reviewer is built using a microservices architecture with clear separation of concerns, ensuring scalability, maintainability, and security.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  React TypeScript Application (Vite)                       ││
│  │  - Modern React components with TypeScript                 ││
│  │  - Responsive UI with gradient design                      ││
│  │  - Client-side form validation                             ││
│  │  - Real-time status updates                                ││
│  │  - Error handling and user feedback                        ││
│  │  - Component-based architecture                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │ HTTP/HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Main Service (Express.js)                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  API Gateway & Business Logic                              ││
│  │  - Route handling (/api/analyze, /health)                  ││
│  │  - Input validation and sanitization                       ││
│  │  - Web scraping orchestration                              ││
│  │  - Error handling and logging                              ││
│  │  - Static file serving                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Web Scraper Service (Cheerio)                             ││
│  │  - HTTP content fetching                                   ││
│  │  - HTML parsing and content extraction                     ││
│  │  - Image and link discovery                                ││
│  │  - Content sanitization                                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │ HTTP + Bearer Auth
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Service (FastAPI)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  AI Analysis Engine                                         ││
│  │  - Bearer token authentication                             ││
│  │  - Content analysis with deepseek-r1 model                 ││
│  │  - Streaming response generation                           ││
│  │  - Platform-aware backend selection                       ││
│  │  - Structured output parsing                               ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  AI Backend (VLLM/Ollama)                                  ││
│  │  - VLLM for Linux production                               ││
│  │  - Ollama for macOS development                            ││
│  │  - Automatic fallback handling                             ││
│  │  - Model management and health checks                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Service Details

### 1. React Frontend Service

**Location**: `/frontend-service/`

**Purpose**: Modern React TypeScript application for user interface and interaction.

**Key Files**:
- `src/App.tsx` - Main application component
- `src/components/UrlInput.tsx` - URL input form component
- `src/components/ScrapedContentDisplay.tsx` - Scraped content viewer
- `src/components/AnalysisDisplay.tsx` - AI analysis results display
- `src/components/LoadingSpinner.tsx` - Loading state indicator
- `src/services/api.ts` - API service layer
- `src/types/scraper.ts` - TypeScript interfaces

**Responsibilities**:
- Provide responsive user interface
- Handle user input validation
- Display scraped content and analysis results
- Manage application state
- Communicate with backend APIs
- Error handling and user feedback

**Technology Stack**:
- React 18 with TypeScript
- Vite for build tooling
- CSS modules for styling
- Fetch API for HTTP requests

### 2. Main Service (Express.js)

**Location**: `/MainService/`

**Purpose**: API gateway, business logic orchestration, and static file serving.

**Key Files**:
- `src/index.ts` - Application entry point and middleware setup
- `src/routes/analyzer.ts` - Analysis API endpoints
- `src/routes/scraper.ts` - Web scraping API endpoints
- `src/services/scraper.ts` - Web scraping functionality
- `src/services/aiClient.ts` - AI service communication

**Responsibilities**:
- Handle HTTP requests and routing
- Validate and sanitize input data
- Orchestrate web scraping operations
- Communicate with AI service
- Serve static frontend files
- Error handling and logging

**API Endpoints**:
- `GET /health` - Service health check
- `POST /scrape` - Scrape webpage content
- `POST /api/analyze` - Analyze scraped content (standard)
- `POST /api/analyze/stream` - Analyze product page (streaming)

**Security Features**:
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- Request size limits
- Timeout handling

### 3. AI Service (FastAPI)

**Location**: `/AIService/`

**Purpose**: Provide AI-powered content analysis using advanced language models.

**Key Files**:
- `main.py` - FastAPI application and endpoint definitions
- `main_refactored.py` - Enhanced version with better architecture

**Responsibilities**:
- Authenticate API requests with Bearer tokens
- Generate product page analysis using AI models
- Parse and structure analysis results
- Provide streaming responses for real-time feedback
- Handle model loading and management
- Platform-specific backend selection

**API Endpoints**:
- `GET /health` - AI service health and model status
- `POST /analyze` - Generate structured analysis
- `POST /analyze/stream` - Generate streaming analysis

**AI Backends**:
- **VLLM**: Production-grade serving for Linux systems
- **Ollama**: Local development for macOS systems
- **Automatic Fallback**: Graceful degradation between backends

**Model**: deepseek-r1-1.5b (1.5B parameter model optimized for reasoning)

## Code Quality Features

### Type Safety
- TypeScript for all JavaScript code
- Pydantic models for Python API validation
- Comprehensive interfaces and type definitions
- Runtime type checking and validation

### Error Handling
- Comprehensive try-catch blocks
- Graceful degradation strategies
- Detailed error logging
- User-friendly error messages
- Timeout handling for long operations

### Documentation
- JSDoc comments for all functions
- Python docstrings following conventions
- API documentation with examples
- Architecture diagrams and explanations
- Inline code comments for complex logic

### Security
- Input validation and sanitization
- Authentication with Bearer tokens
- CORS configuration
- Security headers with Helmet.js
- Request size and rate limiting
- URL validation and blacklisting

### Performance
- Efficient HTML parsing with Cheerio
- Streaming responses for large operations
- Connection pooling and keep-alive
- Memory limits and garbage collection
- Optimized model loading and caching

### Maintainability
- Modular architecture with clear separation
- Dependency injection patterns
- Configuration management
- Comprehensive testing capabilities
- Logging and monitoring hooks

## Data Flow

### Standard Analysis Flow

1. **User Input**: User enters product page URL in React frontend
2. **Frontend Validation**: Client-side URL validation and sanitization
3. **Scraping Request**: POST request to `/scrape` with URL
4. **Main Service Scraping**:
   - Validate request parameters
   - Scrape webpage content using Cheerio
   - Extract title, content, images, and links
   - Sanitize and limit content size
   - Return scraped content to frontend
5. **Frontend Display**: Show scraped content with analysis option
6. **Analysis Request**: User clicks analyze, POST request to `/api/analyze` with scraped content
7. **AI Service Communication**:
   - Forward content to AI service with authentication
   - Wait for analysis completion
   - Handle timeouts and retries
8. **AI Analysis**:
   - Authenticate request using Bearer token
   - Generate analysis using deepseek model
   - Parse results into structured format
   - Return summary, key points, sentiment, categories
9. **Response Processing**:
   - Transform AI analysis to match frontend interface
   - Calculate metadata (word count, reading time)
   - Format response for frontend consumption
10. **Frontend Display**:
    - Show loading spinner during processing
    - Display structured analysis results
    - Handle errors with user-friendly messages

### Streaming Analysis Flow

1. **SSE Connection**: Frontend establishes Server-Sent Events connection
2. **Real-time Updates**: Backend sends progressive updates:
   - `status`: "Starting web scraping..."
   - `status`: "Content scraped, starting AI analysis..."
   - `partial`: Incremental analysis content
   - `complete`: Final analysis results
   - `metadata`: Page statistics and timing
3. **Frontend Updates**: Live progress display with status messages

## Configuration

### Environment Variables

**Main Service** (`.env`):
```bash
PORT=3000
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=ai_service_key_qAEq7JkjGV6otGzBiDwVwVvY
```

**AI Service** (`.env`):
```bash
AI_SERVICE_API_KEY=ai_service_key_qAEq7JkjGV6otGzBiDwVwVvY
HOST=0.0.0.0
PORT=8001
LOG_LEVEL=INFO
```

### Model Configuration

The system automatically detects the platform and configures the appropriate AI backend:

**Linux (Production)**:
- Uses VLLM for high-performance serving
- GPU acceleration with memory optimization
- Batch processing capabilities

**macOS (Development)**:
- Uses Ollama for local development
- Automatic model discovery and downloading
- Fallback to smaller models if needed

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock dependencies and external services
- Edge case validation
- Error condition testing

### Integration Tests
- End-to-end API testing
- Service communication validation
- Database interaction testing
- Authentication flow testing

### Performance Tests
- Load testing with concurrent requests
- Memory usage monitoring
- Response time validation
- Timeout and retry testing

### Security Tests
- Input validation testing
- Authentication bypass attempts
- Rate limiting validation
- CORS policy testing

## Deployment

### Development
```bash
# Start services manually
cd AIService && source ../venv/bin/activate && python main.py &
cd MainService && npm start &
cd frontend-service && npm run dev &
```

### Production
```bash
# Use startup script
./start-services.sh
```

### Docker (Future Enhancement)
```dockerfile
# Multi-stage build for production deployment
FROM node:18-alpine AS main-service
FROM python:3.11-slim AS ai-service
```

## Monitoring and Logging

### Application Logs
- Structured logging with timestamps
- Request/response logging
- Error tracking with stack traces
- Performance metrics

### Health Checks
- Service availability monitoring
- AI model status checking
- Database connection validation
- External dependency monitoring

### Metrics
- Request count and response times
- Error rates and types
- Resource usage (CPU, memory)
- AI model performance statistics

## Future Enhancements

### Scalability
- Horizontal service scaling
- Load balancing implementation
- Database integration for caching
- Queue-based processing

### Features
- User authentication and accounts
- Analysis history and caching
- Batch processing capabilities
- Advanced filtering and search

### Security
- Rate limiting per user
- API key management
- Audit logging
- Content filtering

### Performance
- CDN integration
- Response caching
- Optimized model serving
- Background processing

---

**Generated by**: Claude Code Assistant  
**Last Updated**: 2025-09-17  
**Version**: 2.0.0