# Deployment Guide

## Overview

This guide covers both local development setup and production deployment of the Product Page Reviewer application.

**Author**: Kode Creer <kode.creer@gmail.com>  
**License**: All rights reserved - Unlicensed

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd HomeAssign
```

### 2. Install Dependencies

```bash
# Install AIService dependencies
cd AIService
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install MainService dependencies
cd ../MainService
npm install

# Install FrontendService dependencies
cd ../FrontendService
npm install
```

### 3. Environment Setup

```bash
# Create environment file for AIService
cd AIService
echo "AI_SERVICE_API_KEY=your-dev-api-key" > .env

# Set environment for MainService
cd ../MainService
echo "PORT=3000" > .env
echo "AI_SERVICE_URL=http://localhost:8001" >> .env
echo "AI_SERVICE_API_KEY=your-dev-api-key" >> .env
echo "NODE_ENV=development" >> .env

# Set environment for FrontendService
cd ../FrontendService
echo "REACT_APP_API_URL=http://localhost:3000" > .env
```

### 4. Start Services

#### Option A: Use Startup Scripts

```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

#### Option B: Manual Start

```bash
# Terminal 1 - Start AIService
cd AIService
source venv/bin/activate
python main.py

# Terminal 2 - Start MainService
cd MainService
npm run dev

# Terminal 3 - Start FrontendService
cd FrontendService
npm run dev
```

### 5. Access Application

- **Frontend**: <http://localhost:5173>
- **MainService API**: <http://localhost:3000/health>
- **AIService API**: <http://localhost:8001/health>

### Development Commands

```bash
# Build services
cd MainService && npm run build
cd FrontendService && npm run build

# Run tests (if available)
cd MainService && npm test
cd FrontendService && npm test
```

---

## Production Deployment (Docker)

### Production Prerequisites

- Docker Engine 20.10+
- 8GB+ RAM (for AI model)
- 50GB+ storage
- SSL certificates (for HTTPS)

### Docker Setup & Deployment

#### 1. Clone Repository

```bash
git clone <repository-url>
cd HomeAssign
```

#### 2. Build Docker Images

```bash
# Build AIService
cd AIService
docker build -t product-reviewer/aiservice:latest .

# Build MainService  
cd ../MainService
docker build -t product-reviewer/mainservice:latest .

# Build FrontendService
cd ../FrontendService
docker build -t product-reviewer/frontend:latest .
```

#### 3. Create Docker Network

```bash
# Create isolated network for services
docker network create product-reviewer-network
```

#### 4. Run Services

```bash
# 1. Start AIService first
docker run -d \
  --name aiservice \
  --network product-reviewer-network \
  -p 8001:8001 \
  -e AI_SERVICE_API_KEY="your-secure-api-key-here" \
  -v ai_models:/app/models \
  -v ai_logs:/app/logs \
  --restart unless-stopped \
  product-reviewer/aiservice:latest

# 2. Start MainService (depends on AIService)
docker run -d \
  --name mainservice \
  --network product-reviewer-network \
  -p 3000:3000 \
  -e PORT=3000 \
  -e AI_SERVICE_URL=http://aiservice:8001 \
  -e AI_SERVICE_API_KEY="your-secure-api-key-here" \
  -e NODE_ENV=production \
  -v main_logs:/app/logs \
  --restart unless-stopped \
  product-reviewer/mainservice:latest

# 3. Start Frontend (depends on MainService)
docker run -d \
  --name frontend \
  --network product-reviewer-network \
  -p 80:80 \
  -e REACT_APP_API_URL=http://mainservice:3000 \
  --restart unless-stopped \
  product-reviewer/frontend:latest
```

#### 5. Verify Deployment

```bash
# Check container status
docker ps

# Test service health
curl http://localhost:8001/health  # AIService
curl http://localhost:3000/health  # MainService  
curl http://localhost/             # Frontend

# View logs
docker logs aiservice
docker logs mainservice
docker logs frontend
```

## Access URLs

- **Frontend**: <http://localhost>
- **MainService API**: <http://localhost:3000/health>
- **AIService API**: <http://localhost:8001/health>

## Production Configuration

### Environment Variables

Create a `.env` file:

```env
# API Security
AI_SERVICE_API_KEY=your-production-api-key

# Service URLs (internal Docker networking)
AI_SERVICE_URL=http://aiservice:8001
FRONTEND_URL=http://frontend

# Production settings
NODE_ENV=production
```

### Resource Limits

Add resource limits to your docker run commands:

```bash
# Example with resource limits
docker run -d \
  --name aiservice \
  --memory=4g \
  --cpus=2 \
  # ... other options
```

Recommended limits:

- **AIService**: 4GB RAM, 2 CPU cores
- **MainService**: 1GB RAM, 1 CPU core  
- **Frontend**: 256MB RAM, 0.5 CPU cores

### Security Features

✅ **Non-root containers** - All services run as non-root users  
✅ **Health checks** - Comprehensive health monitoring  
✅ **Resource limits** - Prevents resource exhaustion  
✅ **Network isolation** - Private Docker network  
✅ **API key authentication** - Secure service communication  

## Production Scaling

### Horizontal Scaling

```bash
# Scale main service
docker-compose up -d --scale mainservice=3

# Scale with load balancer
# Add nginx/traefik for load balancing
```

### Kubernetes Deployment

```yaml
# Example k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aiservice
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aiservice
  template:
    metadata:
      labels:
        app: aiservice
    spec:
      containers:
      - name: aiservice
        image: your-registry/aiservice:latest
        ports:
        - containerPort: 8001
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
```

## Monitoring & Logging

### Health Monitoring

```bash
# Check all service health
curl http://localhost:8001/health  # AI Service
curl http://localhost:3000/health  # Main Service
curl http://localhost/             # Frontend
```

### Log Management

```bash
# View logs
docker-compose logs aiservice
docker-compose logs mainservice
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f --tail=100
```

### Persistent Volumes

- `ai_models`: AI model storage
- `ai_logs`: AI service logs
- `main_logs`: Main service logs

## SSL/HTTPS Configuration

### With Reverse Proxy (Recommended)

```yaml
# Add to docker-compose.yml
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/certs/key.pem;
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup & Recovery

### Data Backup

```bash
# Backup volumes
docker run --rm -v ai_models:/data -v $(pwd):/backup alpine tar czf /backup/ai_models.tar.gz -C /data .

# Backup application
tar czf app-backup-$(date +%Y%m%d).tar.gz HomeAssign/
```

### Recovery

```bash
# Restore volumes
docker run --rm -v ai_models:/data -v $(pwd):/backup alpine tar xzf /backup/ai_models.tar.gz -C /data

# Restart services
docker-compose down
docker-compose up -d
```

## Performance Optimization

### Image Optimization

```bash
# Multi-stage builds reduce image size
# Current image sizes:
# - aiservice: ~2GB (includes ML dependencies)
# - mainservice: ~500MB (Alpine + Node.js)  
# - frontend: ~50MB (nginx + static files)
```

### Resource Tuning

```yaml
# Optimize for your hardware
deploy:
  resources:
    limits:
      memory: 8G      # Increase for larger models
      cpus: '4'       # More CPUs for parallel processing
```

## Troubleshooting

### Common Issues

1. **AI Service OOM**: Increase memory limit to 8GB+
2. **Screenshot failures**: Ensure Chromium dependencies installed
3. **Connection refused**: Check service health and network connectivity

### Debug Commands

```bash
# Service status
docker-compose ps

# Resource usage
docker stats

# Service logs
docker-compose logs service-name

# Enter container for debugging
docker-compose exec aiservice bash
```

## Production Checklist

- [ ] Set secure API keys
- [ ] Configure SSL certificates
- [ ] Set up monitoring/alerting
- [ ] Configure backup strategy
- [ ] Test disaster recovery
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Test scaling procedures

## Support

For production support issues, contact:
**Kode Creer** <kode.creer@gmail.com>