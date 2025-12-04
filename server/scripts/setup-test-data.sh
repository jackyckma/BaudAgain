#!/bin/bash

# Setup Test Data for MCP-Based Testing
# This script creates test users and message bases using the REST API

API_BASE="http://localhost:3001/api"

echo "🚀 Setting up test data for MCP-based testing..."
echo ""

# Function to create a user
create_user() {
  local handle=$1
  local password=$2
  local realName=$3
  local location=$4
  
  echo "Creating user: $handle"
  
  response=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"handle\": \"$handle\",
      \"password\": \"$password\",
      \"realName\": \"$realName\",
      \"location\": \"$location\"
    }")
  
  if echo "$response" | grep -q "token"; then
    echo "   ✅ User $handle created successfully"
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
  elif echo "$response" | grep -q "already exists"; then
    echo "   ⏭️  User $handle already exists"
    # Try to login to get token
    login_response=$(curl -s -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"handle\": \"$handle\",
        \"password\": \"$password\"
      }")
    echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
  else
    echo "   ❌ Failed to create user $handle"
    echo "   Response: $response"
    return 1
  fi
}

# Function to create a message base
create_message_base() {
  local token=$1
  local name=$2
  local description=$3
  local accessLevelRead=$4
  local accessLevelWrite=$5
  
  echo "Creating message base: $name"
  
  response=$(curl -s -X POST "$API_BASE/message-bases" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "{
      \"name\": \"$name\",
      \"description\": \"$description\",
      \"accessLevelRead\": $accessLevelRead,
      \"accessLevelWrite\": $accessLevelWrite
    }")
  
  if echo "$response" | grep -q "\"id\""; then
    echo "   ✅ Message base $name created successfully"
    echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4
  elif echo "$response" | grep -q "already exists"; then
    echo "   ⏭️  Message base $name already exists"
  else
    echo "   ⚠️  Could not create message base $name (may require admin access)"
  fi
}

# Function to create a message
create_message() {
  local token=$1
  local baseId=$2
  local subject=$3
  local body=$4
  
  echo "Creating message: $subject"
  
  response=$(curl -s -X POST "$API_BASE/message-bases/$baseId/messages" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "{
      \"subject\": \"$subject\",
      \"body\": \"$body\"
    }")
  
  if echo "$response" | grep -q "\"id\""; then
    echo "   ✅ Message created successfully"
  else
    echo "   ⚠️  Could not create message"
  fi
}

echo "👥 Creating test users..."
echo ""

# Create test users
newbie_token=$(create_user "TestNewbie" "TestPass123!" "Test Newbie" "Test City")
echo ""

veteran_token=$(create_user "TestVeteran" "VetPass456!" "Test Veteran" "Test Town")
echo ""

admin_token=$(create_user "TestAdmin" "AdminPass789!" "Test Administrator" "Admin HQ")
echo ""

echo "📁 Creating test message bases..."
echo ""

# Note: Message base creation might require admin access
# For now, we'll use the existing message bases from the database seed

echo "💬 Creating test messages..."
echo ""

# Get the first message base ID (General Discussion)
base_response=$(curl -s -X GET "$API_BASE/message-bases" \
  -H "Authorization: Bearer $veteran_token")

base_id=$(echo "$base_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$base_id" ]; then
  echo "Using message base ID: $base_id"
  echo ""
  
  # Create test messages
  create_message "$veteran_token" "$base_id" "Welcome to the Test BBS!" "This is a test message to verify message display functionality. It includes proper formatting and should display with subject, author, and timestamp."
  echo ""
  
  create_message "$veteran_token" "$base_id" "Testing ANSI Formatting" "This message tests ANSI color codes and formatting. Green text and Bold red text should display correctly."
  echo ""
  
  create_message "$veteran_token" "$base_id" "Long Message Test" "This is a longer test message to verify that the message display can handle multiple lines of text. This is a longer test message to verify that the message display can handle multiple lines of text. This is a longer test message to verify that the message display can handle multiple lines of text."
  echo ""
else
  echo "⚠️  Could not find message base ID"
fi

echo "📊 Test Data Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "👥 Test Users:"
echo "   • TestNewbie / TestPass123!"
echo "     Access Level: 10"
echo "   • TestVeteran / VetPass456!"
echo "     Access Level: 10"
echo "   • TestAdmin / AdminPass789!"
echo "     Access Level: 255 (requires manual database update)"
echo ""
echo "📁 Test Message Bases:"
echo "   • Using existing message bases from database seed"
echo ""
echo "💬 Test Messages:"
echo "   • 3 messages created in first message base"
echo ""
echo "✨ Ready for MCP-based testing!"
echo "   Terminal: http://localhost:8080"
echo "   Control Panel: http://localhost:3000"
echo "   API: http://localhost:3001/api"
