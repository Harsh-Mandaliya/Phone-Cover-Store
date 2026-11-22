import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <p className="font-display text-8xl font-bold text-brand">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">This page slipped out of its case</h1>
        <p className="mt-2 text-muted">The page you’re looking for doesn’t exist or was moved.</p>
        <Link href="/" className="btn-brand mt-6">
          Back to home
        </Link>
      </div>
    </div>
  );
}
