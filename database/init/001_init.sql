-- Morphorama Database Schema
-- Initial setup for photo evolution platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Photos table (uploaded by users)
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    width INTEGER,
    height INTEGER,

    -- Moderation
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    moderated_at TIMESTAMP,
    moderated_by VARCHAR(100),
    rejection_reason TEXT,

    -- Metadata
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Tracking
    times_selected INTEGER DEFAULT 0,
    last_selected_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Evolution runs
CREATE TABLE evolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    current_iteration INTEGER DEFAULT 0,
    total_iterations INTEGER DEFAULT 60,

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Job tracking
    queue_job_id VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Individual evolution frames
CREATE TABLE evolution_frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evolution_id UUID NOT NULL REFERENCES evolutions(id) ON DELETE CASCADE,

    iteration_number INTEGER NOT NULL,

    -- Image data
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,

    -- AI generation metadata
    prompt_used TEXT,
    generation_time_ms INTEGER,
    provider VARCHAR(50),
    model_version VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(evolution_id, iteration_number)
);

-- Generated videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evolution_id UUID NOT NULL REFERENCES evolutions(id) ON DELETE CASCADE,

    -- Video file
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    duration_seconds DECIMAL(5,2),

    -- Video specs
    width INTEGER,
    height INTEGER,
    fps DECIMAL(5,2) DEFAULT 2.0,
    codec VARCHAR(50),

    -- Audio
    has_audio BOOLEAN DEFAULT false,
    audio_file_path VARCHAR(512),
    music_prompt TEXT,
    music_provider VARCHAR(50),

    -- Processing
    processing_time_ms INTEGER,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Instagram uploads
CREATE TABLE instagram_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    evolution_id UUID NOT NULL REFERENCES evolutions(id) ON DELETE CASCADE,

    -- Instagram data
    instagram_media_id VARCHAR(100),
    permalink VARCHAR(512),

    -- Caption/metadata
    caption TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'uploading', 'published', 'failed')),
    error_message TEXT,

    uploaded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Job queue tracking (for monitoring)
CREATE TABLE job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    job_id VARCHAR(100) NOT NULL,

    evolution_id UUID REFERENCES evolutions(id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL,
    data JSONB,
    error JSONB,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX idx_photos_approved_not_selected ON photos(status, last_selected_at)
    WHERE status = 'approved';

CREATE INDEX idx_evolutions_status ON evolutions(status);
CREATE INDEX idx_evolutions_source_photo ON evolutions(source_photo_id);
CREATE INDEX idx_evolutions_created_at ON evolutions(created_at);

CREATE INDEX idx_evolution_frames_evolution ON evolution_frames(evolution_id);
CREATE INDEX idx_evolution_frames_iteration ON evolution_frames(evolution_id, iteration_number);

CREATE INDEX idx_videos_evolution ON videos(evolution_id);

CREATE INDEX idx_instagram_posts_status ON instagram_posts(status);
CREATE INDEX idx_instagram_posts_video ON instagram_posts(video_id);

CREATE INDEX idx_job_logs_type_status ON job_logs(job_type, status);
CREATE INDEX idx_job_logs_evolution ON job_logs(evolution_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evolutions_updated_at BEFORE UPDATE ON evolutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
