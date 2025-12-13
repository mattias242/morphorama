'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPhoto } from '@/lib/api-client';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadStatus('idle');
    setMessage('');

    try {
      const result = await uploadPhoto(file);
      setUploadStatus('success');
      setMessage(`✅ ${result.message} Photo is now pending moderation.`);
      console.log('Uploaded photo:', result.photo);
    } catch (error: any) {
      setUploadStatus('error');
      setMessage(`❌ Upload failed: ${error.response?.data?.error || error.message}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-16 h-16 text-gray-400" />
          )}

          <div>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              {uploading
                ? 'Uploading...'
                : isDragActive
                ? 'Drop your photo here'
                : 'Drag & drop a photo here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select a file (JPEG, PNG, WebP, GIF, max 50MB)
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`
            mt-6 p-4 rounded-lg flex items-center gap-3
            ${uploadStatus === 'success' ? 'bg-green-50 text-green-800' : ''}
            ${uploadStatus === 'error' ? 'bg-red-50 text-red-800' : ''}
          `}
        >
          {uploadStatus === 'success' && <CheckCircle className="w-5 h-5" />}
          {uploadStatus === 'error' && <XCircle className="w-5 h-5" />}
          <p>{message}</p>
        </div>
      )}

      {/* Info section */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>Your photo will be reviewed by our moderators</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>If approved, it enters the evolution pool</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>Every 24 hours, a random photo is selected for AI evolution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">4.</span>
            <span>The evolution video is automatically posted to Instagram</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
