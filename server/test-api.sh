#!/bin/bash

# BaudAgain BBS API Test Script
# This script tests the main API endpoints to verify they're working correctly

set -e  # Exit on error

BASE_URL="http://localhost:8080/api/v1"
HANDLE="testuser_$(date +%s)"  # Unique handle with timestamp
PASSWORD="testpass123"

echo "🚀 BaudAgain BBS API Test Script"
echo "================================"
echo ""
echo "Base URL: $BASE_URL"
echo "Test User: $HANDLE"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s -f "$BASE_URL/../health" > /dev/null 2>&1; then
    error "Server is not running at $BASE_URL"
    info "Start the server with: cd server && npm run dev"
    exit 1
fi
success "Server is running"
echo ""

# Test 1: Register
echo "Test 1: Register new user"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"handle\": \"$HANDLE\",
    \"password\": \"$PASSWORD\",
    \"realName\": \"Test User\",
    \"location\": \"Test Location\"
  }")

if echo "$REGISTER_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
    success "User registered successfully"
    info "Token: ${TOKEN:0:20}..."
    info "User ID: $USER_ID"
else
    error "Registration failed"
    echo "$REGISTER_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test 2: Get current user
echo "Test 2: Get current user"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | jq -e '.handle' > /dev/null 2>&1; then
    success "Retrieved current user"
    info "Handle: $(echo "$ME_RESPONSE" | jq -r '.handle')"
else
    error "Failed to get current user"
    echo "$ME_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test 3: List message bases
echo "Test 3: List message bases"
BASES_RESPONSE=$(curl -s -X GET "$BASE_URL/message-bases" \
  -H "Authorization: Bearer $TOKEN")

if echo "$BASES_RESPONSE" | jq -e '.bases' > /dev/null 2>&1; then
    BASE_COUNT=$(echo "$BASES_RESPONSE" | jq '.bases | length')
    success "Retrieved message bases"
    info "Found $BASE_COUNT message base(s)"
    
    if [ "$BASE_COUNT" -gt 0 ]; then
        MESSAGE_BASE_ID=$(echo "$BASES_RESPONSE" | jq -r '.bases[0].id')
        MESSAGE_BASE_NAME=$(echo "$BASES_RESPONSE" | jq -r '.bases[0].name')
        info "First base: $MESSAGE_BASE_NAME ($MESSAGE_BASE_ID)"
    fi
else
    error "Failed to list message bases"
    echo "$BASES_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test 4: Post a message (if we have a message base)
if [ -n "$MESSAGE_BASE_ID" ]; then
    echo "Test 4: Post a message"
    POST_RESPONSE=$(curl -s -X POST "$BASE_URL/message-bases/$MESSAGE_BASE_ID/messages" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "subject": "Test Message from API",
        "body": "This is a test message posted via the REST API test script."
      }')
    
    if echo "$POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        MESSAGE_ID=$(echo "$POST_RESPONSE" | jq -r '.id')
        success "Message posted successfully"
        info "Message ID: $MESSAGE_ID"
    else
        error "Failed to post message"
        echo "$POST_RESPONSE" | jq '.'
        exit 1
    fi
    echo ""
    
    # Test 5: Get the message
    echo "Test 5: Get the message"
    GET_MESSAGE_RESPONSE=$(curl -s -X GET "$BASE_URL/messages/$MESSAGE_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$GET_MESSAGE_RESPONSE" | jq -e '.subject' > /dev/null 2>&1; then
        success "Retrieved message"
        info "Subject: $(echo "$GET_MESSAGE_RESPONSE" | jq -r '.subject')"
    else
        error "Failed to get message"
        echo "$GET_MESSAGE_RESPONSE" | jq '.'
        exit 1
    fi
    echo ""
else
    info "Skipping message tests (no message bases available)"
    echo ""
fi

# Test 6: List doors
echo "Test 6: List door games"
DOORS_RESPONSE=$(curl -s -X GET "$BASE_URL/doors" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DOORS_RESPONSE" | jq -e '.doors' > /dev/null 2>&1; then
    DOOR_COUNT=$(echo "$DOORS_RESPONSE" | jq '.doors | length')
    success "Retrieved door games"
    info "Found $DOOR_COUNT door(s)"
    
    if [ "$DOOR_COUNT" -gt 0 ]; then
        DOOR_ID=$(echo "$DOORS_RESPONSE" | jq -r '.doors[0].id')
        DOOR_NAME=$(echo "$DOORS_RESPONSE" | jq -r '.doors[0].name')
        info "First door: $DOOR_NAME ($DOOR_ID)"
    fi
else
    error "Failed to list doors"
    echo "$DOORS_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test 7: Enter a door (if we have one)
if [ -n "$DOOR_ID" ]; then
    echo "Test 7: Enter door game"
    ENTER_RESPONSE=$(curl -s -X POST "$BASE_URL/doors/$DOOR_ID/enter" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$ENTER_RESPONSE" | jq -e '.sessionId' > /dev/null 2>&1; then
        DOOR_SESSION_ID=$(echo "$ENTER_RESPONSE" | jq -r '.sessionId')
        success "Entered door game"
        info "Session ID: $DOOR_SESSION_ID"
        info "Output preview: $(echo "$ENTER_RESPONSE" | jq -r '.output' | head -c 50)..."
    else
        error "Failed to enter door"
        echo "$ENTER_RESPONSE" | jq '.'
        exit 1
    fi
    echo ""
    
    # Test 8: Send input to door
    echo "Test 8: Send input to door"
    INPUT_RESPONSE=$(curl -s -X POST "$BASE_URL/doors/$DOOR_ID/input" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "input": "What is the meaning of testing?"
      }')
    
    if echo "$INPUT_RESPONSE" | jq -e '.output' > /dev/null 2>&1; then
        success "Sent input to door"
        info "Response preview: $(echo "$INPUT_RESPONSE" | jq -r '.output' | head -c 50)..."
    else
        error "Failed to send input"
        echo "$INPUT_RESPONSE" | jq '.'
        exit 1
    fi
    echo ""
    
    # Test 9: Exit door
    echo "Test 9: Exit door game"
    EXIT_RESPONSE=$(curl -s -X POST "$BASE_URL/doors/$DOOR_ID/exit" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$EXIT_RESPONSE" | jq -e '.exited' > /dev/null 2>&1; then
        success "Exited door game"
    else
        error "Failed to exit door"
        echo "$EXIT_RESPONSE" | jq '.'
        exit 1
    fi
    echo ""
else
    info "Skipping door tests (no doors available)"
    echo ""
fi

# Test 10: Update user profile
echo "Test 10: Update user profile"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated via API test script"
  }')

if echo "$UPDATE_RESPONSE" | jq -e '.bio' > /dev/null 2>&1; then
    success "Updated user profile"
    info "New bio: $(echo "$UPDATE_RESPONSE" | jq -r '.bio')"
else
    error "Failed to update profile"
    echo "$UPDATE_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Test user created: $HANDLE"
echo "You can login with this user to continue testing."
echo ""
echo "Next steps:"
echo "  1. Import BaudAgain-API.postman_collection.json into Postman"
echo "  2. Try the curl examples in API_CURL_EXAMPLES.md"
echo "  3. View the OpenAPI spec in Swagger Editor"
echo ""
