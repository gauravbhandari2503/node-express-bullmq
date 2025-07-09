#!/bin/bash

# BullMQ Demo - Interactive Testing Script
# This script helps you test various BullMQ features interactively

echo "🚀 BullMQ Interactive Demo"
echo "=========================="
echo ""
echo "This script will help you test various BullMQ features."
echo "Make sure Redis is running and your server is started!"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API endpoint
API_URL="http://localhost:3000"

# Function to check if server is running
check_server() {
    echo -n "🔍 Checking if server is running... "
    if curl -s "$API_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running${NC}"
        echo "Please start the server with: npm run dev"
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    echo -n "🔍 Checking Redis connection... "
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Redis is not running${NC}"
        echo "Please start Redis with: sudo systemctl start redis"
        return 1
    fi
}

# Function to send a basic email job
test_basic_email() {
    echo -e "\n${BLUE}📧 Testing Basic Email Job${NC}"
    echo "Sending email to test@example.com..."
    
    response=$(curl -s -X POST "$API_URL/send-email" \
        -H "Content-Type: application/json" \
        -d '{"to":"test@example.com"}')
    
    echo "Response: $response"
}

# Function to send a delayed email job
test_delayed_email() {
    echo -e "\n${BLUE}⏰ Testing Delayed Email Job${NC}"
    echo "Sending delayed email (10 seconds) to delayed@example.com..."
    
    response=$(curl -s -X POST "$API_URL/send-email" \
        -H "Content-Type: application/json" \
        -d '{"to":"delayed@example.com","delay":10000}')
    
    echo "Response: $response"
    echo "This email will be processed in 10 seconds!"
}

# Function to send an urgent email job
test_urgent_email() {
    echo -e "\n${BLUE}🚨 Testing Urgent Email Job${NC}"
    echo "Sending urgent email to urgent@example.com..."
    
    response=$(curl -s -X POST "$API_URL/send-urgent" \
        -H "Content-Type: application/json" \
        -d '{"to":"urgent@example.com"}')
    
    echo "Response: $response"
}

# Function to test recurring jobs
test_recurring_job() {
    echo -e "\n${BLUE}🔄 Testing Recurring Job${NC}"
    echo "Creating a recurring job that runs every minute..."
    
    response=$(curl -s -X POST "$API_URL/send-recurring")
    
    echo "Response: $response"
    echo "Check the dashboard to see the recurring job!"
}

# Function to schedule an email
test_scheduled_email() {
    echo -e "\n${BLUE}📅 Testing Scheduled Email${NC}"
    
    # Calculate time 30 seconds from now
    future_time=$(date -d "+30 seconds" -Iseconds)
    
    echo "Scheduling email for 30 seconds from now ($future_time)..."
    
    response=$(curl -s -X POST "$API_URL/schedule-email" \
        -H "Content-Type: application/json" \
        -d "{\"to\":\"scheduled@example.com\",\"scheduleTime\":\"$future_time\"}")
    
    echo "Response: $response"
}

# Function to run performance test
test_performance() {
    echo -e "\n${BLUE}⚡ Testing Performance${NC}"
    echo "Adding 100 email jobs quickly..."
    
    start_time=$(date +%s.%N)
    
    for i in {1..100}; do
        curl -s -X POST "$API_URL/send-email" \
            -H "Content-Type: application/json" \
            -d "{\"to\":\"perf$i@example.com\"}" > /dev/null &
    done
    
    wait # Wait for all background jobs to complete
    
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    echo "✅ Added 100 jobs in $duration seconds"
    echo "Check the dashboard to see the jobs being processed!"
}

# Function to open dashboard
open_dashboard() {
    echo -e "\n${BLUE}📊 Opening Dashboard${NC}"
    echo "Opening BullMQ dashboard in your browser..."
    
    if command -v xdg-open > /dev/null; then
        xdg-open "$API_URL/admin/queues"
    elif command -v open > /dev/null; then
        open "$API_URL/admin/queues"
    else
        echo "Please open $API_URL/admin/queues in your browser"
    fi
}

# Function to show queue statistics
show_queue_stats() {
    echo -e "\n${BLUE}📊 Queue Statistics${NC}"
    
    # Use Redis CLI to get basic queue info
    if command -v redis-cli > /dev/null; then
        echo "Current queue keys in Redis:"
        redis-cli keys "*emailQueue*" | head -10
        echo ""
        echo "Queue length:"
        redis-cli llen "bull:emailQueue:waiting" 2>/dev/null || echo "No waiting jobs"
    else
        echo "Redis CLI not available. Install redis-tools to see queue stats."
    fi
}

# Function to run tests from examples
test_examples() {
    echo -e "\n${BLUE}🧪 Running Test Examples${NC}"
    
    if [ -f "examples/testing-examples.js" ]; then
        echo "Running testing examples..."
        node examples/testing-examples.js
    else
        echo "Testing examples not found. Make sure you're in the project directory."
    fi
}

# Main menu
show_menu() {
    echo -e "\n${YELLOW}🎯 What would you like to test?${NC}"
    echo "1. Basic email job"
    echo "2. Delayed email job (10 seconds)"
    echo "3. Urgent email job"
    echo "4. Recurring job"
    echo "5. Scheduled email"
    echo "6. Performance test (100 jobs)"
    echo "7. Open dashboard"
    echo "8. Show queue statistics"
    echo "9. Run test examples"
    echo "10. Run all tests"
    echo "0. Exit"
    echo ""
    echo -n "Enter your choice (0-10): "
}

# Function to run all tests
run_all_tests() {
    echo -e "\n${YELLOW}🚀 Running All Tests${NC}"
    test_basic_email
    sleep 2
    test_delayed_email
    sleep 2
    test_urgent_email
    sleep 2
    test_recurring_job
    sleep 2
    test_scheduled_email
    sleep 2
    echo -e "\n${GREEN}✅ All tests completed!${NC}"
    echo "Check the dashboard and worker logs to see the results."
}

# Main script execution
main() {
    # Check prerequisites
    if ! check_server || ! check_redis; then
        exit 1
    fi
    
    echo -e "\n${GREEN}✅ All systems ready!${NC}"
    
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) test_basic_email ;;
            2) test_delayed_email ;;
            3) test_urgent_email ;;
            4) test_recurring_job ;;
            5) test_scheduled_email ;;
            6) test_performance ;;
            7) open_dashboard ;;
            8) show_queue_stats ;;
            9) test_examples ;;
            10) run_all_tests ;;
            0) 
                echo -e "\n${GREEN}👋 Thanks for testing BullMQ! Happy coding!${NC}"
                exit 0 
                ;;
            *) 
                echo -e "${RED}❌ Invalid choice. Please enter 0-10.${NC}" 
                ;;
        esac
        
        echo -e "\n${YELLOW}Press Enter to continue...${NC}"
        read -r
    done
}

# Run the main function
main
