import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers';
import ClientLayout from '@/components/layout/ClientLayout';
import { Toaster } from 'sonner';
import ProgressBar from '@/components/ui/ProgressBar';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriTech Pro',
  description: 'Smart Agriculture Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.openweathermap.org" />
        <link rel="preconnect" href="https://picsum.photos" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} h-full overflow-hidden`}>
        <Providers>
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          <ClientLayout>
            {children}
          </ClientLayout>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
