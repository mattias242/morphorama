import Link from 'next/link';
import { Home } from 'lucide-react';

export default function GalleryPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Evolution Gallery</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="text-6xl mb-6">🎬</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Evolution videos will appear here once photos are approved and processed
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-3">How to see evolutions:</h3>
            <ol className="text-left text-blue-800 space-y-2">
              <li>1. Upload photos on the home page</li>
              <li>2. Approve them in the moderation dashboard</li>
              <li>3. Wait for the 24-hour scheduler to select a photo</li>
              <li>4. The AI evolution process creates a 30-second video</li>
              <li>5. Videos appear here and on Instagram</li>
            </ol>
          </div>

          <Link
            href="/"
            className="mt-8 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Upload Your First Photo
          </Link>
        </div>
      </div>
    </main>
  );
}
