import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-midnight-blue flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-soft-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-light-gray mb-6">Page Not Found</h2>
        <p className="text-light-gray mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-electric-purple hover:bg-purple-600 text-soft-white rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
