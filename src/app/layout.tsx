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
  title: {
    default: 'KamerFresh | Direct Farm-to-Table Cameroon',
    template: '%s | KamerFresh'
  },
  description: 'The premier smart agriculture platform connecting Cameroon farmers directly to buyers. Featuring AI-powered crop diagnosis, real-time freshness tracking, and secure escrow payments.',
  keywords: ['agriculture', 'Cameroon', 'farmers market', 'agritech', 'AI crop diagnosis', 'fresh produce', 'KamerFresh', 'direct trade'],
  authors: [{ name: 'KamerFresh Team' }],
  creator: 'KamerFresh',
  publisher: 'KamerFresh',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_CM',
    url: 'https://kamerfresh.app',
    title: 'KamerFresh | Direct Farm-to-Table Cameroon',
    description: 'Transforming Cameroon agricultural trade with AI and transparency.',
    siteName: 'KamerFresh',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KamerFresh | Direct Farm-to-Table Cameroon',
    description: 'Fresh from the soil of 237. Smart agriculture for a better future.',
  },
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
