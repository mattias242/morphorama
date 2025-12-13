import ImageUploader from '@/components/upload/ImageUploader';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎨 Morphorama</h1>
          <nav className="flex gap-4">
            <Link
              href="/gallery"
              className="text-white hover:text-white/80 transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/moderation"
              className="text-white hover:text-white/80 transition-colors"
            >
              Moderation
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-12">
          <h2 className="text-5xl font-bold mb-4">AI Photo Evolution</h2>
          <p className="text-xl opacity-90">
            Upload a photo and watch it evolve through 60 iterations of AI transformation
          </p>
        </div>

        <ImageUploader />

        {/* How it works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">📸</div>
              <h4 className="text-xl font-semibold mb-2">1. Upload</h4>
              <p className="opacity-90">
                Submit your photo for review. All uploads are moderated before entering the pool.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">🎨</div>
              <h4 className="text-xl font-semibold mb-2">2. Evolution</h4>
              <p className="opacity-90">
                Every 24 hours, a random photo undergoes 60 iterations of AI transformation.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">🎬</div>
              <h4 className="text-xl font-semibold mb-2">3. Video</h4>
              <p className="opacity-90">
                A video is created with AI-generated music and posted to Instagram.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-white/70">
          <p>Morphorama - Where Photos Evolve Through AI</p>
        </div>
      </footer>
    </main>
  );
}
