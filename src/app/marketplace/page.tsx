'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride, Step, STATUS } from 'react-joyride';
import { useCart } from '@/context/CartContext';
import { supabaseService } from '@/services/supabaseService';
import { Product } from '@/types';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import ProductModal from '@/components/features/marketplace/ProductModal';
import ProductCard from '@/components/features/marketplace/ProductCard';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useOffline } from '@/context/OfflineContext';

// Sub-components
import MarketplaceHeader from '@/components/features/marketplace/MarketplaceHeader';
import MarketplaceFilters from '@/components/features/marketplace/MarketplaceFilters';
import RecentlyViewed from '@/components/features/marketplace/RecentlyViewed';
import ProductComparison from '@/components/features/marketplace/ProductComparison';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import VirtualizedItem from '@/components/ui/VirtualizedItem';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

// Concurrency-limited prefetching queue
const triggerHaptic = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {
      // Ignored
    }
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'All Produce': return 'grid_view';
    case 'Foodstuff': return 'shopping_bag';
    case 'Grains & Beans': return 'grain';
    case 'Spices & Pepper': return 'spa';
    case 'Oils': return 'opacity';
    case 'Vegetables': return 'eco';
    case 'Fruits': return 'nutrition';
    case 'Meat & Eggs': return 'egg';
    default: return 'agriculture';
  }
};

const getCategoryColors = (category: string, isActive: boolean) => {
  const styles: Record<string, { activeBg: string; activeBorder: string; hoverBg: string; textActive: string; textInactive: string; inactiveBg: string; ringColor: string }> = {
    'All Produce': {
      activeBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-emerald-500/15',
      textActive: 'text-emerald-650 dark:text-emerald-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 dark:border-emerald-500/20',
      ringColor: 'ring-emerald-500/50'
    },
    'Foodstuff': {
      activeBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-amber-500/15',
      textActive: 'text-amber-600 dark:text-amber-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/10 dark:border-amber-500/20',
      ringColor: 'ring-amber-500/50'
    },
    'Grains & Beans': {
      activeBg: 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-yellow-500/15',
      textActive: 'text-yellow-600 dark:text-yellow-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-yellow-500/5 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/10 dark:border-yellow-500/20',
      ringColor: 'ring-yellow-500/50'
    },
    'Spices & Pepper': {
      activeBg: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-red-500/15',
      textActive: 'text-red-650 dark:text-red-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 dark:border-red-500/20',
      ringColor: 'ring-red-500/50'
    },
    'Oils': {
      activeBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-sky-500/15',
      textActive: 'text-sky-650 dark:text-sky-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-sky-500/5 dark:bg-sky-500/10 text-sky-650 dark:text-sky-400 border border-sky-500/10 dark:border-sky-500/20',
      ringColor: 'ring-sky-500/50'
    },
    'Vegetables': {
      activeBg: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-green-500/15',
      textActive: 'text-green-600 dark:text-green-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-green-500/5 dark:bg-green-500/10 text-green-605 dark:text-green-450 border border-green-500/10 dark:border-green-500/20',
      ringColor: 'ring-green-500/50'
    },
    'Fruits': {
      activeBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20 ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-pink-500/15',
      textActive: 'text-pink-600 dark:text-pink-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-pink-500/5 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/10 dark:border-pink-500/20',
      ringColor: 'ring-pink-500/50'
    },
    'Meat & Eggs': {
      activeBg: 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-slate-900',
      activeBorder: 'border-transparent',
      hoverBg: 'hover:bg-orange-500/15',
      textActive: 'text-orange-600 dark:text-orange-400 font-extrabold',
      textInactive: 'text-slate-500 dark:text-slate-400',
      inactiveBg: 'bg-orange-500/5 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10 dark:border-orange-500/20',
      ringColor: 'ring-orange-500/50'
    }
  };

  const defaultTheme = {
    activeBg: 'bg-primary text-white shadow-primary/30 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900',
    activeBorder: 'border-transparent',
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-800',
    textActive: 'text-primary dark:text-green-400 font-extrabold',
    textInactive: 'text-slate-500 dark:text-slate-400',
    inactiveBg: 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400',
    ringColor: 'ring-primary/50'
  };

  return styles[category] || defaultTheme;
};

class PrefetchQueue {
  private queue: string[] = [];
  private activeCount = 0;
  private maxConcurrency = 4;
  private prefetched = new Set<string>();

  enqueue(productId: string, prefetchFn: () => Promise<void>) {
    if (this.prefetched.has(productId)) return;
    this.prefetched.add(productId);

    this.queue.push(productId);
    this.processNext(prefetchFn);
  }

  private async processNext(prefetchFn: () => Promise<void>) {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) return;

    this.activeCount++;
    const nextId = this.queue.shift();
    
    try {
      await prefetchFn();
    } catch (e) {
      console.error('Prefetch queue execution fail:', e);
    } finally {
      this.activeCount--;
      this.processNext(prefetchFn);
    }
  }
}

const prefetchQueue = new PrefetchQueue();

function MarketplaceContent() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { saveToCache } = useOffline();
  const router = useRouter();
  
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortedProducts,
    fetchProducts,
    setAllProducts,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    facetCounts,
    allProducts
  } = useMarketplace();

  // Throttled prefetching implementation
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrefetchProduct = (product: Product) => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchQueue.enqueue(product.id, async () => {
        router.prefetch(`/marketplace/${product.id}`);
        await saveToCache(`product_${product.id}`, product);
      });
    }, 250); // Sustained hover delay: 250ms
  };

  const cancelPrefetchProduct = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = useRef(0);

  // Keeping header steady and always visible on mobile to prevent layout-shifting feedback loops
  useEffect(() => {
    setShowHeader(true);
  }, []);

  // Safe lazy-parsing for user interaction cache
  useEffect(() => {
    try {
      const recentlyViewedIds = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      if (recentlyViewedIds.length > 0) {
        const viewedProducts = recentlyViewedIds
          .map((id: string) => allProducts.find(p => p.id === id))
          .filter((p: Product | undefined): p is Product => p !== undefined);
        setRecentlyViewed(viewedProducts);
      }
    } catch (e) {
      console.error('LocalStorage recently_viewed parse failed lazily:', e);
    }
  }, [allProducts]);

  const tourSteps: Step[] = [
    { 
      target: '#marketplace-header', 
      content: 'Welcome to KamerFresh! Discover fresh and verified organic produce directly from local Cameroonian farms.', 
      placement: 'bottom' 
    },
    { 
      target: '#search-input', 
      content: 'Quick Search: Instantly search for specific products, regional farms, and items by typing keywords like name or category.', 
      placement: 'bottom' 
    },
    { 
      target: '#crop-doctor-nav', 
      content: 'AI Crop Doctor: Having issues with your crops? Snap and upload a leaf photo to diagnose crop disease instantly and get treatment advice.', 
      placement: 'right' 
    },
    { 
      target: '#profile-nav', 
      content: 'Your Profile: Seamlessly manage your account, switch between buyer/farmer modes, update listings, and track active orders.', 
      placement: 'right' 
    }
  ];

  useEffect(() => {
    if (!localStorage.getItem('hasSeenMarketplaceTour')) setRunTour(true);
  }, []);

  const handleTourCallback = (data: any) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenMarketplaceTour', 'true');
    }
  };

  const generateAIImage = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setGeneratingId(productId);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName })
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Failed to generate image' };
        }
        throw new Error(errorData.friendlyMessage || errorData.error || 'Failed to generate image');
      }
      const { image } = await response.json();
      if (image) {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: image } : p));
        toast.success(`AI image generated for ${productName}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate AI image');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!user) return;
    try {
      await supabaseService.createProduct({
        ...productData,
        farmer_id: user.id,
        is_verified: true,
        created_at: new Date().toISOString()
      });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
      throw error;
    }
  };

  // Prevetting animation parameters under prefers-reduced-motion check
  const springTransition = { 
    type: 'spring' as const, 
    damping: 30, 
    stiffness: 120 
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springTransition
    }
  };

  // Determine active filters
  const hasActiveFilters = 
    filters.origin !== 'All' || 
    filters.healthStatus !== 'All' || 
    filters.season !== 'All' || 
    filters.certification.length > 0;

  return (
    <div className="space-y-4 sm:space-y-8">
      <Joyride
        {...({
          run: runTour,
          steps: tourSteps,
          continuous: true,
          showProgress: true,
          showSkipButton: true,
          callback: handleTourCallback,
          styles: { 
            options: { 
              primaryColor: '#10b981', 
              zIndex: 1000 
            } 
          }
        } as any)}
      />
      
      <div 
        className="flex flex-col gap-2 border-b border-slate-100 dark:border-white/5 pb-3"
      >
        <MarketplaceHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddProduct={() => setIsAddModalOpen(true)}
          showAddButton={user?.user_type === 'farmer'}
          onShowFilters={() => setShowFilters(true)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          t={t}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-slate-100/40 dark:border-white/5 pt-1">
          <div id="marketplace-category-tabs" className="flex gap-1.5 sm:gap-2.5 overflow-x-auto py-0.5 no-scrollbar justify-start items-center flex-1">
            {['All Produce', 'Foodstuff', 'Grains & Beans', 'Spices & Pepper', 'Oils', 'Vegetables', 'Fruits', 'Meat & Eggs'].map((cat) => {
              const count = cat === 'All Produce' 
                ? totalCount 
                : (facetCounts?.category[cat] || 0);
              const isSelected = filters.category === cat;
              const theme = getCategoryColors(cat, isSelected);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    triggerHaptic();
                    setFilters({ ...filters, category: cat });
                  }}
                  className="flex flex-row items-center gap-1 shrink-0 transition-all group focus:outline-none"
                >
                  <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-350 ${
                    isSelected
                      ? `${theme.activeBg} ${theme.activeBorder} shadow-md scale-105`
                      : `${theme.inactiveBg} ${theme.hoverBg} hover:scale-105`
                  }`}>
                    <span className="material-symbols-outlined text-[15px] sm:text-[17px] transition-transform duration-300 group-hover:scale-110">{getCategoryIcon(cat)}</span>
                    <span className={`absolute -top-1 -right-1 text-[7px] sm:text-[8px] font-mono font-bold rounded-full px-1 py-0.1 sm:px-1.5 sm:py-0.5 border ${
                      isSelected
                        ? 'bg-white text-slate-800 border-slate-200'
                        : 'bg-slate-150 dark:bg-slate-750 text-slate-600 dark:text-slate-350 border-transparent'
                    }`}>
                      {count}
                    </span>
                  </div>
                  
                  {/* Keep icons for small devices, full words for big screens */}
                  <span className={`hidden sm:block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center max-w-[125px] transition-colors ${
                    isSelected ? theme.textActive : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}>
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-100/30 dark:border-white/5 pt-1 sm:pt-0">
            <button 
              id="marketplace-filters-btn"
              onClick={() => {
                triggerHaptic();
                setShowFilters(true);
              }}
              aria-label="Filter products popup trigger"
              className="h-7 px-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[13px]">tune</span>
              {t('filters')}
            </button>
            
            <div className="flex items-center gap-1.5">
              {selectedProducts.length > 0 && (
                <button 
                  onClick={() => {
                    triggerHaptic();
                    setShowComparison(true);
                  }}
                  aria-label="Open comparative products panel"
                  className="h-7 px-2.5 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse"
                >
                  <span className="material-symbols-outlined text-[13px]">compare_arrows</span>
                  Compare({selectedProducts.length})
                </button>
              )}

              <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg font-bold border border-slate-150 dark:border-white/5">
                 <button 
                   onClick={() => {
                     triggerHaptic();
                     setViewMode('grid');
                   }} 
                   aria-label="Set grid layout"
                   className={`w-6 h-6 flex items-center justify-center rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
                 >
                   <span className="material-symbols-outlined text-[15px]">grid_view</span>
                 </button>
                 <button 
                   onClick={() => {
                     triggerHaptic();
                     setViewMode('list');
                   }} 
                   aria-label="Set list layout"
                   className={`w-6 h-6 flex items-center justify-center rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
                 >
                   <span className="material-symbols-outlined text-[15px]">view_list</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mr-1">Active:</span>
          {filters.origin !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
              <span>{filters.origin}</span>
              <button onClick={() => setFilters({ ...filters, origin: 'All' })} aria-label="Clear region filter" className="material-symbols-outlined text-[12px] font-bold">close</button>
            </span>
          )}
          {filters.healthStatus !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
              <span>Health: {filters.healthStatus}</span>
              <button onClick={() => setFilters({ ...filters, healthStatus: 'All' })} aria-label="Clear health status filter" className="material-symbols-outlined text-[12px] font-bold">close</button>
            </span>
          )}
          {filters.season !== 'All' && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
              <span>Season: {filters.season}</span>
              <button onClick={() => setFilters({ ...filters, season: 'All' })} aria-label="Clear harvest season filter" className="material-symbols-outlined text-[12px] font-bold">close</button>
            </span>
          )}
          {filters.certification.map(cert => (
            <span key={cert} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">
              <span>{cert}</span>
              <button onClick={() => setFilters({ ...filters, certification: filters.certification.filter(c => c !== cert) })} aria-label={`Clear ${cert} filter`} className="material-symbols-outlined text-[12px] font-bold">close</button>
            </span>
          ))}
          <button 
            onClick={() => setFilters({
              category: filters.category,
              origin: 'All',
              certification: [],
              season: 'All',
              healthStatus: 'All',
            })}
            className="text-[9px] font-black uppercase text-red-500 hover:underline tracking-widest ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="hidden sm:block">
        <RecentlyViewed 
          products={recentlyViewed} 
          onClear={() => { localStorage.removeItem('recently_viewed'); setRecentlyViewed([]); }} 
          t={t} 
        />
      </div>

      <MarketplaceFilters 
        filters={filters} 
        setFilters={setFilters} 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        t={t} 
        facetCounts={facetCounts}
      />

      <motion.div 
        variants={containerVariants} 
        initial="hidden"
        animate="visible"
        className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-8" : "flex flex-col gap-4"}
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse ${viewMode === 'grid' ? 'h-[320px] sm:h-[450px]' : 'h-32'}`} />
          ))
        ) : sortedProducts.length > 0 ? (
          sortedProducts.map((product, index) => (
            <motion.div key={product.id} variants={itemVariants} className={index === 0 ? 'product-card-first' : ''}>
              <VirtualizedItem id={product.id} estimatedHeight={viewMode === 'grid' ? 380 : 120}>
                {viewMode === 'grid' ? (
                  <div 
                    className="relative h-full" 
                    onMouseEnter={() => handlePrefetchProduct(product)}
                    onMouseLeave={cancelPrefetchProduct}
                  >
                    <Link
                      href={`/marketplace/${product.id}`}
                      className="block h-full cursor-pointer"
                    >
                      <ProductCard 
                        product={product} 
                      >
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-row sm:flex-col gap-1.5 z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <button 
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              triggerHaptic();
                              setSelectedProducts(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]);
                            }}
                            aria-label={`Select ${product.name} to compare`}
                            className={`w-8 h-8 sm:w-10 sm:h-10 backdrop-blur rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center transition-all ${selectedProducts.includes(product.id) ? 'bg-indigo-600 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-indigo-600'}`}
                          >
                            <span className="material-symbols-outlined text-[18px] sm:text-[24px]">{selectedProducts.includes(product.id) ? 'check_circle' : 'add_circle'}</span>
                          </button>
                          {(!product.image_url || product.image_url.includes('picsum.photos')) && (
                            <button 
                              onClick={(e) => {
                                triggerHaptic();
                                generateAIImage(e, product.id, product.name);
                              }}
                              disabled={generatingId === product.id}
                              aria-label={`Generate AI image representation for ${product.name}`}
                              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-slate-900/90 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center text-primary disabled:opacity-50"
                            >
                              {generatingId === product.id ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[16px] sm:text-[18px]">auto_awesome</span>}
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerHaptic(); addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                            aria-label={`Add ${product.name} to checkout cart`}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center sm:hidden active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          </button>
                        </div>
                        <div className="absolute inset-x-4 bottom-4 hidden sm:block translate-y-12 group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                            aria-label={`Add ${product.name} to checkout cart`}
                            className="w-full bg-primary text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-95 active:scale-98 transition-transform"
                          >
                            <span className="material-symbols-outlined text-sm">shopping_cart</span>
                            {t('add_to_cart')}
                          </button>
                        </div>
                      </ProductCard>
                    </Link>
                  </div>
                ) : (
                  <Link 
                    href={`/marketplace/${product.id}`} 
                    onMouseEnter={() => handlePrefetchProduct(product)}
                    onMouseLeave={cancelPrefetchProduct}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                      <ResponsiveImage src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" baseWidth={200} baseHeight={200} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm dark:text-white uppercase tracking-tight">{product.name}</h4>
                          <span className="text-xs font-black text-primary">{product.price.toLocaleString()} FCFA</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md">{product.location}</span>
                         <button 
                           onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                           aria-label={`Add ${product.name} to checkout cart`}
                           className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                         >
                           <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                         </button>
                      </div>
                    </div>
                  </Link>
                )}
              </VirtualizedItem>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
            <p className="text-slate-500 font-bold">No products found matching your filters.</p>
          </div>
        )}
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Show</span>
            <select 
              value={pageSize} 
              aria-label="Items per page selector"
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1 text-xs font-black text-slate-950 dark:text-white"
            >
              {[8, 12, 16, 24, 32].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <span>of {totalCount} items</span>
          </div>

          <div className="flex items-center gap-1 select-none">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              aria-label="Previous marketplace page"
              className="w-10 h-10 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-white/5 rounded-xl disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xs font-black">arrow_back_ios</span>
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const activePage = i + 1;
              return (
                <button
                  key={activePage}
                  onClick={() => setPage(activePage)}
                  aria-label={`Marketplace page ${activePage}`}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === activePage ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5'}`}
                >
                  {activePage}
                </button>
              );
            })}

            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              aria-label="Next marketplace page"
              className="w-10 h-10 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-white/5 rounded-xl disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xs font-black">arrow_forward_ios</span>
            </button>
          </div>
        </div>
      )}

      {showComparison && (
        <ProductComparison 
          products={sortedProducts.filter(p => selectedProducts.includes(p.id))} 
          onClose={() => setShowComparison(false)} 
          onClear={() => setSelectedProducts([])} 
          t={t} 
        />
      )}

      {user && <ProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveProduct} farmerId={user.id} />}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center bg-background-light dark:bg-background-dark min-h-screen">Loading marketplace...</div>}>
        <MarketplaceContent />
      </Suspense>
    </ProtectedRoute>
  );
}
