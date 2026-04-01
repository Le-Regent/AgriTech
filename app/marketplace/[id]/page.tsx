'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import ResponsiveImage from '../../../src/components/ResponsiveImage';
import { INITIAL_PRODUCTS } from '../../../src/constants';
import { useCart } from '../../../src/context/CartContext';
import { useOffline } from '../../../src/context/OfflineContext';
import { useUser } from '../../../src/context/UserContext';
import { supabaseService } from '../../../src/services/supabaseService';
import { Product, ProductReview } from '../../../src/types';
import ProtectedRoute from '../../components/ProtectedRoute';
import { toast } from 'sonner';

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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (isOnline) {
          const data = await supabaseService.getProductById(id);
          if (data) {
            setProduct(data as Product);
            saveToCache(`product_${id}`, data);
          }
        } else {
          const cached = getFromCache(`product_${id}`);
          if (cached) setProduct(cached);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        const cached = getFromCache(`product_${id}`);
        if (cached) setProduct(cached);
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

  const [quantity, setQuantity] = useState(10);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

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
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`, {
      description: `Quantity: ${quantity} ${product.unit}`,
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/marketplace" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-bold">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Marketplace
        </Link>
        <div className="flex gap-3 relative">
          <button className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4 sm:space-y-6">
          <div className="aspect-square bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative transition-colors">
            <ResponsiveImage 
              src={product.image_url || 'https://picsum.photos/seed/product/1000/1000'} 
              alt={`Detailed view of ${product.name}`} 
              className="w-full h-full object-cover"
              baseWidth={1000}
              baseHeight={1000}
            />
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex flex-col gap-2 sm:gap-3">
              {product.is_verified && (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 transition-colors">
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
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition-colors">
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
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">{product.price.toLocaleString()} <span className="text-sm sm:text-base lg:text-lg text-slate-400 font-bold">CFA / {product.unit}</span></p>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors">In Stock</div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
              {product.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
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
                { label: 'Harvest Season', value: product.harvest_season || 'Year-round', icon: 'schedule' },
                { label: 'Category', value: product.category, icon: 'category' },
                { label: 'Location', value: product.location || 'Unknown', icon: 'location_on' },
              ].map((detail, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl mb-2">{detail.icon}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{detail.label}</p>
                  <p className="text-sm font-bold dark:text-white">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4 sm:space-y-6 transition-colors">
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

          <div className="flex flex-col sm:flex-row gap-4 relative">
            <div className="flex items-center justify-between sm:justify-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="px-6 font-black text-lg dark:text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white py-3 sm:py-0 rounded-2xl font-black text-base sm:text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Add to Cart
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
