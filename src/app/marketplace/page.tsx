'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { Joyride, Step, STATUS } from 'react-joyride';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { INITIAL_PRODUCTS } from '@/constants';
import { useOffline } from '@/context/OfflineContext';
import { useCart } from '@/context/CartContext';
import { supabaseService } from '@/services/supabaseService';
import { Product } from '@/types';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import ProductModal from '@/components/features/marketplace/ProductModal';
import ProductCard from '@/components/features/marketplace/ProductCard';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';

type SortOption = 'name-asc' | 'price-low' | 'price-high';

interface FilterState {
  category: string;
  origin: string;
  certification: string[];
  season: string;
}

function MarketplaceContent() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { isOnline, saveToCache, getFromCache } = useOffline();
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const productsRef = useRef<Product[]>(allProducts);
  useEffect(() => { productsRef.current = allProducts; }, [allProducts]);

  const fetchProducts = useCallback(async () => {
    // 1. Try to load from cache immediately for instant UI
    const cachedProducts = await getFromCache('marketplace_products');
    if (cachedProducts) {
      setAllProducts(cachedProducts);
      setLoading(false); // Stop showing skeleton if we have cache
    } else {
      setLoading(true);
    }

    try {
      if (isOnline) {
        // 2. Fetch fresh data regardless of cache (SWR pattern)
        const data = await supabaseService.getProducts();
        if (data && data.length > 0) {
          const mappedProducts: Product[] = data.map((p: any) => ({
            id: p.id,
            farmer_id: p.farmer_id,
            name: p.name,
            price: p.price,
            unit: p.unit,
            location: p.location || 'Unknown',
            image_url: p.image_url || 'https://picsum.photos/seed/product/400/300',
            is_verified: p.is_verified,
            health_status: p.health_status || 'N/A',
            certifications: p.certifications || [],
            harvest_season: p.harvest_season || 'Year round',
            category: p.category,
            description: p.description || '',
            stock_quantity: p.stock_quantity || 0,
            created_at: p.created_at,
            profiles: p.profiles
          }));
          setAllProducts(mappedProducts);
          saveToCache('marketplace_products', mappedProducts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products from Supabase:', error);
      // If we already set products from cache, we're fine
      if (!productsRef.current.length || productsRef.current === INITIAL_PRODUCTS) {
        setAllProducts(INITIAL_PRODUCTS);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, getFromCache, saveToCache]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: 'All Produce',
    origin: 'All',
    certification: [],
    season: 'All',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [collapsedFilters, setCollapsedFilters] = useState<string[]>([]);
  const [runTour, setRunTour] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    const recentlyViewedIds = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    if (recentlyViewedIds.length > 0) {
      const viewedProducts = recentlyViewedIds
        .map((id: string) => allProducts.find(p => p.id === id))
        .filter((p: Product | undefined): p is Product => p !== undefined);
      setRecentlyViewed(viewedProducts);
    }
  }, [allProducts]);

  const tourSteps: Step[] = [
    {
      target: '#marketplace-header',
      content: t('marketplace_explorer_desc'),
      placement: 'bottom',
    },
    {
      target: '#marketplace-filters-btn',
      content: t('filters'),
      placement: 'bottom',
    },
    {
      target: '#marketplace-sort-btn',
      content: t('sort'),
      placement: 'bottom',
    },
    {
      target: '#marketplace-category-tabs',
      content: t('marketplace_overview'),
      placement: 'bottom',
    },
    {
      target: '.product-card-first',
      content: t('details'),
      placement: 'top',
    },
    {
      target: '.compare-btn-first',
      content: t('compare'),
      placement: 'top',
    }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenMarketplaceTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
      localStorage.setItem('hasSeenMarketplaceTour', 'true');
    }
  };

  const toggleFilterCollapse = (category: string) => {
    setCollapsedFilters(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleProductSelection = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const { image } = await response.json();
      
      if (image) {
        setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: image } : p));
        toast.success(`AI image generated for ${productName}`);
      }
    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast.error(error.message || 'Failed to generate AI image');
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredProducts = allProducts.filter(p => {
    if (filters.category !== 'All Produce' && p.category !== filters.category) return false;
    if (filters.origin !== 'All' && p.location !== filters.origin) return false;
    if (filters.season !== 'All' && p.harvest_season !== filters.season) return false;
    if (filters.certification.length > 0 && !filters.certification.every(c => p.certifications.includes(c))) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(searchLower) || (p.description || '').toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });

  const toggleCertification = (cert: string) => {
    setFilters(prev => ({
      ...prev,
      certification: prev.certification.includes(cert)
        ? prev.certification.filter(c => c !== cert)
        : [...prev.certification, cert]
    }));
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!user) return;
    try {
      await supabaseService.createProduct({
        ...productData,
        farmer_id: user.id,
        is_verified: true, // Auto-verify for now
        created_at: new Date().toISOString()
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 sm:space-y-8"
    >
      <Joyride
        {...({
          steps: tourSteps,
          run: runTour,
          continuous: true,
          showProgress: true,
          showSkipButton: true,
          callback: handleTourCallback,
          styles: {
            options: {
              primaryColor: '#10b981',
              zIndex: 1000,
            },
          }
        } as any)}
      />
      
      {/* Search Header - Sticky on Mobile */}
      <motion.div 
        variants={itemVariants} 
        id="marketplace-header" 
        className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl -mx-4 px-4 py-4 border-b border-slate-100 dark:border-white/5 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:block">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">{t('marketplace_explorer')}</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{t('marketplace_explorer_desc')}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {user?.user_type === 'farmer' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 sm:w-auto"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="truncate">{t('sell_produce')}</span>
              </button>
            )}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder={t('search_products_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-muted-dark border border-slate-200 dark:border-border-dark rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all transition-colors"
              />
            </div>
            {/* Mobile Tour/Quick Action Button */}
            <div className="flex gap-2 sm:hidden">
               <button 
                onClick={() => setShowFilters(true)}
                className="flex-1 bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                {t('filters')}
              </button>
              <div className="relative flex-1">
                <button className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">sort</span>
                  Sort
                </button>
                <select 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="name-asc">A-Z</option>
                  <option value="price-low">Price: Low-High</option>
                  <option value="price-high">Price: High-Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 transition-all overflow-hidden"
        >
          <div className="space-y-4">
            <button 
              onClick={() => toggleFilterCollapse('origin')}
              className="flex items-center justify-between w-full text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
            >
              {t('origin')}
              <span className={`material-symbols-outlined text-[18px] transition-transform ${collapsedFilters.includes('origin') ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {!collapsedFilters.includes('origin') && (
              <div className="flex flex-wrap gap-2">
                {['All', 'Littoral', 'South West', 'West', 'North West', 'Centre'].map(country => (
                  <button
                    key={country}
                    onClick={() => setFilters({ ...filters, origin: country })}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.origin === country ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-muted-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-hover-dark'}`}
                  >
                    {country === 'All' ? t('all') : country}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => toggleFilterCollapse('certifications')}
              className="flex items-center justify-between w-full text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
            >
              {t('certifications')}
              <span className={`material-symbols-outlined text-[18px] transition-transform ${collapsedFilters.includes('certifications') ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {!collapsedFilters.includes('certifications') && (
              <div className="flex flex-wrap gap-2">
                {['Organic', 'Fair Trade', 'G-GAP'].map(cert => (
                  <button
                    key={cert}
                    onClick={() => toggleCertification(cert)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.certification.includes(cert) ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => toggleFilterCollapse('season')}
              className="flex items-center justify-between w-full text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
            >
              {t('harvest_season')}
              <span className={`material-symbols-outlined text-[18px] transition-transform ${collapsedFilters.includes('season') ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {!collapsedFilters.includes('season') && (
              <div className="flex flex-wrap gap-2">
                {['All', 'Raining', 'Dry', 'Year round'].map(season => (
                  <button
                    key={season}
                    onClick={() => setFilters({ ...filters, season: season })}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.season === season ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {season === 'All' ? t('all') : season}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {recentlyViewed.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('recently_viewed')}</h3>
            <button 
              onClick={() => {
                localStorage.removeItem('recently_viewed');
                setRecentlyViewed([]);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
            >
              {t('clear')}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {recentlyViewed.map((p) => (
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
                <p className="text-[10px] font-black text-primary">{p.price.toLocaleString()} CFA/{p.unit}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} id="marketplace-category-tabs" className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sticky top-[64px] sm:top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl py-3 border-b border-white/5 lg:relative lg:top-0 lg:py-0 lg:border-none lg:bg-transparent">
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
      </motion.div>

      <div className="hidden sm:flex items-center justify-between gap-4 py-1 -mx-4 px-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button 
            id="marketplace-filters-btn"
            onClick={() => setShowFilters(true)}
            className="h-8 px-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            {t('filters')}
          </button>
          
          <div className="relative group shrink-0">
            <button className="h-8 px-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 dark:text-white">
              <span className="material-symbols-outlined text-[16px]">sort</span>
              {sortBy === 'name-asc' ? 'A-Z' : 'Price'}
            </button>
            <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1.5">
              <button 
                onClick={() => setSortBy('name-asc')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${sortBy === 'name-asc' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'}`}
              >
                Alphabetical
              </button>
              <button 
                onClick={() => setSortBy('price-low')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${sortBy === 'price-low' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'}`}
              >
                Price: Low to High
              </button>
              <button 
                onClick={() => setSortBy('price-high')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${sortBy === 'price-high' ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'}`}
              >
                Price: High to Low
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <button 
              onClick={() => setShowComparison(true)}
              className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-lg shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
              Compare({selectedProducts.length})
            </button>
          )}

          <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg">
             <button 
               onClick={() => setViewMode('grid')}
               className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
             >
               <span className="material-symbols-outlined text-[18px]">grid_view</span>
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}
             >
               <span className="material-symbols-outlined text-[18px]">view_list</span>
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
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
                  <button onClick={() => setShowFilters(false)} className="text-slate-400">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Origin Region</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Littoral', 'South West', 'West', 'North West', 'Centre'].map(country => (
                      <button
                        key={country}
                        onClick={() => setFilters({ ...filters, origin: country })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filters.origin === country ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 dark:text-slate-400'}`}
                      >
                        {country}
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

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 transition-transform active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8" : "flex flex-col gap-4"}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={itemVariants} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-pulse ${viewMode === 'grid' ? 'h-[400px]' : 'h-32'}`} />
          ))
        ) : sortedProducts.length > 0 ? (
          sortedProducts.map((product, index) => (
            <motion.div 
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className={`${index === 0 ? 'product-card-first' : ''} ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4' : ''}`}
            >
              <Link href={`/marketplace/${product.id}`} className={viewMode === 'list' ? 'flex flex-row w-full gap-4' : ''}>
                {viewMode === 'list' && (
                   <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                      <ResponsiveImage 
                        src={product.image_url || 'https://picsum.photos/seed/product/200/200'} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        baseWidth={200}
                        baseHeight={200}
                      />
                   </div>
                )}
                {viewMode === 'grid' ? (
                  <ProductCard product={product}>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => toggleProductSelection(e, product.id)}
                        className={`w-10 h-10 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transition-all ${index === 0 ? 'compare-btn-first' : ''} ${selectedProducts.includes(product.id) ? 'bg-indigo-600 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-indigo-600'}`}
                        title="Select for comparison"
                      >
                        <span className="material-symbols-outlined">{selectedProducts.includes(product.id) ? 'check_circle' : 'add_circle'}</span>
                      </button>
                      
                      {(!product.image_url || product.image_url.includes('picsum.photos')) && (
                        <button 
                          onClick={(e) => generateAIImage(e, product.id, product.name)}
                          disabled={generatingId === product.id}
                          className={`h-10 px-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${index === 0 ? 'ai-image-btn-first' : ''}`}
                          title="Generate AI Image"
                        >
                          {generatingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">AI Image</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="absolute inset-x-4 bottom-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product, 1);
                          toast.success(`${product.name} added to cart`, {
                            action: {
                              label: 'View Cart',
                              onClick: () => window.location.href = '/cart'
                            }
                          });
                        }}
                        className="w-full bg-primary text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        {t('add_to_cart')}
                      </button>
                    </div>
                  </ProductCard>
                ) : (
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center justify-between">
                         <h4 className="font-black text-sm dark:text-white truncate">{product.name}</h4>
                         <span className="text-[9px] font-black uppercase tracking-widest text-primary">{product.price.toLocaleString()} CFA</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md">
                         <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                         <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{product.location}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product, 1);
                          toast.success(`${product.name} added to cart`);
                        }}
                        className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          ))
        ) : (
          <motion.div variants={itemVariants} className="col-span-full text-center py-20">
            <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400 font-bold">No products found matching your filters.</p>
          </motion.div>
        )}
      </motion.div>
      
      {showComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black dark:text-white">{t('product_comparison')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Comparing {selectedProducts.length} {t('items')} side-by-side</p>
              </div>
              <button 
                onClick={() => setShowComparison(false)}
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
                    {allProducts.filter(p => selectedProducts.includes(p.id)).map(p => (
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
                    { label: t('price'), key: 'price', format: (v: any, p: any) => `${v.toLocaleString()} CFA/${p.unit}` },
                    { label: t('location'), key: 'location' },
                    { label: t('health_status'), key: 'health_status' },
                    { label: t('certifications'), key: 'certifications', format: (v: any) => v.length > 0 ? v.join(', ') : 'None' },
                    { label: t('harvest_season'), key: 'harvest_season' },
                    { label: t('marketplace_title'), key: 'category' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-500 dark:text-slate-400">{row.label}</td>
                      {allProducts.filter(p => selectedProducts.includes(p.id)).map(p => (
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
                onClick={() => setSelectedProducts([])}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                {t('clear')}
              </button>
              <button 
                onClick={() => setShowComparison(false)}
                className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                {t('close_menu')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {user && (
        <ProductModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleSaveProduct}
          farmerId={user.id}
        />
      )}
    </motion.div>
  );
}

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-center">Loading marketplace...</div>}>
        <MarketplaceContent />
      </Suspense>
    </ProtectedRoute>
  );
}
