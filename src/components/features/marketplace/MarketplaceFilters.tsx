import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FilterState } from '@/hooks/useMarketplace';

interface MarketplaceFiltersProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  filters,
  setFilters,
  isOpen,
  onClose,
  t
}) => {
  const toggleCertification = (cert: string) => {
    setFilters({
      ...filters,
      certification: filters.certification.includes(cert)
        ? filters.certification.filter(c => c !== cert)
        : [...filters.certification, cert]
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 z-[101] rounded-t-[3rem] p-8 max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-8" />
            
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic tracking-tight dark:text-white">Refine Search</h3>
                <button onClick={onClose} className="text-slate-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Origin Region</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Littoral', 'South West', 'West', 'North West', 'Centre'].map(region => (
                      <button
                        key={region}
                        onClick={() => setFilters({ ...filters, origin: region })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filters.origin === region ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-slate-400'}`}
                      >
                        {region === 'All' ? t('all') : region}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Health Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Perfect', 'Good', 'Warning'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilters({ ...filters, healthStatus: status })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filters.healthStatus === status ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-slate-400'}`}
                      >
                        {status === 'All' ? t('all') : status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {['Organic', 'Fair Trade', 'G-GAP'].map(cert => (
                      <button
                        key={cert}
                        onClick={() => toggleCertification(cert)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filters.certification.includes(cert) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-slate-400'}`}
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Harvest Season</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Raining', 'Dry', 'Year round'].map(season => (
                      <button
                        key={season}
                        onClick={() => setFilters({ ...filters, season: season })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filters.season === season ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-slate-400'}`}
                      >
                        {season === 'All' ? t('all') : season}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 transition-transform active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MarketplaceFilters;
