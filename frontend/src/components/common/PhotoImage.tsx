'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface PhotoImageProps {
  photoId: string;
  alt: string;
  className?: string;
}

export default function PhotoImage({ photoId, alt, className = '' }: PhotoImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <ImageOff className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Image not found</p>
        <p className="text-xs text-gray-400 mt-1">Photo ID: {photoId.slice(0, 8)}...</p>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={`http://localhost:3001/api/photos/${photoId}/image`}
        alt={alt}
        className={`${className} ${loading ? 'hidden' : ''}`}
        crossOrigin="anonymous"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </>
  );
}
