# Morphorama

An automated AI-driven photo evolution platform that transforms uploaded images through 60 iterations of AI image generation, creates videos with AI-generated music, and automatically posts to Instagram.

## Features

- **Public Photo Upload**: Anyone can submit photos for potential evolution
- **Moderation System**: Password-protected dashboard for approving/rejecting submissions
- **Automated Evolution**: Daily selection of random approved photo for 60-iteration AI transformation
- **AI-Generated Music**: LLM analyzes the original image to create music prompts
- **Video Generation**: Combines all 60 frames into a 30-second video with music
- **Instagram Integration**: Automatic posting to configured Instagram account
- **Public Gallery**: Showcase all completed evolution videos

## Technology Stack

### Core
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: Next.js 14 (React) with Tailwind CSS
- **Database**: PostgreSQL 16
- **Queue**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible)
- **Video**: ffmpeg

### AI Services (Configurable)
- **Image Generation**: Google Imagen / Stability AI
- **LLM**: Google Gemini / Anthropic Claude
- **Music**: Suno AI
- **Social**: Instagram Graph API

## Architecture

```
morphorama/
├── backend/          # Express API + queue processors
├── frontend/         # Next.js web interface
├── worker/           # BullMQ job processors
├── database/         # SQL migrations
├── nginx/            # Reverse proxy
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Domain with DNS configured
- API keys for:
  - Google Gemini/Imagen (or Stability AI)
  - Anthropic Claude (optional)
  - Suno (or alternative music API)
  - Instagram

### Setup

1. **Clone and configure**
   ```bash
   git clone <repo>
   cd morphorama
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Generate SSL certificates**
   ```bash
   ./scripts/generate-ssl.sh your domain.com
   ```

3. **Start services**
   ```bash
   docker-compose up -d --build
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend npm run migrate
   ```

5. **Access**
   - Upload: https://yourdomain.com
   - Gallery: https://yourdomain.com/gallery
   - Moderation: https://yourdomain.com/moderation

## Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=<secure-password>

# AI Providers
IMAGE_PROVIDER=google-imagen    # or stability-ai
LLM_PROVIDER=gemini             # or claude
MUSIC_PROVIDER=suno

GOOGLE_GEMINI_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
STABILITY_API_KEY=<key>
SUNO_API_KEY=<key>

# Instagram
INSTAGRAM_ACCESS_TOKEN=<token>
INSTAGRAM_ACCOUNT_ID=<id>

# Security
MODERATOR_PASSWORD=<password>
JWT_SECRET=<secret>

# Schedule
SCHEDULE_INTERVAL=24h           # 1 evolution per day
```

## Cost Estimation

**Monthly AI Costs** (1 evolution/day):
- Image Generation: ~$90/month (60 images/day × 30 days)
- Music Generation: ~$45/month (1 track/day × 30 days)
- **Total**: ~$135-150/month

**Infrastructure**: Self-hosted (free, except electricity)

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Worker
```bash
cd worker
npm install
npm run dev
```

## How It Works

1. **Upload**: Users upload photos via web interface
2. **Moderation**: Moderators approve/reject submissions
3. **Schedule**: Every 24 hours, system selects random approved photo
4. **Evolution**: Photo goes through 60 iterations of AI image generation
5. **Music**: LLM analyzes original image, generates music prompt, creates 30s track
6. **Video**: ffmpeg combines 60 frames (0.5s each) with music
7. **Publish**: Video automatically posts to Instagram
8. **Gallery**: Video appears in public gallery

## Monitoring

- **Health**: https://yourdomain.com/health
- **Queue Status**: Check Redis/BullMQ dashboard
- **Logs**: `docker-compose logs -f`

## Backup

```bash
# Database backup
./scripts/backup.sh

# Full backup (DB + uploads + videos)
docker-compose exec backend npm run backup:full
```

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
