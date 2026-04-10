import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-4xl font-black mb-4 dark:text-white">404 - Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
        Go Home
      </Link>
    </div>
  );
}
