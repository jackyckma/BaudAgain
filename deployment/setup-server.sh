#!/bin/bash
# BaudAgain BBS Server Setup Script
# Run this on the deployment server after extracting the deployment package

set -e  # Exit on error

echo "🚀 BaudAgain BBS Server Setup"
echo "============================="

# Check Node.js version
echo ""
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

echo "✅ npm $(npm -v) found"

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Installing PM2 process manager..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 $(pm2 -v) found"
fi

# Create .env file if it doesn't exist
echo ""
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.template .env

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|JWT_SECRET=|JWT_SECRET=$JWT_SECRET|g" .env

    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and set:"
    echo "  - ANTHROPIC_API_KEY (required for AI features)"
    echo "  - Update CORS_ORIGIN if using web clients"
    echo ""
    read -p "Press Enter when you've configured .env, or Ctrl+C to exit and do it manually..."
else
    echo "✅ .env file already exists"
fi

# Verify required env vars
echo ""
echo "🔍 Verifying environment configuration..."
source .env

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  WARNING: ANTHROPIC_API_KEY not set. AI features will not work."
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET not set. Cannot proceed."
    exit 1
fi

echo "✅ Environment configured"

# Create data directories
echo ""
echo "📁 Creating data directories..."
mkdir -p server/data
mkdir -p data/ansi
echo "✅ Data directories created"

# Install production dependencies
echo ""
echo "📦 Installing production dependencies..."
npm install --production
echo "✅ Dependencies installed"

# Start with PM2
echo ""
echo "🚀 Starting BaudAgain with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Server Status:"
pm2 status

echo ""
echo "🔗 Access Points:"
echo "  - API: http://localhost:${PORT:-3000}/api/v1"
echo "  - Health: http://localhost:${PORT:-3000}/api/v1/system/health"
echo "  - WebSocket: ws://localhost:${PORT:-3000}"

echo ""
echo "📝 Useful Commands:"
echo "  - View logs: pm2 logs baudagain"
echo "  - Restart: pm2 restart baudagain"
echo "  - Stop: pm2 stop baudagain"
echo "  - Status: pm2 status"
echo "  - Save PM2 config: pm2 save"
echo "  - Setup PM2 startup: pm2 startup"

echo ""
echo "🎉 BaudAgain BBS is now running!"
