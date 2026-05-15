'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'motion/react';
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

// Sub-components
import MarketplaceHeader from '@/components/features/marketplace/MarketplaceHeader';
import MarketplaceFilters from '@/components/features/marketplace/MarketplaceFilters';
import RecentlyViewed from '@/components/features/marketplace/RecentlyViewed';
import ProductComparison from '@/components/features/marketplace/ProductComparison';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import Link from 'next/link';

function MarketplaceContent() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  
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
    setAllProducts
  } = useMarketplace();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    const recentlyViewedIds = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    if (recentlyViewedIds.length > 0) {
      const viewedProducts = recentlyViewedIds
        .map((id: string) => sortedProducts.find(p => p.id === id))
        .filter((p: Product | undefined): p is Product => p !== undefined);
      setRecentlyViewed(viewedProducts);
    }
  }, [sortedProducts]);

  const tourSteps: Step[] = [
    { target: '#marketplace-header', content: t('marketplace_explorer_desc'), placement: 'bottom' },
    { target: '#marketplace-filters-btn', content: t('filters'), placement: 'bottom' },
    { target: '#marketplace-sort-btn', content: t('sort'), placement: 'bottom' },
    { target: '#marketplace-category-tabs', content: t('marketplace_overview'), placement: 'bottom' },
    { target: '.product-card-first', content: t('details'), placement: 'top' },
    { target: '.compare-btn-first', content: t('compare'), placement: 'top' }
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
      if (!response.ok) throw new Error('Failed to generate image');
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring' as const, 
        damping: 25, 
        stiffness: 100 
      }
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-8">
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

      <RecentlyViewed 
        products={recentlyViewed} 
        onClear={() => { localStorage.removeItem('recently_viewed'); setRecentlyViewed([]); }} 
        t={t} 
      />

      <div id="marketplace-category-tabs" className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-4 -mx-4">
        {['All Produce', 'Foodstuff', 'Grains & Beans', 'Spices & Pepper', 'Oils', 'Vegetables', 'Fruits', 'Meat & Eggs'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilters({ ...filters, category: cat })}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 ${
              filters.category === cat 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 py-1">
        <button 
          id="marketplace-filters-btn"
          onClick={() => setShowFilters(true)}
          className="h-8 px-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          {t('filters')}
        </button>
        
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <button 
              onClick={() => setShowComparison(true)}
              className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-lg"
            >
              <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
              Compare({selectedProducts.length})
            </button>
          )}

          <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg">
             <button onClick={() => setViewMode('grid')} className={`w-7 h-7 flex items-center justify-center rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}>
               <span className="material-symbols-outlined text-[18px]">grid_view</span>
             </button>
             <button onClick={() => setViewMode('list')} className={`w-7 h-7 flex items-center justify-center rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}>
               <span className="material-symbols-outlined text-[18px]">view_list</span>
             </button>
          </div>
        </div>
      </div>

      <MarketplaceFilters 
        filters={filters} 
        setFilters={setFilters} 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        t={t} 
      />

      <motion.div variants={containerVariants} className={viewMode === 'grid' ? "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "flex flex-col gap-4"}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse ${viewMode === 'grid' ? 'h-[400px]' : 'h-32'}`} />
          ))
        ) : sortedProducts.length > 0 ? (
          sortedProducts.map((product, index) => (
            <motion.div key={product.id} variants={itemVariants} className={index === 0 ? 'product-card-first' : ''}>
              {viewMode === 'grid' ? (
                <ProductCard product={product}>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setSelectedProducts(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]);
                      }}
                      className={`w-10 h-10 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transition-all ${selectedProducts.includes(product.id) ? 'bg-indigo-600 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-indigo-600'}`}
                    >
                      <span className="material-symbols-outlined">{selectedProducts.includes(product.id) ? 'check_circle' : 'add_circle'}</span>
                    </button>
                    {(!product.image_url || product.image_url.includes('picsum.photos')) && (
                      <button 
                        onClick={(e) => generateAIImage(e, product.id, product.name)}
                        disabled={generatingId === product.id}
                        className="h-10 px-3 bg-white/90 dark:bg-slate-900/90 rounded-xl shadow-lg flex items-center justify-center text-primary disabled:opacity-50"
                      >
                        {generatingId === product.id ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                      </button>
                    )}
                  </div>
                  <div className="absolute inset-x-4 bottom-4 translate-y-12 sm:group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                      className="w-full bg-primary text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      {t('add_to_cart')}
                    </button>
                  </div>
                </ProductCard>
              ) : (
                <Link href={`/marketplace/${product.id}`} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <ResponsiveImage src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover" baseWidth={200} baseHeight={200} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-sm dark:text-white uppercase tracking-tight">{product.name}</h4>
                        <span className="text-xs font-black text-primary">{product.price.toLocaleString()} CFA</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md">{product.location}</span>
                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, 1); toast.success(`${product.name} added to cart`); }}
                         className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center"
                       >
                         <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                       </button>
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
            <p className="text-slate-500 font-bold">No products found matching your filters.</p>
          </div>
        )}
      </motion.div>

      {showComparison && (
        <ProductComparison 
          products={sortedProducts.filter(p => selectedProducts.includes(p.id))} 
          onClose={() => setShowComparison(false)} 
          onClear={() => setSelectedProducts([])} 
          t={t} 
        />
      )}

      {user && <ProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveProduct} farmerId={user.id} />}
    </motion.div>
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
