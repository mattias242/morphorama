'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getModerationQueue,
  getModerationStats,
  approvePhoto,
  rejectPhoto,
  checkAuthStatus,
  logout,
  Photo,
  ModerationStats,
} from '@/lib/api-client';
import { CheckCircle, XCircle, Loader2, Home, LogOut } from 'lucide-react';
import PhotoImage from '@/components/common/PhotoImage';

export default function ModerationPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authenticated } = await checkAuthStatus();
        if (!authenticated) {
          router.push('/moderation/login');
        } else {
          setAuthChecking(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        router.push('/moderation/login');
      }
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueData, statsData] = await Promise.all([
        getModerationQueue(page, 20),
        getModerationStats(),
      ]);
      setPhotos(queueData.photos);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading moderation data:', error);
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push('/moderation/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecking) {
      loadData();
    }
  }, [page, authChecking]);

  const handleApprove = async (photoId: string) => {
    setProcessing(photoId);
    try {
      await approvePhoto(photoId, 'moderator');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error approving photo:', error);
      alert('Failed to approve photo');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (photoId: string) => {
    const reason = prompt('Rejection reason (optional):');
    setProcessing(photoId);
    try {
      await rejectPhoto(photoId, reason || undefined, 'moderator');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error rejecting photo:', error);
      alert('Failed to reject photo');
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/moderation/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show loading state while checking auth
  if (authChecking) {
    return (
      <main className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* No photos */}
        {!loading && photos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No photos pending moderation</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Upload some photos to get started
            </Link>
          </div>
        )}

        {/* Photo grid */}
        {!loading && photos.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Photo preview */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <PhotoImage
                    photoId={photo.id}
                    alt={photo.original_filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Photo info */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {photo.original_filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded: {new Date(photo.uploaded_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Size: {(photo.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {photo.width && photo.height && (
                    <p className="text-xs text-gray-400">
                      Dimensions: {photo.width} × {photo.height}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleApprove(photo.id)}
                    disabled={processing === photo.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {processing === photo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(photo.id)}
                    disabled={processing === photo.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {processing === photo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
