import axios from 'axios';

// API base URL - uses Next.js API proxy
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Photo types
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
  moderated_at?: string;
  moderated_by?: string;
  rejection_reason?: string;
  uploaded_at: string;
  times_selected: number;
  last_selected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Upload photo
export const uploadPhoto = async (file: File): Promise<{ photo: Photo; message: string }> => {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Get moderation queue
export const getModerationQueue = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  photos: Photo[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const response = await apiClient.get('/moderation/queue', {
    params: { page, limit },
  });
  return response.data;
};

// Get moderation stats
export const getModerationStats = async (): Promise<ModerationStats> => {
  const response = await apiClient.get('/moderation/stats');
  return response.data;
};

// Get photo by ID
export const getPhoto = async (id: string): Promise<Photo> => {
  const response = await apiClient.get(`/moderation/photo/${id}`);
  return response.data;
};

// Approve photo
export const approvePhoto = async (id: string, moderatorName?: string): Promise<Photo> => {
  const response = await apiClient.patch(
    `/moderation/photo/${id}`,
    { action: 'approve' },
    {
      headers: moderatorName ? { 'x-moderator-name': moderatorName } : {},
    }
  );
  return response.data.photo;
};

// Reject photo
export const rejectPhoto = async (
  id: string,
  reason?: string,
  moderatorName?: string
): Promise<Photo> => {
  const response = await apiClient.patch(
    `/moderation/photo/${id}`,
    { action: 'reject', reason },
    {
      headers: moderatorName ? { 'x-moderator-name': moderatorName } : {},
    }
  );
  return response.data.photo;
};

// Auth types
export interface AuthStatus {
  authenticated: boolean;
}

// Auth endpoints
export const login = async (password: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/login', { password });
  return response.data;
};

export const logout = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const checkAuthStatus = async (): Promise<AuthStatus> => {
  const response = await apiClient.get('/auth/status');
  return response.data;
};

export default apiClient;
