# Requirements Document

## Introduction

This specification defines the requirements for preparing BaudAgain BBS for open-source release on GitHub and deploying a live demo instance to a DigitalOcean server for hackathon demonstration purposes. The focus is on rapid deployment with minimal complexity to meet hackathon deadlines.

## Glossary

- **BaudAgain**: The AI-Enhanced Bulletin Board System being deployed
- **Docker**: Container platform used for packaging the application
- **DigitalOcean Droplet**: Virtual private server (VPS) hosting the demo
- **do-dev**: SSH configuration name for the DigitalOcean deployment server
- **GitHub Repository**: Public source code repository for the project
- **Demo Instance**: Live, publicly accessible deployment of BaudAgain
- **Container**: Isolated runtime environment containing the application and dependencies
- **Docker Compose**: Tool for defining multi-container Docker applications
- **Environment Variables**: Configuration values passed to containers at runtime
- **Volume**: Persistent storage mechanism for Docker containers

## Requirements

### Requirement 1: Docker Containerization

**User Story:** As a developer, I want the application packaged in a single Docker container, so that I can deploy it quickly to the demo server.

#### Acceptance Criteria

1. WHEN building the container THEN the system SHALL create a Docker image that includes the server, terminal client, and control panel
2. WHEN building the container THEN the system SHALL compile TypeScript and build static assets
3. WHEN starting the container THEN the system SHALL serve all components from a single process
4. WHERE environment-specific configuration is needed THEN the system SHALL use environment variables passed to the container

### Requirement 2: Data Persistence

**User Story:** As a demo administrator, I want application data to persist across container restarts, so that demo users and messages are retained.

#### Acceptance Criteria

1. WHEN the container restarts THEN the system SHALL preserve the SQLite database using a Docker volume
2. WHEN the container restarts THEN the system SHALL preserve ANSI art files using a Docker volume

### Requirement 3: Environment Configuration

**User Story:** As a demo administrator, I want to configure the application through environment variables, so that I can set API keys without modifying code.

#### Acceptance Criteria

1. WHEN deploying the demo THEN the system SHALL read the Anthropic API key from environment variables
2. WHEN deploying the demo THEN the system SHALL read the JWT secret from environment variables
3. WHEN deploying the demo THEN the system SHALL read the server port from environment variables with a default of 8080
4. WHERE sensitive configuration exists THEN the system SHALL NOT include secrets in the Docker image or repository

### Requirement 4: GitHub Repository Preparation

**User Story:** As a hackathon judge, I want to view the source code on GitHub, so that I can evaluate the project.

#### Acceptance Criteria

1. WHEN viewing the repository THEN the system SHALL provide a README with project description, features, and demo link
2. WHEN viewing the repository THEN the system SHALL provide a LICENSE file with MIT license terms
3. WHEN viewing the repository THEN the system SHALL provide a .gitignore file that excludes node_modules, build artifacts, environment files, and database files
4. WHEN viewing the repository THEN the system SHALL provide basic Docker deployment instructions in the README

### Requirement 5: DigitalOcean Deployment

**User Story:** As a hackathon participant, I want to access a live demo of BaudAgain, so that I can experience the system without local setup.

#### Acceptance Criteria

1. WHEN deploying to do-dev THEN the system SHALL use Docker to start the service
2. WHEN deploying to do-dev THEN the system SHALL configure the server to listen on an available port
3. WHEN deploying to do-dev THEN the system SHALL persist data using Docker volumes
4. WHEN deploying to do-dev THEN the system SHALL provide a simple deployment script
5. WHEN accessing the demo THEN the system SHALL be accessible via HTTP on the configured port

### Requirement 6: Demo Instance Setup

**User Story:** As a hackathon visitor, I want the demo pre-configured with sample data, so that I can immediately explore the BBS features.

#### Acceptance Criteria

1. WHEN the demo starts for the first time THEN the system SHALL create a sysop account with known credentials
2. WHEN the demo starts for the first time THEN the system SHALL create at least one sample message base
3. WHEN the demo starts for the first time THEN the system SHALL create sample messages in the message base
4. WHEN the demo starts for the first time THEN the system SHALL create sample user accounts for testing
