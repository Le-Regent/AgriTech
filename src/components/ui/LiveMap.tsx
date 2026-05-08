'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MapWithNoSSR = dynamic(
  () => import('./MapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 dark:bg-muted-dark animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Map...</span>
        </div>
      </div>
    )
  }
);

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
  }>;
  className?: string;
}

export default function LiveMap(props: LiveMapProps) {
  return <MapWithNoSSR {...props} />;
}
