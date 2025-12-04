# BaudAgain Documentation Index

**Last Updated:** December 3, 2025

This document provides an index of all current documentation for the BaudAgain project.

## Current Documentation (Root Directory)

### Primary Documentation

- **[README.md](README.md)** - Main project documentation, getting started guide, and overview
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Current system architecture, component design, and technical overview
- **[PROJECT_ROADMAP.md](PROJECT_ROADMAP.md)** - Future development plans and feature roadmap

### Specifications

- **[BaudAgain-spec.md](BaudAgain-spec.md)** - Original project specification and requirements
- **[.kiro/specs/baudagain/](/.kiro/specs/baudagain/)** - Formal spec documents:
  - `requirements.md` - Detailed requirements using EARS format
  - `design.md` - Comprehensive design document with correctness properties
  - `tasks.md` - Implementation task list with progress tracking

### Planning and Status

- **[MILESTONE_7_PLANNING.md](MILESTONE_7_PLANNING.md)** - Next milestone planning (MCP-based user testing)

### Current Status

- **[docs/MILESTONE_6_COMPLETE.md](docs/MILESTONE_6_COMPLETE.md)** - Milestone 6 completion summary (Hybrid Architecture) ✅
- **[docs/ARCHITECTURE_REVIEW_2025-12-03_MILESTONE_6_COMPLETE.md](docs/ARCHITECTURE_REVIEW_2025-12-03_MILESTONE_6_COMPLETE.md)** - Architecture review after Milestone 6 completion
- **[docs/TASK_34.2_API_TESTING_COMPLETE.md](docs/TASK_34.2_API_TESTING_COMPLETE.md)** - API testing completion summary
- **[docs/TASK_37_VERIFICATION_COMPLETE.md](docs/TASK_37_VERIFICATION_COMPLETE.md)** - Final verification checkpoint (Milestone 6 100% complete) ✅

### Setup Guides

- **[AI_SETUP.md](AI_SETUP.md)** - AI provider configuration and setup instructions

## Server Documentation

Located in `server/` directory:

### API Documentation

- **[server/openapi.yaml](server/openapi.yaml)** - Complete OpenAPI 3.0 specification for REST API
- **[server/API_README.md](server/API_README.md)** - API overview and getting started guide
- **[server/API_CURL_EXAMPLES.md](server/API_CURL_EXAMPLES.md)** - Curl command examples for all endpoints
- **[server/API_CODE_EXAMPLES.md](server/API_CODE_EXAMPLES.md)** - Code examples in multiple languages
- **[server/BaudAgain-API.postman_collection.json](server/BaudAgain-API.postman_collection.json)** - Postman collection for API testing

### Development Guides

- **[server/MOBILE_APP_GUIDE.md](server/MOBILE_APP_GUIDE.md)** - Guide for building mobile apps using the BBS API
- **[server/QUICK_BENCHMARK_GUIDE.md](server/QUICK_BENCHMARK_GUIDE.md)** - Performance testing guide
- **[server/BENCHMARK_RESULTS.md](server/BENCHMARK_RESULTS.md)** - Performance benchmark results

### Component Documentation

- **[server/src/notifications/README.md](server/src/notifications/README.md)** - WebSocket notification system documentation
- **[server/src/terminal/README.md](server/src/terminal/README.md)** - Terminal rendering system documentation
- **[server/src/utils/ERROR_HANDLER_MIGRATION.md](server/src/utils/ERROR_HANDLER_MIGRATION.md)** - Error handling migration guide

## Archived Documentation

Historical documentation is preserved in `docs/archive/`:

### Archive Structure

- **[docs/archive/README.md](docs/archive/README.md)** - Archive overview and guide
- **`docs/archive/architecture-reviews/`** - Historical architecture reviews (33 files)
- **`docs/archive/milestone-summaries/`** - Milestone completion summaries (13 files)
- **`docs/archive/task-completions/`** - Individual task completion documents (30 files)
- **`docs/archive/planning/`** - Historical planning documents (10 files)
- **`docs/archive/status-reports/`** - Project status reports (11 files)
- **`docs/archive/testing/`** - Testing documentation (4 files)

### Why Archive?

Archived documents preserve the complete development history while keeping the root directory clean and focused on current, active documentation. All archived files remain in git history and are searchable.

## Documentation Guidelines

### For New Documentation

When creating new documentation, follow these guidelines:

#### Root Directory
Place documentation in the root directory if it is:
- **Current and actively maintained** (e.g., README.md, ARCHITECTURE.md)
- **Essential for getting started** (e.g., setup guides)
- **Forward-looking** (e.g., roadmaps, next milestone planning)

#### Server Directory
Place documentation in `server/` if it is:
- **API-specific** (e.g., OpenAPI specs, API guides)
- **Server implementation details** (e.g., component READMEs)
- **Development tools** (e.g., benchmark guides, test scripts)

#### Archive Directory
Move documentation to `docs/archive/` when it is:
- **Historical** (e.g., completed milestone summaries)
- **Superseded** (e.g., old architecture reviews)
- **Reference material** (e.g., task completion notes)

Choose the appropriate subdirectory:
- `architecture-reviews/` - Architecture analysis and reviews
- `milestone-summaries/` - Milestone completion documentation
- `task-completions/` - Individual task completion notes
- `planning/` - Design documents and planning materials
- `status-reports/` - Project status snapshots
- `testing/` - Testing guides and reports

### Documentation Standards

- Use **Markdown** format for all documentation
- Include **date stamps** on time-sensitive documents
- Use **clear, descriptive filenames**
- Add **table of contents** for documents over 100 lines
- Include **code examples** where appropriate
- Keep documentation **up-to-date** with code changes

## Quick Links

### Getting Started
1. [README.md](README.md) - Start here
2. [AI_SETUP.md](AI_SETUP.md) - Configure AI providers
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the system

### API Development
1. [server/API_README.md](server/API_README.md) - API overview
2. [server/openapi.yaml](server/openapi.yaml) - API specification
3. [server/API_CURL_EXAMPLES.md](server/API_CURL_EXAMPLES.md) - Quick examples

### Mobile Development
1. [server/MOBILE_APP_GUIDE.md](server/MOBILE_APP_GUIDE.md) - Mobile app guide
2. [server/API_CODE_EXAMPLES.md](server/API_CODE_EXAMPLES.md) - Code examples

### Contributing
1. [.kiro/specs/baudagain/tasks.md](.kiro/specs/baudagain/tasks.md) - Current tasks
2. [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) - Future plans
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture guidelines

## Maintenance

This documentation index should be updated when:
- New documentation is added to the root directory
- Documentation is moved to the archive
- Major documentation restructuring occurs
- New documentation categories are created

**Maintainer:** Update this file when making significant documentation changes.
