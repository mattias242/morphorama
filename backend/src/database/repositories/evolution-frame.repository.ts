/**
 * Evolution Frame Repository
 *
 * Data access layer for individual evolution frames (iterations)
 */

import { query } from '../connection';

export interface EvolutionFrame {
  id: string;
  evolution_id: string;
  iteration_number: number;
  file_path: string;
  file_size: number;
  width: number | null;
  height: number | null;
  prompt_used: string | null;
  generation_time_ms: number | null;
  provider: string | null;
  model_version: string | null;
  created_at: Date;
}

export interface CreateFrameData {
  evolution_id: string;
  iteration_number: number;
  file_path: string;
  file_size: number;
  width?: number;
  height?: number;
  prompt_used?: string;
  generation_time_ms?: number;
  provider?: string;
  model_version?: string;
}

export class EvolutionFrameRepository {
  /**
   * Create a new evolution frame
   */
  async create(data: CreateFrameData): Promise<EvolutionFrame> {
    const result = await query(
      `INSERT INTO evolution_frames (
        evolution_id, iteration_number, file_path, file_size,
        width, height, prompt_used, generation_time_ms,
        provider, model_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.evolution_id,
        data.iteration_number,
        data.file_path,
        data.file_size,
        data.width || null,
        data.height || null,
        data.prompt_used || null,
        data.generation_time_ms || null,
        data.provider || null,
        data.model_version || null,
      ]
    );

    console.log(
      `🖼️  Created frame ${data.iteration_number}/60 for evolution ${data.evolution_id}`
    );
    return result.rows[0];
  }

  /**
   * Find frame by ID
   */
  async findById(id: string): Promise<EvolutionFrame | null> {
    const result = await query('SELECT * FROM evolution_frames WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all frames for an evolution
   */
  async findByEvolutionId(evolutionId: string): Promise<EvolutionFrame[]> {
    const result = await query(
      'SELECT * FROM evolution_frames WHERE evolution_id = $1 ORDER BY iteration_number ASC',
      [evolutionId]
    );
    return result.rows;
  }

  /**
   * Get specific frame by iteration number
   */
  async findByIteration(
    evolutionId: string,
    iterationNumber: number
  ): Promise<EvolutionFrame | null> {
    const result = await query(
      'SELECT * FROM evolution_frames WHERE evolution_id = $1 AND iteration_number = $2',
      [evolutionId, iterationNumber]
    );
    return result.rows[0] || null;
  }

  /**
   * Get the latest frame for an evolution
   */
  async getLatestFrame(evolutionId: string): Promise<EvolutionFrame | null> {
    const result = await query(
      `SELECT * FROM evolution_frames
       WHERE evolution_id = $1
       ORDER BY iteration_number DESC
       LIMIT 1`,
      [evolutionId]
    );
    return result.rows[0] || null;
  }

  /**
   * Count frames for an evolution
   */
  async countFrames(evolutionId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*)::INTEGER as count FROM evolution_frames WHERE evolution_id = $1',
      [evolutionId]
    );
    return result.rows[0].count;
  }

  /**
   * Get frame count grouped by evolution
   */
  async getFrameCounts(): Promise<{ evolution_id: string; count: number }[]> {
    const result = await query(`
      SELECT evolution_id, COUNT(*)::INTEGER as count
      FROM evolution_frames
      GROUP BY evolution_id
      ORDER BY count DESC
    `);
    return result.rows;
  }

  /**
   * Delete all frames for an evolution
   */
  async deleteByEvolutionId(evolutionId: string): Promise<number> {
    const result = await query(
      'DELETE FROM evolution_frames WHERE evolution_id = $1',
      [evolutionId]
    );
    console.log(`🗑️  Deleted ${result.rowCount} frames for evolution ${evolutionId}`);
    return result.rowCount || 0;
  }

  /**
   * Get statistics about frames
   */
  async getStats(): Promise<{
    total_frames: number;
    avg_generation_time_ms: number;
    avg_file_size_mb: number;
  }> {
    const result = await query(`
      SELECT
        COUNT(*)::INTEGER as total_frames,
        ROUND(AVG(generation_time_ms))::INTEGER as avg_generation_time_ms,
        ROUND(AVG(file_size) / 1024.0 / 1024.0, 2) as avg_file_size_mb
      FROM evolution_frames
    `);
    return result.rows[0];
  }
}

// Singleton export
export const evolutionFrameRepository = new EvolutionFrameRepository();
