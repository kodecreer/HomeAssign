#!/bin/bash

# Product Page Reviewer - Service Startup Script
# This script starts all microservices for the Product Page Reviewer application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_warning "Killing existing process on port $port"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within timeout"
    return 1
}

# Main script starts here
echo "================================================================"
echo "           Product Page Reviewer - Service Startup"
echo "================================================================"

# Check if we're in the right directory
if [[ ! -d "MainService" ]] || [[ ! -d "AIService" ]] || [[ ! -d "FrontendService" ]]; then
    print_error "Please run this script from the HomeAssign root directory"
    print_error "Expected structure: HomeAssign/MainService, HomeAssign/AIService, and HomeAssign/FrontendService"
    exit 1
fi

# Check for required tools
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "Prerequisites check passed"

# Check and kill existing processes on required ports
if check_port 3000; then
    print_warning "Port 3000 is already in use"
    kill_port 3000
fi

if check_port 5173; then
    print_warning "Port 5173 is already in use"
    kill_port 5173
fi

if check_port 8001; then
    print_warning "Port 8001 is already in use"
    kill_port 8001
fi

# Check for environment files
print_status "Checking environment configuration..."

if [[ ! -f "MainService/.env" ]]; then
    print_warning "MainService/.env not found, creating default..."
    cat > MainService/.env << EOL
PORT=3000
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=ai_service_key_qAEq7JkjGV6otGzBiDwVwVvY
FRONTEND_URL=http://localhost:5173
EOL
fi

if [[ ! -f "AIService/.env" ]]; then
    print_warning "AIService/.env not found, creating default..."
    cat > AIService/.env << EOL
AI_SERVICE_API_KEY=ai_service_key_qAEq7JkjGV6otGzBiDwVwVvY
EOL
fi

print_success "Environment configuration ready"

# Setup Python virtual environment if needed
print_status "Setting up Python environment..."

if [[ ! -d "venv" ]]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install Python dependencies
if [[ ! -f "venv/.dependencies_installed" ]]; then
    print_status "Installing Python dependencies..."
    cd AIService
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    touch venv/.dependencies_installed
    print_success "Python dependencies installed"
else
    print_status "Python dependencies already installed"
fi

# Install Node.js dependencies
print_status "Checking Node.js dependencies..."
cd MainService
if [[ ! -d "node_modules" ]] || [[ ! -f ".dependencies_installed" ]]; then
    print_status "Installing Node.js dependencies..."
    npm install
    touch .dependencies_installed
    print_success "Node.js dependencies installed"
else
    print_status "Node.js dependencies already installed"
fi
cd ..

# Install Frontend dependencies
print_status "Checking Frontend dependencies..."
cd FrontendService
if [[ ! -d "node_modules" ]] || [[ ! -f ".dependencies_installed" ]]; then
    print_status "Installing Frontend dependencies..."
    npm install
    touch .dependencies_installed
    print_success "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi
cd ..

# Setup Ollama (macOS/non-Linux systems)
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_status "Checking Ollama setup (non-Linux system detected)..."
    
    if command -v ollama &> /dev/null; then
        print_status "Ollama found, checking for deepseek model..."
        
        # Start ollama serve in background if not running
        if ! pgrep -f "ollama serve" > /dev/null; then
            print_status "Starting Ollama server..."
            ollama serve &
            sleep 5
        fi
        
        # Check if deepseek model is available
        if ! ollama list | grep -q "deepseek-r1:1.5b"; then
            print_warning "deepseek-r1:1.5b model not found, pulling..."
            ollama pull deepseek-r1:1.5b
            print_success "deepseek-r1:1.5b model installed"
        else
            print_success "deepseek-r1:1.5b model already available"
        fi
    else
        print_warning "Ollama not found. Please install Ollama for optimal performance."
        print_warning "Visit: https://ollama.com/download"
        print_warning "Then run: ollama pull deepseek-r1:1.5b"
    fi
else
    print_status "Linux system detected - VLLM will be used for production"
fi

print_status "Starting services..."

# Create log directory
mkdir -p logs

# Start AI Service
print_status "Starting AI Service (FastAPI)..."
cd AIService
source ../venv/bin/activate
nohup python main.py > ../logs/ai-service.log 2>&1 &
AI_SERVICE_PID=$!
cd ..

# Wait for AI Service to be ready
if wait_for_service "http://localhost:8001/health" "AI Service"; then
    print_success "AI Service started successfully (PID: $AI_SERVICE_PID)"
else
    print_error "AI Service failed to start"
    kill $AI_SERVICE_PID 2>/dev/null || true
    exit 1
fi

# Start Main Service
print_status "Starting Main Service (Express.js)..."
cd MainService
nohup npm start > ../logs/main-service.log 2>&1 &
MAIN_SERVICE_PID=$!
cd ..

# Wait for Main Service to be ready
if wait_for_service "http://localhost:3000/health" "Main Service"; then
    print_success "Main Service started successfully (PID: $MAIN_SERVICE_PID)"
else
    print_error "Main Service failed to start"
    kill $MAIN_SERVICE_PID 2>/dev/null || true
    kill $AI_SERVICE_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend Service
print_status "Starting Frontend Service (React)..."
cd FrontendService
nohup npm run dev > ../logs/frontend-service.log 2>&1 &
FRONTEND_SERVICE_PID=$!
cd ..

# Wait for Frontend Service to be ready
if wait_for_service "http://localhost:5173" "Frontend Service"; then
    print_success "Frontend Service started successfully (PID: $FRONTEND_SERVICE_PID)"
else
    print_error "Frontend Service failed to start"
    kill $FRONTEND_SERVICE_PID 2>/dev/null || true
    kill $MAIN_SERVICE_PID 2>/dev/null || true
    kill $AI_SERVICE_PID 2>/dev/null || true
    exit 1
fi

# Final health checks
print_status "Performing final health checks..."

# Check AI Service health
AI_HEALTH=$(curl -s http://localhost:8001/health | jq -r '.status' 2>/dev/null || echo "unhealthy")
if [[ "$AI_HEALTH" == "healthy" ]]; then
    print_success "AI Service health check passed"
else
    print_error "AI Service health check failed"
fi

# Check Main Service health
MAIN_HEALTH=$(curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null || echo "unhealthy")
if [[ "$MAIN_HEALTH" == "healthy" ]]; then
    print_success "Main Service health check passed"
else
    print_error "Main Service health check failed"
fi

# Test end-to-end functionality
print_status "Running end-to-end test..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/scrape \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}' \
    --max-time 60 2>/dev/null || echo "failed")

if [[ "$TEST_RESPONSE" != "failed" ]] && echo "$TEST_RESPONSE" | jq -e '.content' >/dev/null 2>&1; then
    print_success "End-to-end test passed"
else
    print_warning "End-to-end test failed or timed out (this is normal for slow systems)"
fi

echo ""
echo "================================================================"
print_success "All services started successfully!"
echo "================================================================"
echo ""
echo "Service Status:"
echo "  • AI Service:      http://localhost:8001 (PID: $AI_SERVICE_PID)"
echo "  • Main Service:    http://localhost:3000 (PID: $MAIN_SERVICE_PID)"
echo "  • Frontend:        http://localhost:5173 (PID: $FRONTEND_SERVICE_PID)"
echo ""
echo "Log Files:"
echo "  • AI Service:      logs/ai-service.log"
echo "  • Main Service:    logs/main-service.log"
echo "  • Frontend:        logs/frontend-service.log"
echo ""
echo "To stop services:"
echo "  kill $AI_SERVICE_PID $MAIN_SERVICE_PID $FRONTEND_SERVICE_PID"
echo ""
echo "To view logs:"
echo "  tail -f logs/ai-service.log"
echo "  tail -f logs/main-service.log"
echo "  tail -f logs/frontend-service.log"
echo ""
print_success "Ready! Open http://localhost:5173 in your browser"

# Save PIDs for easy cleanup
echo "$AI_SERVICE_PID" > .ai-service.pid
echo "$MAIN_SERVICE_PID" > .main-service.pid
echo "$FRONTEND_SERVICE_PID" > .frontend-service.pid

# Keep script running and monitor services
print_status "Monitoring services... Press Ctrl+C to stop all services"

cleanup() {
    echo ""
    print_status "Shutting down services..."
    kill $AI_SERVICE_PID $MAIN_SERVICE_PID $FRONTEND_SERVICE_PID 2>/dev/null || true
    rm -f .ai-service.pid .main-service.pid .frontend-service.pid
    print_success "All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor services
while true; do
    if ! kill -0 $AI_SERVICE_PID 2>/dev/null; then
        print_error "AI Service died unexpectedly!"
        break
    fi
    
    if ! kill -0 $MAIN_SERVICE_PID 2>/dev/null; then
        print_error "Main Service died unexpectedly!"
        break
    fi
    
    if ! kill -0 $FRONTEND_SERVICE_PID 2>/dev/null; then
        print_error "Frontend Service died unexpectedly!"
        break
    fi
    
    sleep 5
done

cleanup