#!/bin/bash
# BaudAgain BBS Deployment Script
# Builds the application and creates a deployment package

set -e  # Exit on error

echo "🚀 BaudAgain BBS Deployment Build"
echo "================================="

# Step 1: Clean previous builds
echo ""
echo "📦 Step 1: Cleaning previous builds..."
npm run clean || true
rm -rf server/dist client/*/dist packages/*/dist
echo "✅ Clean complete"

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Step 3: Build all workspaces
echo ""
echo "🔨 Step 3: Building all workspaces..."
npm run build
echo "✅ Build complete"

# Step 4: Create deployment package
echo ""
echo "📦 Step 4: Creating deployment package..."

# Create deployment directory structure
rm -rf deployment/package
mkdir -p deployment/package

# Copy server files
echo "  - Copying server files..."
cp -r server/dist deployment/package/server-dist
cp server/package.json deployment/package/
cp server/package-lock.json deployment/package/
cp -r server/src/db deployment/package/server-src-db

# Copy client builds
echo "  - Copying client builds..."
cp -r client/terminal/dist deployment/package/terminal-dist
cp -r client/control-panel/dist deployment/package/control-panel-dist

# Copy configuration files
echo "  - Copying configuration files..."
cp config.yaml deployment/package/
cp server/.env.production deployment/package/.env.template

# Copy data directory structure
echo "  - Setting up data directories..."
mkdir -p deployment/package/data/ansi
cp -r data/ansi/* deployment/package/data/ansi/ || true
mkdir -p deployment/package/server/data

# Create deployment instructions
cat > deployment/package/DEPLOY.md << 'EOF'
# BaudAgain BBS Deployment Instructions

## Quick Start

1. Copy this entire package directory to your server
2. Run the setup script:
   ```bash
   ./setup-server.sh
   ```
3. Follow the prompts to configure your environment

## Manual Setup

If you prefer manual setup:

1. Install Node.js 20+ and npm 10+
2. Copy `.env.template` to `.env` and configure:
   - ANTHROPIC_API_KEY (required)
   - JWT_SECRET (required - generate with: openssl rand -base64 32)
3. Install PM2: `npm install -g pm2`
4. Install dependencies: `npm install --production`
5. Start the server: `pm2 start ecosystem.config.js`

## Verification

Check that the server is running:
```bash
curl http://localhost:3000/api/v1/system/health
```

## Logs

View logs with PM2:
```bash
pm2 logs baudagain
```

## Management

- Start: `pm2 start ecosystem.config.js`
- Stop: `pm2 stop baudagain`
- Restart: `pm2 restart baudagain`
- Status: `pm2 status`
EOF

# Create tarball
echo "  - Creating tarball..."
cd deployment/package
tar -czf ../baudagain-deploy.tar.gz .
cd ../..

echo "✅ Deployment package created: deployment/baudagain-deploy.tar.gz"

# Display package size
SIZE=$(du -h deployment/baudagain-deploy.tar.gz | cut -f1)
echo ""
echo "📊 Package size: $SIZE"

echo ""
echo "🎉 Deployment build complete!"
echo ""
echo "Next steps:"
echo "1. Copy deployment/baudagain-deploy.tar.gz to your server"
echo "2. Extract: tar -xzf baudagain-deploy.tar.gz"
echo "3. Run: ./setup-server.sh"
echo ""
