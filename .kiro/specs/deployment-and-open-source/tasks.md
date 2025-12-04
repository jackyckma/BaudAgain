# Implementation Plan

## Overview

This implementation plan focuses on rapid deployment of BaudAgain BBS for hackathon demonstration. Tasks are ordered to get a working demo online as quickly as possible, with optional enhancements marked for later.

## Task List

- [ ] 1. Create Dockerfile for containerization
  - Create multi-stage Dockerfile that builds server and clients
  - Use Node.js 20 Alpine as base image
  - Stage 1: Install dependencies and build server
  - Stage 2: Build terminal client static assets
  - Stage 3: Build control panel static assets
  - Stage 4: Create production image with compiled code and static assets
  - Configure to run as non-root user
  - Set proper working directory and entry point
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create Docker Compose configuration
  - Create docker-compose.yml for orchestration
  - Define baudagain service with build configuration
  - Configure port mapping (8080:8080)
  - Set up named volume for data persistence (baudagain_data)
  - Configure environment variable loading from .env file
  - Set restart policy to unless-stopped
  - Create isolated network for the container
  - _Requirements: 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 5.1, 5.3_

- [ ] 3. Update server to serve static clients
  - Configure Fastify static plugin to serve terminal client from /
  - Configure Fastify static plugin to serve control panel from /control-panel
  - Ensure proper MIME types for static assets
  - Test that both clients load correctly
  - _Requirements: 1.3_

- [ ] 4. Update server configuration for containers
  - Read PORT from environment variable with default 8080
  - Bind server to 0.0.0.0 instead of localhost
  - Make DATA_DIR configurable via environment variable
  - Make database path relative to DATA_DIR
  - Make ANSI files path relative to DATA_DIR
  - Test configuration loading with different environment variables
  - _Requirements: 1.4, 3.3_

- [ ] 5. Create demo data initialization script
  - Create server/scripts/init-demo-data.ts script
  - Implement check for existing initialization
  - Create sysop account (handle: "sysop", password: "demo123", access level: 255)
  - Create 3 sample user accounts with varied access levels
  - Create 3 message bases (General, Tech Talk, Random)
  - Create 5-10 sample messages distributed across message bases
  - Make script idempotent (safe to run multiple times)
  - Add script to package.json as "init-demo"
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Integrate demo data initialization with container startup
  - Update server/src/index.ts to call initialization on startup
  - Only run initialization if database is empty or flag is set
  - Log initialization status
  - Handle initialization errors gracefully
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Create deployment scripts
  - Create deploy/deploy.sh for initial deployment
  - Create deploy/update.sh for updating existing deployment
  - Create deploy/backup.sh for backing up data
  - Create deploy/restore.sh for restoring from backup
  - Make all scripts executable
  - Add help text and usage information to each script
  - Test scripts locally with Docker
  - _Requirements: 5.4_

- [ ] 8. Update .gitignore for deployment
  - Add .env to .gitignore
  - Add data/bbs.db* to .gitignore
  - Add deploy/*.log to .gitignore
  - Add backups/ to .gitignore
  - Verify no secrets are tracked in git
  - _Requirements: 3.4, 4.3_

- [ ] 9. Create .dockerignore file
  - Exclude node_modules from Docker context
  - Exclude .git directory
  - Exclude development files (.env, .vscode, etc.)
  - Exclude documentation that's not needed in image
  - Exclude test files
  - Keep .env.example for reference
  - _Requirements: 1.1_

- [ ] 10. Prepare GitHub repository
  - Update README.md with project description and features
  - Add demo link placeholder to README
  - Add Docker deployment instructions to README
  - Add screenshots section to README (placeholder for now)
  - Create LICENSE file with MIT license
  - Create CONTRIBUTING.md with basic guidelines
  - Verify .gitignore is complete
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 11. Test Docker build locally
  - Build Docker image: `docker build -t baudagain:latest .`
  - Verify build completes without errors
  - Check image size is reasonable (< 500MB)
  - Inspect image to verify all components present
  - Verify no secrets in image layers
  - _Requirements: 1.1, 1.2, 3.4_

- [ ] 12. Test Docker deployment locally
  - Create .env file from .env.example
  - Set test values for ANTHROPIC_API_KEY and JWT_SECRET
  - Start container: `docker-compose up -d`
  - Verify container starts and stays running
  - Check logs for errors: `docker-compose logs`
  - Verify port 8080 is accessible
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2_

- [ ] 13. Test application functionality in container
  - Access terminal client at http://localhost:8080
  - Verify WebSocket connection works
  - Test user registration
  - Test user login with demo accounts
  - Access control panel at http://localhost:8080/control-panel
  - Test sysop login (sysop/demo123)
  - Verify dashboard shows data
  - Test message posting
  - Test door game (The Oracle)
  - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 14. Test data persistence
  - Create a test user account
  - Post a test message
  - Stop container: `docker-compose down`
  - Start container: `docker-compose up -d`
  - Verify test user can still login
  - Verify test message is still visible
  - _Requirements: 2.1, 2.2_

- [ ] 15. Deploy to DigitalOcean server
  - SSH into do-dev server
  - Verify Docker and Docker Compose are installed
  - Create deployment directory (e.g., /opt/baudagain)
  - Clone repository or copy files to server
  - Create .env file with production values
  - Set ANTHROPIC_API_KEY from user's account
  - Generate secure JWT_SECRET: `openssl rand -base64 32`
  - Set PORT if needed (default 8080 is fine)
  - Run deployment script: `./deploy/deploy.sh`
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 16. Verify deployment on server
  - Check container status: `docker-compose ps`
  - View logs: `docker-compose logs -f`
  - Verify no errors in logs
  - Test HTTP access from server: `curl http://localhost:8080`
  - Note the server's public IP address
  - _Requirements: 5.5_

- [ ] 17. Test demo from external network
  - Access terminal client from browser: `http://<server-ip>:8080`
  - Verify terminal loads and connects
  - Test user registration flow
  - Test login with demo accounts
  - Access control panel: `http://<server-ip>:8080/control-panel`
  - Test sysop login
  - Verify all features work
  - _Requirements: 5.5_

- [ ] 18. Update README with demo link
  - Add demo URL to README.md
  - Add demo credentials (sysop/demo123)
  - Add note about demo being reset periodically
  - Commit and push to GitHub
  - _Requirements: 4.1_

- [ ] 19. Final verification checkpoint
  - Ensure all tests pass, ask the user if questions arise
  - Verify demo is accessible from multiple devices
  - Verify all core features work
  - Verify data persists across restarts
  - Document any known issues
  - Prepare for hackathon presentation

- [ ]* 20. Optional: Add health check endpoint
  - Create GET /health endpoint in server
  - Return status, uptime, database status, AI status
  - Add Docker HEALTHCHECK to Dockerfile
  - Configure health check interval and timeout
  - Test health check works

- [ ]* 21. Optional: Create backup automation
  - Create cron job for automated backups
  - Configure backup retention (keep last 5)
  - Test backup and restore process
  - Document backup procedures

- [ ]* 22. Optional: Add monitoring
  - Set up simple monitoring script
  - Check container status periodically
  - Send alerts if container stops
  - Log resource usage

- [ ]* 23. Optional: Configure reverse proxy
  - Install and configure nginx or Traefik
  - Set up domain name (if available)
  - Configure SSL with Let's Encrypt
  - Update firewall rules
  - Test HTTPS access

- [ ]* 24. Optional: Add CI/CD pipeline
  - Create GitHub Actions workflow
  - Automate Docker build on push
  - Run tests in CI
  - Publish image to registry
  - Automate deployment to server

## Notes

- Tasks 1-19 are the critical path for hackathon demo
- Tasks marked with `*` are optional enhancements
- Estimated time for critical path: 4-6 hours
- Most time will be spent on tasks 11-17 (testing and deployment)
- Have user's Anthropic API key ready before starting
- Ensure do-dev server has Docker installed
- Keep deployment simple - can enhance after hackathon

## Success Criteria

- [ ] Docker image builds successfully
- [ ] Container runs and stays healthy
- [ ] Terminal client accessible via browser
- [ ] Control panel accessible via browser
- [ ] Demo data initialized correctly
- [ ] Data persists across container restarts
- [ ] Deployed to do-dev and accessible from internet
- [ ] README updated with demo link
- [ ] Repository ready for public viewing
