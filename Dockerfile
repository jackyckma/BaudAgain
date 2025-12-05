# BaudAgain BBS - Multi-stage Docker Build
# Stage 1: Install dependencies and build server
# Stage 2: Build terminal client
# Stage 3: Build control panel
# Stage 4: Production image

# =============================================================================
# Stage 1: Build server
# =============================================================================
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/shared/package.json ./packages/shared/
COPY client/terminal/package.json ./client/terminal/
COPY client/control-panel/package.json ./client/control-panel/

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY server/ ./server/
COPY config.yaml ./

# Build shared package first
RUN npm run build -w @baudagain/shared

# Build server
RUN npm run build -w server

# =============================================================================
# Stage 2: Build terminal client
# =============================================================================
FROM node:20-alpine AS terminal-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY client/terminal/package.json ./client/terminal/

# Install dependencies
RUN npm ci --workspace=@baudagain/shared --workspace=client/terminal

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY client/terminal/ ./client/terminal/

# Build shared package
RUN npm run build -w @baudagain/shared

# Build terminal client
RUN npm run build -w client/terminal

# =============================================================================
# Stage 3: Build control panel
# =============================================================================
FROM node:20-alpine AS panel-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY client/control-panel/package.json ./client/control-panel/

# Install dependencies
RUN npm ci --workspace=@baudagain/shared --workspace=client/control-panel

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY client/control-panel/ ./client/control-panel/

# Build shared package
RUN npm run build -w @baudagain/shared

# Build control panel
RUN npm run build -w client/control-panel

# =============================================================================
# Stage 4: Production image
# =============================================================================
FROM node:20-alpine AS production

# Add labels for container metadata
LABEL org.opencontainers.image.title="BaudAgain BBS"
LABEL org.opencontainers.image.description="AI-Enhanced Bulletin Board System"
LABEL org.opencontainers.image.source="https://github.com/jackyckma/BaudAgain"

# Create non-root user for security
RUN addgroup -g 1001 -S baudagain && \
    adduser -u 1001 -S baudagain -G baudagain

WORKDIR /app

# Copy package files for production dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder stages
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=terminal-builder /app/client/terminal/dist ./client/terminal/dist
COPY --from=panel-builder /app/client/control-panel/dist ./client/control-panel/dist

# Copy configuration and data files
COPY config.yaml ./
COPY data/ansi ./data/ansi

# Create data directory for database (will be mounted as volume)
RUN mkdir -p /app/data && chown -R baudagain:baudagain /app

# Switch to non-root user
USER baudagain

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/app/data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the server
WORKDIR /app/server
CMD ["node", "dist/index.js"]

