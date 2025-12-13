/**
 * Evolution Repository
 *
 * Data access layer for evolution runs
 */

import { query } from '../connection';

export interface Evolution {
  id: string;
  source_photo_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  current_iteration: number;
  total_iterations: number;
  started_at: Date | null;
  completed_at: Date | null;
  duration_seconds: number | null;
  error_message: string | null;
  retry_count: number;
  queue_job_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEvolutionData {
  source_photo_id: string;
  total_iterations?: number;
  queue_job_id?: string;
}

export class EvolutionRepository {
  /**
   * Create a new evolution run
   */
  async create(data: CreateEvolutionData): Promise<Evolution> {
    const result = await query(
      `INSERT INTO evolutions (source_photo_id, total_iterations, queue_job_id, status)
       VALUES ($1, $2, $3, 'queued')
       RETURNING *`,
      [data.source_photo_id, data.total_iterations || 60, data.queue_job_id || null]
    );

    console.log(`📊 Created evolution ${result.rows[0].id} for photo ${data.source_photo_id}`);
    return result.rows[0];
  }

  /**
   * Find evolution by ID
   */
  async findById(id: string): Promise<Evolution | null> {
    const result = await query('SELECT * FROM evolutions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find evolution by queue job ID
   */
  async findByJobId(jobId: string): Promise<Evolution | null> {
    const result = await query('SELECT * FROM evolutions WHERE queue_job_id = $1', [jobId]);
    return result.rows[0] || null;
  }

  /**
   * Get all evolutions for a photo
   */
  async findByPhotoId(photoId: string): Promise<Evolution[]> {
    const result = await query(
      'SELECT * FROM evolutions WHERE source_photo_id = $1 ORDER BY created_at DESC',
      [photoId]
    );
    return result.rows;
  }

  /**
   * Update evolution status
   */
  async updateStatus(id: string, status: Evolution['status']): Promise<Evolution> {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const params: any[] = [id, status];

    // Set started_at when processing begins
    if (status === 'processing') {
      updates.push('started_at = NOW()');
    }

    // Set completed_at and calculate duration when finished
    if (status === 'completed' || status === 'failed') {
      updates.push('completed_at = NOW()');
      updates.push('duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER');
    }

    const result = await query(
      `UPDATE evolutions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    console.log(`📊 Evolution ${id} status → ${status}`);
    return result.rows[0];
  }

  /**
   * Update current iteration progress
   */
  async updateProgress(id: string, currentIteration: number): Promise<Evolution> {
    const result = await query(
      `UPDATE evolutions
       SET current_iteration = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, currentIteration]
    );

    return result.rows[0];
  }

  /**
   * Mark evolution as completed
   */
  async markComplete(id: string): Promise<Evolution> {
    const result = await query(
      `UPDATE evolutions
       SET status = 'completed',
           completed_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const duration = result.rows[0].duration_seconds;
    console.log(`✅ Evolution ${id} completed in ${duration}s`);
    return result.rows[0];
  }

  /**
   * Mark evolution as failed with error message
   */
  async markFailed(id: string, errorMessage: string): Promise<Evolution> {
    const result = await query(
      `UPDATE evolutions
       SET status = 'failed',
           error_message = $2,
           completed_at = NOW(),
           retry_count = retry_count + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, errorMessage]
    );

    console.error(`❌ Evolution ${id} failed: ${errorMessage}`);
    return result.rows[0];
  }

  /**
   * Get evolution statistics
   */
  async getStats(): Promise<{
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const result = await query(`
      SELECT
        COUNT(*)::INTEGER as total,
        COUNT(*) FILTER (WHERE status = 'queued')::INTEGER as queued,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed
      FROM evolutions
    `);

    return result.rows[0];
  }

  /**
   * Get recent evolutions
   */
  async getRecent(limit: number = 10): Promise<Evolution[]> {
    const result = await query(
      `SELECT * FROM evolutions ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Delete evolution and all associated data
   */
  async delete(id: string): Promise<void> {
    await query('DELETE FROM evolutions WHERE id = $1', [id]);
    console.log(`🗑️  Deleted evolution ${id}`);
  }
}

// Singleton export
export const evolutionRepository = new EvolutionRepository();
