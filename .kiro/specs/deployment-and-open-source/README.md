# Deployment and Open Source Spec

## Overview

This spec defines the requirements, design, and implementation plan for containerizing BaudAgain BBS with Docker and deploying it to a DigitalOcean server for hackathon demonstration.

## Status

- ✅ Requirements: Complete
- ✅ Design: Complete
- ✅ Tasks: Complete
- ⏳ Implementation: Ready to start

## Goal

Get BaudAgain deployed as a live demo for hackathon judges and participants to access via web browser, with the source code available on GitHub.

## Approach

**Simplified for Speed:**
- Single Docker container (all-in-one)
- Docker Compose for orchestration
- Volume-based data persistence
- Environment variable configuration
- Simple HTTP deployment (no HTTPS/reverse proxy initially)
- Pre-configured demo data

**Timeline:** 4-6 hours for critical path (tasks 1-19)

## Key Decisions

1. **Single Container**: Simpler than multi-container setup, faster to deploy
2. **No Reverse Proxy**: Direct HTTP access for demo, can add later
3. **Volume Persistence**: Simple and effective for demo data
4. **Demo Data**: Pre-configured accounts and messages for immediate exploration
5. **Optional Enhancements**: Health checks, monitoring, CI/CD marked as optional

## Files

- `requirements.md` - User stories and acceptance criteria
- `design.md` - Architecture and technical design
- `tasks.md` - Implementation task list

## Next Steps

1. Review the tasks in `tasks.md`
2. Start with task 1 (Create Dockerfile)
3. Work through tasks 1-19 for MVP
4. Deploy to do-dev server
5. Update README with demo link
6. Optional: Implement tasks 20-24 for enhancements

## Demo Access

Once deployed, the demo will be accessible at:
- Terminal Client: `http://<server-ip>:8080`
- Control Panel: `http://<server-ip>:8080/control-panel`

Demo credentials:
- Sysop: `sysop` / `demo123`
- Sample users will be created automatically
