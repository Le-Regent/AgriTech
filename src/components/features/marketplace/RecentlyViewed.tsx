import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

interface RecentlyViewedProps {
  products: Product[];
  onClear: () => void;
  t: (key: string) => string;
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ products, onClear, t }) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('recently_viewed')}</h3>
        <button 
          onClick={onClear}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
        >
          {t('clear')}
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/marketplace/${p.id}`}
            className="flex-none w-48 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="aspect-square rounded-2xl overflow-hidden mb-3">
              <ResponsiveImage
                src={p.image_url || 'https://picsum.photos/seed/product/200/200'}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                baseWidth={200}
                baseHeight={200}
              />
            </div>
            <h4 className="text-xs font-bold truncate dark:text-white">{p.name}</h4>
            <p className="text-[10px] font-black text-primary">{p.price.toLocaleString()} FCFA/{p.unit}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
