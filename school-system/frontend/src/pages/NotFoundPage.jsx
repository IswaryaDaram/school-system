import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center p-4">
      <div>
        <p className="text-8xl font-display font-bold text-indigo-500 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
