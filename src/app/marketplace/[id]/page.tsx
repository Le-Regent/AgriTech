'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { INITIAL_PRODUCTS } from '@/constants';
import { useCart } from '@/context/CartContext';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import { Product, ProductReview } from '@/types';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import NFCVerificationModal from '@/components/features/marketplace/NFCVerificationModal';
import { toast } from 'sonner';
import { convertQuantity, getAvailableUnits, Unit, formatUnit } from '@/lib/unitUtils';

function ProductDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const { addToCart } = useCart();
  const { user } = useUser();
  const { isOnline, saveToCache, getFromCache, addToSyncQueue } = useOffline();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      // 1. Try to load from cache IMMEDIATELY to avoid ANY layout shift or UI block
      let cachedData = await getFromCache(`product_${id}`);
      
      if (!cachedData) {
        // Fallback: look in the main list cache
        const allCachedProducts = await getFromCache('marketplace_products');
        if (allCachedProducts && Array.isArray(allCachedProducts)) {
          cachedData = allCachedProducts.find((p: any) => p.id === id);
        }
      }

      if (cachedData) {
        setProduct(cachedData as Product);
        setSelectedUnit(cachedData.unit);
        setQuantity(cachedData.min_quantity || 1);
        setLoading(false); // Make it INSTANTLY visible! 0ms!
      } else {
        setLoading(true); // only show loading if we have absolutely nothing in cache
      }

      // 2. Regardless of cache, fetch the absolute latest version from Supabase to "revalidate"
      try {
        if (isOnline) {
          const data = await supabaseService.getProductById(id);
          if (data) {
            const prod = data as Product;
            setProduct(prod);
            setSelectedUnit(prev => prev || prod.unit);
            setQuantity(prev => {
              if (!cachedData) return prod.min_quantity || 1;
              return prev;
            });
            saveToCache(`product_${id}`, data);
          }
        }
      } catch (error) {
        console.error('Failed to update product details from service:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isOnline, saveToCache, getFromCache]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setLoadingReviews(true);
      try {
        const data = await supabaseService.getProductReviews(id);
        setReviews(data || []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product) return;
      try {
        const products = await supabaseService.getProducts();
        const filtered = products
          .filter(p => (p.category === product.category || p.profiles?.full_name === product.profiles?.full_name) && p.id !== product.id)
          .slice(0, 3);
        setRelatedProducts(filtered);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  useEffect(() => {
    if (id && product) {
      const recentlyViewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const updated = [id, ...recentlyViewed.filter((itemId: string) => itemId !== id)].slice(0, 10);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
    }
  }, [id, product]);

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isNFCOpen, setIsNFCOpen] = useState(false);

  const ratingStats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { avg: '0.0', total: 0, counts: [0, 0, 0, 0, 0] };
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const idx = Math.max(0, Math.min(4, r.rating - 1));
      counts[idx]++;
    });
    return { avg: avg.toFixed(1), total, counts: counts.reverse() };
  }, [reviews]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-6">
        <h2 className="text-3xl font-black dark:text-white">Product Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400">The product you are looking for does not exist or has been removed.</p>
        <Link href="/marketplace" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock_quantity <= 0) {
      toast.error('This product is currently out of stock');
      return;
    }

    // Validate quantity against stock
    // We need to convert quantity back to base unit to compare with stock
    const qtyInBaseUnit = convertQuantity(quantity, selectedUnit, product.unit);
    if (qtyInBaseUnit > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} ${product.unit} available in stock`);
      return;
    }

    // Validate quantity range
    if (product.min_quantity && quantity < product.min_quantity) {
      toast.error(`Minimum order quantity is ${product.min_quantity} ${selectedUnit}`);
      return;
    }
    if (product.max_quantity && quantity > product.max_quantity) {
      toast.error(`Maximum order quantity is ${product.max_quantity} ${selectedUnit}`);
      return;
    }

    addToCart(product, quantity, selectedUnit, pricePerSelectedUnit);
    toast.success(`${product.name} added to cart`, {
      description: `Quantity: ${quantity} ${selectedUnit}`,
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart'
      }
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim() || !user) return;
    
    setSubmittingReview(true);
    const reviewData: Partial<ProductReview> = {
      product_id: id,
      reviewer_id: user.id,
      rating: newReview.rating,
      comment: newReview.comment,
    };
    
    try {
      if (isOnline) {
        await supabaseService.createReview(reviewData);
        // Refresh reviews
        const data = await supabaseService.getProductReviews(id);
        setReviews(data || []);
        toast.success('Review submitted successfully!');
      } else {
        addToSyncQueue('ADD_REVIEW', { productId: id, review: reviewData });
        // Optimistic update
        const optimisticReview = {
          ...reviewData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          profiles: {
            full_name: user.full_name,
            avatar_url: user.avatar_url
          }
        };
        setReviews([optimisticReview, ...reviews]);
        toast.info('Review queued for sync (offline)');
      }
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const availableUnits = product ? getAvailableUnits(product.unit) : [];

  // Calculate price based on selected unit
  const pricePerSelectedUnit = product ? product.price * convertQuantity(1, selectedUnit, product.unit) : 0;
  const totalPrice = pricePerSelectedUnit * quantity;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/marketplace" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-bold">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Marketplace
        </Link>
        <div className="flex gap-3 relative">
          <button className="w-10 h-10 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4 sm:space-y-6">
          <div className="aspect-square bg-white dark:bg-surface-dark rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-slate-100 dark:border-border-dark shadow-sm relative transition-colors">
            <ResponsiveImage 
              src={product.image_url || 'https://picsum.photos/seed/product/1000/1000'} 
              alt={`Detailed view of ${product.name}`} 
              className="w-full h-full object-cover"
              baseWidth={1000}
              baseHeight={1000}
            />
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex flex-col gap-2 sm:gap-3">
              {product.is_verified && (
                <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-primary fill-1 text-sm sm:text-base">verified</span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest dark:text-white">Health Verified</span>
                </div>
              )}
              {product.health_status !== 'N/A' && (
                <div className="bg-primary/90 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined fill-1 text-sm sm:text-base">eco</span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{product.health_status} Grade</span>
                </div>
              )}
            </div>
            <div className="absolute bottom-6 right-6">
                <button 
                  onClick={() => setIsNFCOpen(true)}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all group"
                  title="Verify Authenticity"
                >
                    <span className="material-symbols-outlined text-3xl group-hover:animate-pulse">nfc</span>
                </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white dark:bg-surface-dark rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 dark:border-border-dark cursor-pointer hover:border-primary transition-colors">
                <ResponsiveImage 
                  src={`https://picsum.photos/seed/${product.id}-${i}/200/200`} 
                  alt={`Thumbnail view ${i} of ${product.name}`} 
                  className="w-full h-full object-cover" 
                  baseWidth={200}
                  baseHeight={200}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">storefront</span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{product.profiles?.full_name || 'Unknown Farmer'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight dark:text-white">{product.name}</h2>
            <div className="flex items-center gap-3">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">{pricePerSelectedUnit.toLocaleString()} <span className="text-sm sm:text-base lg:text-lg text-slate-400 font-bold">CFA / {selectedUnit}</span></p>
              <div className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${
                product.stock_quantity > 0 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {product.stock_quantity > 0 ? `In Stock: ${product.stock_quantity} ${product.unit}` : 'Out of Stock'}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 py-2">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-slate-400">inventory</span>
                <span className="text-xs font-bold dark:text-white">Min: {product.min_quantity || 1} {product.unit}</span>
              </div>
              {product.max_quantity && (
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">block</span>
                  <span className="text-xs font-bold dark:text-white">Max: {product.max_quantity} {product.unit}</span>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
              {product.description}
            </p>

            <div className="bg-slate-50 dark:bg-muted-dark/50 p-6 rounded-2xl border border-slate-100 dark:border-border-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-4">
                <ResponsiveImage 
                  src={product.profiles?.avatar_url || `https://picsum.photos/seed/${product.id}/100/100`} 
                  alt={`Profile picture of farmer ${product.profiles?.full_name || 'Unknown Farmer'}`} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-primary/20" 
                  baseWidth={100}
                  baseHeight={100}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm sm:text-base dark:text-white">{product.profiles?.full_name || 'Unknown Farmer'}</p>
                    {product.profiles?.is_verified && (
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                        <span className="material-symbols-outlined text-blue-500 text-[12px] fill-1">verified_user</span>
                        <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Verified Farmer</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="material-symbols-outlined text-[14px] sm:text-[16px] fill-1">star</span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-300 transition-colors">4.5 (10 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{product.location || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href={`/messages?contact=${product.farmer_id}`}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Contact
                </Link>
                <Link href={`/profile/${(product.profiles?.full_name || 'unknown').toLowerCase().replace(' ', '-')}`} className="text-primary font-black text-xs sm:text-sm hover:underline">Profile</Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {[
                { label: 'Harvest Season', value: product.harvest_season || 'Year round', icon: 'schedule' },
                { label: 'Category', value: product.category, icon: 'category' },
                { label: 'Location', value: product.location || 'Unknown', icon: 'location_on' },
              ].map((detail, i) => (
                <div key={i} className="bg-slate-50 dark:bg-muted-dark p-4 rounded-2xl border border-slate-100 dark:border-border-dark transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl mb-2">{detail.icon}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{detail.label}</p>
                  <p className="text-sm font-bold dark:text-white">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>
          
          {product.is_perishable && product.expiry_date && (
            <div className="bg-slate-50 dark:bg-muted-dark p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-6 transition-colors border border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-base sm:text-lg dark:text-white">Freshness Level</h4>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  product.health_status === 'Critical' ? 'bg-red-100 text-red-600' :
                  product.health_status === 'Warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {product.health_status === 'Critical' ? 'Short Shelf Life' : 
                   product.health_status === 'Warning' ? 'Moderate Freshness' : 'Peak Freshness'}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.max(0, Math.min(100, 
                        ((new Date(product.expiry_date).getTime() - Date.now()) / 
                        (new Date(product.expiry_date).getTime() - new Date(product.created_at).getTime())) * 100
                      ))}%` 
                    }}
                    className={`h-full transition-all duration-1000 ${
                      product.health_status === 'Critical' ? 'bg-red-500' :
                      product.health_status === 'Warning' ? 'bg-amber-500' :
                      'bg-primary'
                    }`}
                  />
                  <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Expired</span>
                  <span>Good</span>
                  <span>Freshly Picked</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Listed On</p>
                  <p className="text-sm font-bold dark:text-white">{new Date(product.created_at).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Best Before</p>
                  <p className="text-sm font-bold dark:text-white">{new Date(product.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-muted-dark p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4 sm:space-y-6 transition-colors">
            <h4 className="font-black text-base sm:text-lg dark:text-white">Diagnostic History</h4>
            <div className="space-y-3 sm:space-y-4">
              {[
                { date: 'Mar 05, 2026', result: 'Healthy', score: '99.2%', icon: 'check_circle', color: 'text-green-500' },
                { date: 'Feb 20, 2026', result: 'Healthy', score: '98.8%', icon: 'check_circle', color: 'text-green-500' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-sm sm:text-base ${log.color}`}>{log.icon}</span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold dark:text-white">{log.result}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{log.date}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{log.score}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-muted-dark p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4 sm:space-y-6 transition-colors">
            <h4 className="font-black text-base sm:text-lg dark:text-white">Order Customization</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Select Unit</label>
                <div className="flex flex-wrap gap-2">
                  {availableUnits.map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUnit(u)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        selectedUnit === u 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {formatUnit(u)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Quantity ({formatUnit(selectedUnit)})</label>
                  <div className="flex items-center justify-between bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl overflow-hidden transition-colors">
                    <button 
                      onClick={() => setQuantity(Math.max(product?.min_quantity || 1, quantity - 1))}
                      disabled={product.stock_quantity <= 0}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-surface-hover-dark text-slate-400 transition-colors disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <input 
                      type="number"
                      value={quantity}
                      min={product?.min_quantity || 1}
                      max={Math.floor(product.stock_quantity / convertQuantity(1, selectedUnit, product.unit))}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const maxAllowed = Math.floor(product.stock_quantity / convertQuantity(1, selectedUnit, product.unit));
                        setQuantity(Math.min(maxAllowed, Math.max(product?.min_quantity || 1, val)));
                      }}
                      disabled={product.stock_quantity <= 0}
                      className="w-full text-center font-black text-lg dark:text-white bg-transparent outline-none disabled:opacity-30"
                    />
                    <button 
                      onClick={() => {
                        const maxAllowed = Math.floor(product.stock_quantity / convertQuantity(1, selectedUnit, product.unit));
                        setQuantity(Math.min(maxAllowed, quantity + 1));
                      }}
                      disabled={product.stock_quantity <= 0 || (convertQuantity(quantity + 1, selectedUnit, product.unit) > product.stock_quantity)}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  {product.stock_quantity > 0 && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                      Max available: {Math.floor(product.stock_quantity / convertQuantity(1, selectedUnit, product.unit))} {formatUnit(selectedUnit)}
                    </p>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Price</label>
                  <div className="h-[52px] flex items-center px-6 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                    <p className="font-black text-xl text-primary">{totalPrice.toLocaleString()} CFA</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-4 disabled:bg-slate-300 disabled:shadow-none"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black dark:text-white">Customer Reviews</h3>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-yellow-400 fill-1">star</span>
                <span className="font-black dark:text-white">{ratingStats.avg}</span>
                <span className="text-xs text-slate-400 font-bold">({ratingStats.total} reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-800 pr-8">
                <p className="text-6xl font-black text-slate-900 dark:text-white">{ratingStats.avg}</p>
                <div className="flex items-center gap-1 text-yellow-400 my-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined ${i < Math.round(Number(ratingStats.avg)) ? 'fill-1' : ''}`}>star</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Average Rating</p>
              </div>
              <div className="space-y-2">
                {ratingStats.counts.map((count, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-4 dark:text-white">{5 - i}</span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${(count / ratingStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                        {review.profiles?.avatar_url ? (
                          <ResponsiveImage 
                            src={review.profiles.avatar_url} 
                            alt={review.profiles.full_name} 
                            className="w-full h-full object-cover"
                            baseWidth={100}
                            baseHeight={100}
                          />
                        ) : (
                          review.profiles?.full_name?.[0] || '?'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm dark:text-white">{review.profiles?.full_name || 'Anonymous'}</p>
                          {review.is_verified && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                              <span className="material-symbols-outlined text-[10px] fill-1">verified</span>
                              Verified
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'fill-1' : ''}`}>star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {review.comment}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                      Helpful ({review.helpful})
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[16px]">reply</span>
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors sticky top-28">
            <h4 className="font-black text-lg mb-6 dark:text-white">Write a Review</h4>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`material-symbols-outlined text-2xl transition-colors ${star <= newReview.rating ? 'text-yellow-400 fill-1' : 'text-slate-300 dark:text-slate-700'}`}
                    >
                      star
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Share your experience..."
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px] dark:text-white transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-primary text-white py-3 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="pt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black dark:text-white">Related Products</h3>
            <Link href="/marketplace" className="text-primary font-bold text-sm hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/marketplace/${p.id}`}
                className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <ResponsiveImage
                    src={p.image_url || 'https://picsum.photos/seed/product/400/300'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    baseWidth={400}
                    baseHeight={300}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary">
                    {p.category}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-black text-lg group-hover:text-primary transition-colors dark:text-white">{p.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-black text-primary">{p.price.toLocaleString()}<span className="text-xs text-slate-400 dark:text-slate-500 font-bold"> CFA/{p.unit}</span></p>
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                      <span className="text-[10px] font-bold text-slate-900 dark:text-slate-300">4.5</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* Sticky Mobile Add to Cart */}
      <div className="lg:hidden fixed bottom-24 left-4 right-4 z-40">
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase text-white/50 tracking-widest leading-none mb-1">Total Price</p>
             <p className="text-lg font-black text-white leading-none">{totalPrice.toLocaleString()} CFA</p>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={product.stock_quantity <= 0}
            className="bg-primary text-white h-14 px-8 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {product.stock_quantity > 0 ? 'Add' : 'Out'}
          </button>
        </div>
      </div>
      {product && (
        <NFCVerificationModal 
          isOpen={isNFCOpen}
          onClose={() => setIsNFCOpen(false)}
          product={product}
        />
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <ProtectedRoute>
      <ProductDetailContent />
    </ProtectedRoute>
  );
}
