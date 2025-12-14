# AI Services Implementation Summary

**Date**: December 13, 2025
**Status**: Core AI integration complete, ready for testing

## What Was Implemented

### 1. Service Interfaces
✅ **Created provider abstraction layer**
- `backend/src/services/ai/interfaces/image-provider.interface.ts`
- `backend/src/services/ai/interfaces/llm-provider.interface.ts`

These interfaces allow easy switching between AI providers (Gemini/Claude for LLM, Imagen/Stability for images).

### 2. LLM Service (Google Gemini with Vision)
✅ **Fully implemented and ready**
- `backend/src/services/ai/llm/gemini.service.ts`
- `backend/src/services/ai/llm/index.ts`

**Features:**
- Uses `gemini-2.0-flash-exp` model with vision capabilities
- Analyzes images and generates creative evolution prompts
- Iteration-aware prompting (different system prompts for iteration 1 vs 2-60)
- Full error handling and logging

### 3. Image Generation Services
✅ **Stability AI - Fully implemented and ready**
- `backend/src/services/ai/image/stability-ai.service.ts`
- Uses Stability AI's API (SD 3.5 Large model)
- Supports text-to-image and image-to-image generation
- Configurable aspect ratio, negative prompts, seeds

⚠️ **Google Imagen - Placeholder (requires Vertex AI setup)**
- `backend/src/services/ai/image/google-imagen.service.ts`
- Created but not functional (needs Vertex AI credentials)
- Use Stability AI instead for now

**Factory pattern:**
- `backend/src/services/ai/image/index.ts` - Auto-selects provider based on config

### 4. Database Repositories
✅ **Evolution data access layer**
- `backend/src/database/repositories/evolution.repository.ts`
  - Create/track evolution runs
  - Update status and progress
  - Mark complete/failed
  - Statistics

- `backend/src/database/repositories/evolution-frame.repository.ts`
  - Store individual frame data
  - Track prompts and metadata
  - Query frames by iteration

### 5. Queue System
✅ **BullMQ configuration**
- `backend/src/queue/index.ts`
- Redis-backed job queue
- Retry logic with exponential backoff
- Event listeners for monitoring

### 6. Evolution Processor
✅ **60-iteration core logic**
- `backend/src/queue/processors/evolution.processor.ts`

**Process flow:**
1. Fetch source photo from MinIO
2. Update evolution status to 'processing'
3. **Loop 60 times:**
   - Get previous frame (or original for iteration 1)
   - Call LLM to analyze image → generate prompt
   - Call image provider with prompt → generate image
   - Upload frame to MinIO
   - Save frame record to database
   - Update progress
   - 1 second delay between iterations
4. Mark evolution as complete

**Error handling:**
- Retry failed iterations (up to 3 times with exponential backoff)
- Save error state to database
- Preserve progress (already generated frames)

### 7. Worker Service
⚠️ **Partially implemented**
- `worker/src/index.ts` - Skeleton created
- `worker/src/config.ts` - Configuration ready
- **Note:** Worker needs the evolution processor integrated (see TODO in worker code)

**Current workaround:** Evolution processor can run directly from backend API for testing.

### 8. Testing API Routes
✅ **Full REST API for testing**
- `backend/src/routes/evolution.routes.ts`

**Endpoints:**
- `POST /api/evolution/start/:photoId` - Start evolution (with `useQueue: false` for direct processing)
- `GET /api/evolution/:id` - Get evolution status and progress
- `GET /api/evolution/:id/frames` - List all frames with prompts
- `GET /api/evolution/:id/frames/:iteration/image` - Download specific frame image
- `GET /api/evolution/list/recent` - Recent evolutions
- `GET /api/evolution/` - Statistics

All routes are protected with authentication (require moderator login).

### 9. Configuration Updates
✅ **Provider-based API key validation**
- `backend/src/config/index.ts`
- Default image provider: `stability-ai`
- Default LLM provider: `gemini`
- Validates required API keys based on configured providers
- Fails fast on startup if keys are missing

## Architecture Decisions

### Why Stability AI instead of Google Imagen?
- **Stability AI**: Simple REST API, works immediately
- **Google Imagen**: Requires Vertex AI setup with GCP project, service accounts, etc.
- Decision: Start with Stability AI, add Imagen later when Vertex AI is configured

### Why Vision-Based Evolution?
- LLM analyzes each frame visually (not just text prompts)
- More dynamic and adaptive transformations
- Better handles unexpected generation results
- Creates more organic evolution chains

### Why Direct Processing Mode?
- Worker integration requires additional setup
- Direct mode allows immediate testing
- Background processing still works (non-blocking)
- Can switch to queue mode later with `useQueue: true`

## Configuration Required

### Environment Variables (.env)

```bash
# Required for Gemini (LLM)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Required for Stability AI (Image Generation)
STABILITY_API_KEY=your_stability_api_key_here

# Provider Configuration
LLM_PROVIDER=gemini
IMAGE_PROVIDER=stability-ai

# Existing infrastructure (already configured)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=...
```

## How to Test

### Step 1: Add API Keys to .env

Create or update `/morphorama/.env`:

```bash
# Add these lines
GOOGLE_GEMINI_API_KEY=AIza...your_key_here
STABILITY_API_KEY=sk-...your_key_here
LLM_PROVIDER=gemini
IMAGE_PROVIDER=stability-ai
```

### Step 2: Rebuild Backend Container

```bash
cd /Users/mattiaswahlberg/coding/claude-claude/morphorama
docker-compose up -d --build backend
```

Check logs to verify AI services initialized:
```bash
docker logs morphorama-backend -f
```

Look for:
```
🤖 Gemini LLM service initialized (model: gemini-2.0-flash-exp)
🎨 Stability AI service initialized (model: sd3.5-large)
```

### Step 3: Upload and Approve a Test Photo

1. Go to https://localhost
2. Upload a photo (JPEG/PNG, any size)
3. Go to https://localhost/moderation
4. Approve the photo
5. Note the photo ID from the response or database

### Step 4: Start an Evolution

**Option A: Using curl**
```bash
# First, login to get session cookie
curl -k -c cookies.txt -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_moderator_password"}'

# Start evolution (use actual photo ID)
curl -k -b cookies.txt -X POST https://localhost/api/evolution/start/PHOTO_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{"iterations": 10, "useQueue": false}'
```

**Note:** Start with 10 iterations for faster testing, then try 60 later.

**Option B: Using Postman/Insomnia**
1. POST https://localhost/api/auth/login with `{"password":"..."}`
2. POST https://localhost/api/evolution/start/:photoId with `{"iterations": 10, "useQueue": false}`

### Step 5: Monitor Progress

```bash
# Watch backend logs
docker logs morphorama-backend -f
```

You'll see:
```
🚀 Starting evolution abc-123 for photo def-456
📍 Iteration 1/10
🤖 Analyzing image and generating prompt...
💡 Prompt: "Transform into a vibrant underwater scene..."
🎨 Generating image...
✅ Image generated in 3421ms (1024x1024)
🖼️ Created frame 1/10 for evolution abc-123
```

### Step 6: Check Progress via API

```bash
# Get evolution status
curl -k -b cookies.txt https://localhost/api/evolution/EVOLUTION_ID

# List frames
curl -k -b cookies.txt https://localhost/api/evolution/EVOLUTION_ID/frames

# Download specific frame
curl -k -b cookies.txt https://localhost/api/evolution/EVOLUTION_ID/frames/5/image -o frame-5.png
```

### Step 7: Verify in Database

```bash
docker exec -it morphorama-db psql -U morpho_user -d morphorama

-- Check evolution
SELECT id, status, current_iteration, total_iterations, duration_seconds
FROM evolutions ORDER BY created_at DESC LIMIT 1;

-- Check frames
SELECT iteration_number, prompt_used, file_size, generation_time_ms
FROM evolution_frames
WHERE evolution_id = 'EVOLUTION_ID'
ORDER BY iteration_number;
```

### Step 8: Check MinIO Storage

1. Go to http://localhost:9001
2. Login with MinIO credentials
3. Browse `evolutions` bucket
4. Should see folders like `abc-123-def-456/` with `frame-001.png`, `frame-002.png`, etc.

## Expected Results

### Success Criteria
✅ All 10 (or 60) frames generate successfully
✅ Prompts show creative evolution
✅ Images stored in MinIO with correct paths
✅ Database tracks progress accurately
✅ Evolution completes without errors

### Sample Evolution
**Original**: Photo of a cat
**Frame 1**: "Transform into a majestic lion in a savanna sunset"
**Frame 2**: "Evolve into a celestial constellation of stars forming a feline shape"
**Frame 3**: "Morph into a steampunk mechanical cat with brass gears"
...and so on for 60 iterations

### Performance Estimates
- **LLM prompt generation**: ~500-1000ms per iteration
- **Image generation**: ~2000-5000ms per iteration
- **Total per iteration**: ~3-6 seconds
- **60 iterations**: ~3-6 minutes total
- **10 iterations (for testing)**: ~30-60 seconds

## Cost Estimates

### Per Evolution (60 iterations)
- **Gemini API** (LLM with vision): 60 calls × ~$0.002 = **$0.12**
- **Stability AI** (image generation): 60 images × ~$0.05 = **$3.00**
- **Total per evolution**: **~$3.12**

### Testing (10 iterations)
- **Cost**: ~$0.52 per test evolution

## Troubleshooting

### Backend Won't Start
**Error**: "Missing required API keys"
- **Fix**: Add `GOOGLE_GEMINI_API_KEY` and `STABILITY_API_KEY` to `.env`

### "Evolution processor not yet integrated"
**Error**: Worker shows placeholder message
- **Fix**: Use direct mode with `"useQueue": false` in the API request
- Alternative: Integrate processor into worker (see worker/src/index.ts TODO)

### "Gemini API key validation failed"
**Error**: Invalid or expired API key
- **Fix**: Get new API key from https://makersuite.google.com/app/apikey
- Verify key in `.env` file

### "Stability AI generation failed"
**Error**: API error or rate limit
- **Fix**: Check API key at https://platform.stability.ai/account/keys
- Verify credits/balance in Stability AI account
- Check rate limits (tier-dependent)

### Images Not Saving to MinIO
**Error**: Upload failed
- **Fix**: Check MinIO is running: `docker ps | grep minio`
- Verify `evolutions` bucket exists
- Check MinIO logs: `docker logs morphorama-minio`

### Evolution Stuck at Iteration X
**Error**: Process stops mid-evolution
- **Check**: Backend logs for specific error
- **Common**: API rate limit hit
- **Fix**: Retry logic should handle this, but may need manual restart

## Next Steps

### Immediate (Testing Phase)
1. ✅ Add API keys to .env
2. ✅ Test with 10-iteration evolution
3. ✅ Verify prompts are creative and varied
4. ✅ Check image quality
5. ✅ Test error handling (invalid photo ID, etc.)

### Short Term (Integration)
1. Integrate evolution processor into worker container
2. Test queue mode with `"useQueue": true`
3. Add frontend UI for viewing evolutions
4. Add gallery page showing completed evolutions

### Medium Term (Features)
1. Implement video generation (ffmpeg combining frames)
2. Implement music generation (Suno API)
3. Implement Instagram posting
4. Add 24h scheduler

### Long Term (Polish)
1. Add Vertex AI setup for Google Imagen
2. Implement Claude LLM provider
3. Add cost tracking and budgets
4. Add admin dashboard for monitoring

## Files Created/Modified

### New Files
```
backend/src/services/ai/interfaces/
├── image-provider.interface.ts
└── llm-provider.interface.ts

backend/src/services/ai/llm/
├── gemini.service.ts
└── index.ts

backend/src/services/ai/image/
├── google-imagen.service.ts
├── stability-ai.service.ts
└── index.ts

backend/src/database/repositories/
├── evolution.repository.ts
└── evolution-frame.repository.ts

backend/src/queue/
├── index.ts
└── processors/
    └── evolution.processor.ts

backend/src/routes/
└── evolution.routes.ts

worker/src/
└── config.ts
```

### Modified Files
```
backend/src/config/index.ts
  - Added provider-based API key validation
  - Changed default image provider to stability-ai

backend/src/index.ts
  - Added evolution routes

worker/src/index.ts
  - Updated to listen to 'evolution' queue
  - Added TODO for processor integration
```

## Known Limitations

1. **Google Imagen**: Requires Vertex AI setup (not implemented)
2. **Worker**: Processor not yet integrated (use direct mode)
3. **Claude LLM**: Not implemented (use Gemini)
4. **Video Generation**: Not implemented
5. **Music**: Not implemented
6. **Instagram**: Not implemented
7. **Scheduler**: Not implemented

## Support

- Check logs: `docker logs morphorama-backend -f`
- Database access: `docker exec -it morphorama-db psql -U morpho_user -d morphorama`
- MinIO console: http://localhost:9001
- API docs: See route comments in `evolution.routes.ts`

---

**Implementation completed**: December 13, 2025
**Ready for testing with**: Gemini (LLM) + Stability AI (Image Generation)
**Estimated test time**: 30-60 seconds (10 iterations) or 3-6 minutes (60 iterations)
