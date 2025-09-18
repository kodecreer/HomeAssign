#!/bin/bash

# Product Page Reviewer - Service Shutdown Script
# This script stops all microservices for the Product Page Reviewer application

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
    local service_name=$2
    if check_port $port; then
        print_status "Stopping $service_name on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
        
        # Verify the process was killed
        if check_port $port; then
            print_error "Failed to stop $service_name on port $port"
            return 1
        else
            print_success "$service_name stopped successfully"
            return 0
        fi
    else
        print_status "$service_name on port $port is not running"
        return 0
    fi
}

# Function to kill process by PID file
kill_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill -TERM "$pid" 2>/dev/null || true
            sleep 3
            
            # If still running, force kill
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name (PID: $pid)..."
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
            
            # Verify the process was killed
            if kill -0 "$pid" 2>/dev/null; then
                print_error "Failed to stop $service_name (PID: $pid)"
            else
                print_success "$service_name stopped successfully"
            fi
        else
            print_status "$service_name PID file exists but process is not running"
        fi
        
        # Clean up PID file
        rm -f "$pid_file"
    fi
}

echo "================================================================"
echo "           Product Page Reviewer - Service Shutdown"
echo "================================================================"

# Method 1: Try to stop services using PID files (if they exist)
print_status "Checking for running services using PID files..."

kill_pid_file ".ai-service.pid" "AI Service"
kill_pid_file ".main-service.pid" "Main Service" 
kill_pid_file ".frontend-service.pid" "Frontend Service"

# Method 2: Stop services by port (fallback method)
print_status "Checking for services running on known ports..."

kill_port 8001 "AI Service"
kill_port 3000 "Main Service"
kill_port 5173 "Frontend Service"

# Method 3: Kill any remaining related processes (nuclear option)
print_status "Checking for any remaining related processes..."

# Kill any remaining Python processes running main.py in AIService
AI_PIDS=$(pgrep -f "python.*main.py" 2>/dev/null || true)
if [[ -n "$AI_PIDS" ]]; then
    print_status "Found remaining AI Service processes, stopping them..."
    echo "$AI_PIDS" | xargs kill -9 2>/dev/null || true
    print_success "Remaining AI Service processes stopped"
fi

# Kill any remaining Node.js processes for MainService
MAIN_PIDS=$(pgrep -f "node.*MainService" 2>/dev/null || pgrep -f "ts-node.*MainService" 2>/dev/null || true)
if [[ -n "$MAIN_PIDS" ]]; then
    print_status "Found remaining Main Service processes, stopping them..."
    echo "$MAIN_PIDS" | xargs kill -9 2>/dev/null || true
    print_success "Remaining Main Service processes stopped"
fi

# Kill any remaining Node.js processes for FrontendService
FRONTEND_PIDS=$(pgrep -f "node.*FrontendService" 2>/dev/null || pgrep -f "vite.*FrontendService" 2>/dev/null || true)
if [[ -n "$FRONTEND_PIDS" ]]; then
    print_status "Found remaining Frontend Service processes, stopping them..."
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null || true
    print_success "Remaining Frontend Service processes stopped"
fi

# Clean up any remaining PID files
print_status "Cleaning up PID files..."
rm -f .ai-service.pid .main-service.pid .frontend-service.pid

# Final verification
print_status "Verifying all services are stopped..."

all_stopped=true

if check_port 8001; then
    print_error "AI Service (port 8001) is still running"
    all_stopped=false
fi

if check_port 3000; then
    print_error "Main Service (port 3000) is still running"
    all_stopped=false
fi

if check_port 5173; then
    print_error "Frontend Service (port 5173) is still running"
    all_stopped=false
fi

echo ""
echo "================================================================"
if [[ "$all_stopped" == true ]]; then
    print_success "All services stopped successfully!"
else
    print_error "Some services may still be running. Check manually:"
    echo "  lsof -i :8001    # Check AI Service"
    echo "  lsof -i :3000    # Check Main Service"  
    echo "  lsof -i :5173    # Check Frontend Service"
fi
echo "================================================================"
echo ""

if [[ "$all_stopped" == true ]]; then
    print_success "You can now restart services with: ./start-services.sh"
else
    print_warning "You may need to manually kill remaining processes before restarting"
fi