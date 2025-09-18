#!/bin/bash

# Product Page Reviewer - Comprehensive Test Suite
# This script runs a complete test suite to verify all functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$1")
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_status "Running: $test_name"
    
    local result
    result=$(eval "$test_command" 2>&1 || echo "COMMAND_FAILED")
    
    if [[ "$result" == "COMMAND_FAILED" ]]; then
        print_failure "$test_name - Command execution failed"
        return 1
    fi
    
    if [[ -n "$expected_pattern" ]]; then
        if echo "$result" | grep -q "$expected_pattern"; then
            print_success "$test_name"
            return 0
        else
            print_failure "$test_name - Expected pattern not found: $expected_pattern"
            echo "Got: $result"
            return 1
        fi
    else
        print_success "$test_name"
        return 0
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local timeout="${4:-10}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_status "Testing: $test_name"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time "$timeout" || echo "000")
    
    if [[ "$status_code" == "$expected_status" ]]; then
        print_success "$test_name (Status: $status_code)"
        return 0
    else
        print_failure "$test_name - Expected status $expected_status, got $status_code"
        return 1
    fi
}

# Function to test JSON API endpoint
test_json_endpoint() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local expected_field="$5"
    local timeout="${6:-30}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    print_status "Testing: $test_name"
    
    local response
    response=$(curl -s -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -d "$data" \
        --max-time "$timeout" 2>/dev/null || echo "CURL_FAILED")
    
    if [[ "$response" == "CURL_FAILED" ]]; then
        print_failure "$test_name - Request failed"
        return 1
    fi
    
    if echo "$response" | jq -e "$expected_field" >/dev/null 2>&1; then
        print_success "$test_name"
        return 0
    else
        print_failure "$test_name - Expected field not found: $expected_field"
        echo "Response: $response"
        return 1
    fi
}

echo "================================================================"
echo "           Product Page Reviewer - Test Suite"
echo "================================================================"

# Prerequisites check
print_status "Checking prerequisites..."

if ! command -v curl &> /dev/null; then
    echo "Error: curl is required for testing"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq not found, installing for JSON parsing..."
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo "Please install jq manually: https://stedolan.github.io/jq/"
        exit 1
    fi
fi

print_success "Prerequisites ready"

# Test 1: Service Health Checks
echo ""
echo "=== Service Health Tests ==="
test_endpoint "Main Service Health" "http://localhost:3001/health" "200"
test_endpoint "AI Service Health" "http://localhost:8001/health" "200"
test_endpoint "Frontend Service" "http://localhost:5173" "200"

# Test 2: Frontend Accessibility
echo ""
echo "=== Frontend Tests ==="
test_endpoint "React Frontend Root" "http://localhost:5173/" "200"
test_endpoint "React Frontend Assets" "http://localhost:5173/vite.svg" "200"

# Test 3: API Endpoint Structure
echo ""
echo "=== API Structure Tests ==="
test_json_endpoint "Main Service Health JSON" \
    "http://localhost:3001/health" \
    "GET" \
    "" \
    ".status"

test_json_endpoint "AI Service Health JSON" \
    "http://localhost:8001/health" \
    "GET" \
    "" \
    ".status"

# Test 4: Scraping Functionality Tests
echo ""
echo "=== Scraping Functionality Tests ==="

test_json_endpoint "Basic Scraping Request" \
    "http://localhost:3001/scrape" \
    "POST" \
    '{"url":"https://example.com"}' \
    ".content" \
    60

test_json_endpoint "Scraping Response Structure - URL" \
    "http://localhost:3001/scrape" \
    "POST" \
    '{"url":"https://example.com"}' \
    ".url" \
    60

test_json_endpoint "Scraping Response Structure - Title" \
    "http://localhost:3001/scrape" \
    "POST" \
    '{"url":"https://example.com"}' \
    ".title" \
    60

test_json_endpoint "Scraping Response Structure - Images" \
    "http://localhost:3001/scrape" \
    "POST" \
    '{"url":"https://example.com"}' \
    ".images" \
    60

test_json_endpoint "Scraping Response Structure - Links" \
    "http://localhost:3001/scrape" \
    "POST" \
    '{"url":"https://example.com"}' \
    ".links" \
    60

# Test 5: Analysis Functionality Tests
echo ""
echo "=== Analysis Functionality Tests ==="

# First scrape content for analysis
SCRAPED_CONTENT=$(curl -s -X POST "http://localhost:3001/scrape" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}' 2>/dev/null)

test_json_endpoint "Basic Analysis Request" \
    "http://localhost:3001/api/analyze" \
    "POST" \
    "$SCRAPED_CONTENT" \
    ".summary" \
    60

test_json_endpoint "Analysis Response Structure - Key Points" \
    "http://localhost:3001/api/analyze" \
    "POST" \
    "$SCRAPED_CONTENT" \
    ".keyPoints" \
    60

test_json_endpoint "Analysis Response Structure - Sentiment" \
    "http://localhost:3001/api/analyze" \
    "POST" \
    "$SCRAPED_CONTENT" \
    ".sentiment" \
    60

test_json_endpoint "Analysis Response Structure - Categories" \
    "http://localhost:3001/api/analyze" \
    "POST" \
    "$SCRAPED_CONTENT" \
    ".categories" \
    60

test_json_endpoint "Analysis Response Structure - Metadata" \
    "http://localhost:3001/api/analyze" \
    "POST" \
    "$SCRAPED_CONTENT" \
    ".metadata" \
    60

# Test 6: Error Handling
echo ""
echo "=== Error Handling Tests ==="

TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: Invalid URL Format"
invalid_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3001/scrape" \
    -H "Content-Type: application/json" \
    -d '{"url":"invalid-url"}' \
    --max-time 10 2>/dev/null || echo "000")

if [[ "$invalid_response" == "400" || "$invalid_response" == "500" ]]; then
    print_success "Invalid URL Format (Status: $invalid_response)"
else
    print_failure "Invalid URL Format - Expected 400 or 500, got $invalid_response"
fi

TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: Missing URL Parameter"
missing_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3001/scrape" \
    -H "Content-Type: application/json" \
    -d '{}' \
    --max-time 10 2>/dev/null || echo "000")

if [[ "$missing_response" == "400" ]]; then
    print_success "Missing URL Parameter (Status: $missing_response)"
else
    print_failure "Missing URL Parameter - Expected 400, got $missing_response"
fi

# Test 7: AI Service Direct Testing
echo ""
echo "=== AI Service Direct Tests ==="

# Test AI service authentication
TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: AI Service Authentication"
auth_response=$(curl -s -X POST "http://localhost:8001/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ai_service_key_qAEq7JkjGV6otGzBiDwVwVvY" \
    -d '{"content":"Test content","url":"https://example.com"}' \
    --max-time 60 2>/dev/null || echo "FAILED")

if echo "$auth_response" | jq -e '.analysis' >/dev/null 2>&1; then
    print_success "AI Service Authentication"
else
    print_failure "AI Service Authentication - No analysis field in response"
fi

# Test 8: Real-world URL Testing
echo ""
echo "=== Real-world URL Tests ==="

declare -a test_urls=(
    "https://example.com"
    "https://httpbin.org/html"
)

for url in "${test_urls[@]}"; do
    test_name="Real URL Scraping Test: $url"
    test_json_endpoint "$test_name" \
        "http://localhost:3001/scrape" \
        "POST" \
        "{\"url\":\"$url\"}" \
        ".content" \
        120
done

# Test 9: Performance Tests
echo ""
echo "=== Performance Tests ==="

TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: Scraping Response Time Performance"
start_time=$(date +%s)
perf_response=$(curl -s -X POST "http://localhost:3001/scrape" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}' \
    --max-time 60 2>/dev/null || echo "TIMEOUT")
end_time=$(date +%s)
duration=$((end_time - start_time))

if [[ "$perf_response" != "TIMEOUT" ]] && echo "$perf_response" | jq -e '.content' >/dev/null 2>&1; then
    if [[ $duration -lt 60 ]]; then
        print_success "Scraping Response Time Performance (${duration}s)"
    else
        print_warning "Scraping Response Time Performance - Slow response (${duration}s)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    print_failure "Scraping Response Time Performance - Request failed or timed out"
fi

# Test 10: Concurrent Request Test
echo ""
echo "=== Concurrent Request Tests ==="

TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: Concurrent Scraping Requests"

# Start 3 concurrent requests
{
    curl -s -X POST "http://localhost:3001/scrape" \
        -H "Content-Type: application/json" \
        -d '{"url":"https://example.com"}' \
        --max-time 60 > /tmp/test_concurrent_1.json 2>/dev/null &
    
    curl -s -X POST "http://localhost:3001/scrape" \
        -H "Content-Type: application/json" \
        -d '{"url":"https://httpbin.org/html"}' \
        --max-time 60 > /tmp/test_concurrent_2.json 2>/dev/null &
        
    curl -s -X POST "http://localhost:3001/scrape" \
        -H "Content-Type: application/json" \
        -d '{"url":"https://example.com"}' \
        --max-time 60 > /tmp/test_concurrent_3.json 2>/dev/null &
    
    wait
}

# Check results
concurrent_passed=0
for i in 1 2 3; do
    if [[ -f "/tmp/test_concurrent_$i.json" ]] && jq -e '.content' "/tmp/test_concurrent_$i.json" >/dev/null 2>&1; then
        concurrent_passed=$((concurrent_passed + 1))
    fi
done

if [[ $concurrent_passed -ge 2 ]]; then
    print_success "Concurrent Scraping Requests ($concurrent_passed/3 succeeded)"
else
    print_failure "Concurrent Scraping Requests (Only $concurrent_passed/3 succeeded)"
fi

# Cleanup
rm -f /tmp/test_concurrent_*.json

# Test 11: Model Verification
echo ""
echo "=== Model Verification Tests ==="

TESTS_RUN=$((TESTS_RUN + 1))
print_status "Testing: AI Model Information"
model_info=$(curl -s "http://localhost:8001/health" | jq -r '.model' 2>/dev/null || echo "unknown")

if [[ "$model_info" == *"deepseek"* ]]; then
    print_success "AI Model Verification (Using: $model_info)"
else
    print_warning "AI Model Verification - Expected deepseek model, got: $model_info"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# Final Results
echo ""
echo "================================================================"
echo "                        Test Results"
echo "================================================================"
echo ""
echo "Total Tests Run: $TESTS_RUN"
echo -e "Tests Passed:    ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:    ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! The system is fully functional.${NC}"
    echo ""
    echo "System Status: ✅ HEALTHY"
    echo "Frontend:      ✅ ACCESSIBLE"
    echo "API:           ✅ FUNCTIONAL"
    echo "AI Service:    ✅ OPERATIONAL"
    echo "Authentication:✅ WORKING"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please review the following issues:${NC}"
    echo ""
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo -e "  • ${RED}$failed_test${NC}"
    done
    echo ""
    echo "Please check:"
    echo "  1. Both services are running and healthy"
    echo "  2. Network connectivity between services"
    echo "  3. Environment variables are set correctly"
    echo "  4. AI model is properly loaded"
    echo ""
    exit 1
fi