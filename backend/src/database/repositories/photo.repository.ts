import { query } from '../connection';

export interface Photo {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  status: 'pending' | 'approved' | 'rejected';
  moderated_at?: Date;
  moderated_by?: string;
  rejection_reason?: string;
  uploaded_at: Date;
  ip_address?: string;
  user_agent?: string;
  times_selected: number;
  last_selected_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class PhotoRepository {
  // Create new photo
  async create(data: {
    original_filename: string;
    stored_filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    width?: number;
    height?: number;
    ip_address?: string;
    user_agent?: string;
  }): Promise<Photo> {
    const result = await query(
      `INSERT INTO photos (
        original_filename, stored_filename, file_path, file_size,
        mime_type, width, height, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.original_filename,
        data.stored_filename,
        data.file_path,
        data.file_size,
        data.mime_type,
        data.width,
        data.height,
        data.ip_address,
        data.user_agent,
      ]
    );
    return result.rows[0];
  }

  // Get photo by ID
  async findById(id: string): Promise<Photo | null> {
    const result = await query('SELECT * FROM photos WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Get all pending photos for moderation
  async findPending(limit: number = 20, offset: number = 0): Promise<Photo[]> {
    const result = await query(
      `SELECT * FROM photos
       WHERE status = 'pending'
       ORDER BY uploaded_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Count pending photos
  async countPending(): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) as count FROM photos WHERE status = 'pending'"
    );
    return parseInt(result.rows[0].count);
  }

  // Approve photo
  async approve(id: string, moderatedBy: string): Promise<Photo> {
    const result = await query(
      `UPDATE photos
       SET status = 'approved', moderated_at = NOW(), moderated_by = $2
       WHERE id = $1
       RETURNING *`,
      [id, moderatedBy]
    );
    return result.rows[0];
  }

  // Reject photo
  async reject(id: string, moderatedBy: string, reason?: string): Promise<Photo> {
    const result = await query(
      `UPDATE photos
       SET status = 'rejected', moderated_at = NOW(), moderated_by = $2, rejection_reason = $3
       WHERE id = $1
       RETURNING *`,
      [id, moderatedBy, reason]
    );
    return result.rows[0];
  }

  // Get random approved photo that hasn't been selected recently
  async getRandomApproved(): Promise<Photo | null> {
    const result = await query(
      `SELECT * FROM photos
       WHERE status = 'approved'
       AND (last_selected_at IS NULL OR last_selected_at < NOW() - INTERVAL '7 days')
       ORDER BY RANDOM()
       LIMIT 1`
    );
    return result.rows[0] || null;
  }

  // Mark photo as selected
  async markAsSelected(id: string): Promise<void> {
    await query(
      `UPDATE photos
       SET times_selected = times_selected + 1, last_selected_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  // Get moderation stats
  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) as total
      FROM photos
    `);
    return result.rows[0];
  }
}

export const photoRepository = new PhotoRepository();
