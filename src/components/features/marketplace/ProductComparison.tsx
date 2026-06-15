import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductComparisonProps {
  products: Product[];
  onClose: () => void;
  onClear: () => void;
  t: (key: string) => string;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  onClose,
  onClear,
  t
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black dark:text-white">{t('product_comparison')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Comparing {products.length} {t('items')} side-by-side</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">{t('feature')}</th>
                {products.map(p => (
                  <th key={p.id} className="p-4 text-left border-b border-slate-100 dark:border-slate-800 min-w-[200px]">
                    <div className="flex items-center gap-4">
                      <Image 
                        src={p.image_url || 'https://picsum.photos/seed/product/100/100'} 
                        alt={p.name} 
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-black dark:text-white">{p.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { label: t('price'), key: 'price', format: (v: any, p: any) => `${v.toLocaleString()} FCFA/${p.unit}` },
                { label: t('location'), key: 'location' },
                { label: t('health_status'), key: 'health_status' },
                { label: t('certifications'), key: 'certifications', format: (v: any) => v.length > 0 ? v.join(', ') : 'None' },
                { label: t('harvest_season'), key: 'harvest_season' },
                { label: t('marketplace_title'), key: 'category' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">{row.label}</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-sm dark:text-white">
                      {row.format ? row.format((p as any)[row.key], p) : (p as any)[row.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
          <button 
            onClick={onClear}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {t('clear')}
          </button>
          <button 
            onClick={onClose}
            className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            {t('close_menu')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductComparison;
