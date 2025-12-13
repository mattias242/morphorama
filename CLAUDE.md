# Morphorama - AI Photo Evolution Platform

## Project Overview

Morphorama is an automated web service that transforms uploaded photos through 60 iterations of AI image generation, creates videos with AI-generated music, and automatically posts to Instagram.

## What It Does

1. **Photo Upload**: Public web interface for users to upload photos
2. **Moderation**: Moderators review and approve/reject submissions
3. **Evolution**: Every 24 hours, a random approved photo undergoes 60 AI transformations
4. **Video**: Creates 30-second video (0.5s per frame) with AI-generated music
5. **Publishing**: Automatically posts to Instagram
6. **Gallery**: Public gallery of completed evolution videos

## Tech Stack

### Core
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Next.js 14 (React) with Tailwind CSS
- **Database**: PostgreSQL 16
- **Queue**: BullMQ + Redis (for future evolution jobs)
- **Storage**: MinIO (S3-compatible)
- **Proxy**: Nginx with SSL
- **Orchestration**: Docker Compose

### AI Services (Configurable)
- **Image Generation**: Google Imagen (primary) or Stability AI
- **LLM**: Google Gemini (primary) or Anthropic Claude
- **Music**: Suno AI
- **Social**: Instagram Graph API

## System Architecture

```
morphorama/
├── backend/         # Express API + queue processors
├── frontend/        # Next.js web interface
├── worker/          # BullMQ job processors (not yet active)
├── database/        # PostgreSQL schema
├── nginx/           # Reverse proxy
└── docker-compose.yml
```

## Current Status (As of 2025-12-13)

### ✅ Implemented & Working

**Infrastructure**
- Docker Compose with 7 services (postgres, redis, minio, backend, frontend, worker, nginx, scheduler)
- PostgreSQL database with complete schema
- MinIO storage with automatic bucket creation
- Nginx reverse proxy with SSL

**Backend API**
- Config system with Zod validation
- Database connection pool + repositories
- Storage service (MinIO integration)
- **Upload endpoint**: `POST /api/upload` - Upload photos with validation
- **Moderation endpoints**:
  - `GET /api/moderation/queue` - Pending photos
  - `GET /api/moderation/stats` - Statistics
  - `GET /api/moderation/photo/:id` - Get photo details
  - `PATCH /api/moderation/photo/:id` - Approve/reject

**Frontend**
- Upload page with drag-and-drop (/)
- Moderation dashboard (/moderation)
- Gallery page (/gallery) - placeholder

### 🚧 Not Yet Implemented

- AI service integrations (Gemini, Claude, Stability AI, Suno)
- BullMQ queue configuration
- Evolution job processor (60-iteration loop)
- Video generation service (ffmpeg)
- Music generation
- Instagram API integration
- Scheduler (24h photo selection)

## Database Schema

### Key Tables
- **photos**: Uploaded images with moderation status
- **evolutions**: Evolution run tracking
- **evolution_frames**: Individual iteration frames (60 per evolution)
- **videos**: Generated videos with audio
- **instagram_posts**: Posted videos tracking
- **job_logs**: Queue job monitoring

## Configuration

### Environment Variables (.env)

**Required for current functionality:**
```bash
# Database
POSTGRES_DB=morphorama
POSTGRES_USER=morpho_user
POSTGRES_PASSWORD=<password>

# Redis
REDIS_PASSWORD=<password>

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<password>

# Security
JWT_SECRET=<secret>
MODERATOR_PASSWORD=<password>
```

**Required for AI features (not yet implemented):**
```bash
GOOGLE_GEMINI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
STABILITY_API_KEY=<key>
SUNO_API_KEY=<key>
INSTAGRAM_ACCESS_TOKEN=<token>
INSTAGRAM_ACCOUNT_ID=<id>

IMAGE_PROVIDER=google-imagen
LLM_PROVIDER=gemini
MUSIC_PROVIDER=suno
SCHEDULE_INTERVAL=24h
```

## Running the Project

### Start All Services
```bash
docker-compose up -d
```

### Access
- **Frontend**: https://localhost (accepts self-signed cert)
- **Backend API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001

### View Logs
```bash
docker-compose logs -f
docker logs morphorama-backend -f
docker logs morphorama-frontend -f
```

### Stop Services
```bash
docker-compose down
```

## Development Workflow

### Backend Changes
1. Edit files in `backend/src/`
2. Rebuild: `docker-compose up -d --build backend`
3. Check logs: `docker logs morphorama-backend -f`

### Frontend Changes
1. Edit files in `frontend/src/`
2. Rebuild: `docker-compose up -d --build frontend`
3. Access: https://localhost

### Database Access
```bash
docker exec -it morphorama-db psql -U morpho_user -d morphorama
```

## Testing Current Features

### Test Upload Flow
1. Open https://localhost
2. Drag-and-drop an image (JPEG, PNG, WebP, GIF, max 50MB)
3. Photo uploads to MinIO and saves to database as "pending"

### Test Moderation Flow
1. Go to https://localhost/moderation
2. See uploaded photo in queue
3. Click "Approve" or "Reject"
4. Check stats update

### Verify Backend
```bash
# Health check
curl http://localhost:3001/health

# Get stats
curl -k https://localhost/api/moderation/stats
```

## Key Files

### Backend
- `backend/src/index.ts` - Main server with routes
- `backend/src/config/index.ts` - Configuration loader
- `backend/src/database/connection.ts` - PostgreSQL pool
- `backend/src/database/repositories/photo.repository.ts` - Photo CRUD
- `backend/src/services/storage.service.ts` - MinIO integration
- `backend/src/services/init-storage.ts` - Bucket initialization
- `backend/src/routes/upload.routes.ts` - Upload endpoint
- `backend/src/routes/moderation.routes.ts` - Moderation endpoints

### Frontend
- `frontend/src/app/page.tsx` - Upload page
- `frontend/src/app/moderation/page.tsx` - Moderation dashboard
- `frontend/src/app/gallery/page.tsx` - Gallery (placeholder)
- `frontend/src/lib/api-client.ts` - Backend API client
- `frontend/src/components/upload/ImageUploader.tsx` - Upload component

### Infrastructure
- `docker-compose.yml` - All services
- `database/init/001_init.sql` - Database schema
- `nginx/nginx.conf` - Reverse proxy config

## Next Steps

To complete the project, implement:

1. **AI Service Integration**
   - Create interfaces for image/LLM/music providers
   - Implement Google Gemini/Imagen client
   - Implement Stability AI client
   - Implement Claude client
   - Implement Suno music client

2. **Queue System**
   - Configure BullMQ with Redis
   - Create evolution job processor
   - Implement 60-iteration loop
   - Add video generation job
   - Add music generation job
   - Add Instagram upload job

3. **Scheduler**
   - Create cron service for 24h selection
   - Random photo picker from approved pool
   - Queue evolution job

4. **Video Processing**
   - ffmpeg wrapper service
   - Frame-to-video conversion (2 fps)
   - Audio mixing
   - Instagram format optimization

## Troubleshooting

### Upload Fails
- Check MinIO buckets exist: `docker logs morphorama-backend | grep bucket`
- Verify backend can reach MinIO
- Check file size < 50MB

### Backend Won't Start
- Check environment variables in `.env`
- Verify PostgreSQL is healthy: `docker ps`
- Check logs: `docker logs morphorama-backend`

### Database Connection Issues
- Ensure postgres container is healthy
- Check DATABASE_URL in backend logs
- Verify migrations ran

## Cost Estimates

**Monthly AI Costs** (1 evolution/day):
- Image Generation: 60 images/day × 30 days × $0.05 = **$90/month**
- Music Generation: 1 track/day × 30 days × $1.50 = **$45/month**
- **Total**: ~$135-150/month

**Infrastructure**: Self-hosted (free, except electricity)

## Project Created
- **Date**: December 13, 2025
- **Initial Setup**: Phase 1 (Infrastructure) + Phase 2 (Backend Core) + Phase 6 (Frontend)
- **Status**: Upload and moderation working, AI integration pending
