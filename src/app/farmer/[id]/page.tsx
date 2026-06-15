'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { supabaseService } from '@/services/supabaseService';
import { Product, User } from '@/types';
import ProductCard from '@/components/features/marketplace/ProductCard';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FarmerShopPage() {
  const { id: farmerId } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  
  const [farmer, setFarmer] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarmerData() {
      if (!farmerId) return;
      try {
        setLoading(true);
        const [profileData, productsData] = await Promise.all([
          supabaseService.getProfile(farmerId),
          supabaseService.getProductsByFarmerId(farmerId)
        ]);
        setFarmer(profileData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading farmer data:', error);
        toast.error('Failed to load farmer profile');
      } finally {
        setLoading(false);
      }
    }
    loadFarmerData();
  }, [farmerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">person_off</span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Farmer Not Found</h1>
        <button 
          onClick={() => router.back()}
          className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Hero Header */}
      <div className="relative h-[300px] sm:h-[400px] overflow-hidden">
        <ResponsiveImage 
          src={farmer.avatar_url || `https://picsum.photos/seed/${farmer.id}/1200/600`}
          alt={farmer.farm_name || farmer.full_name}
          className="w-full h-full object-cover blur-sm opacity-50 dark:opacity-30"
          baseWidth={1200}
          baseHeight={600}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
        
        <div className="absolute top-8 left-4 sm:left-8 z-10">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform dark:text-white"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">arrow_back</span>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-32 sm:-mt-48 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 sm:p-12 shadow-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] border-4 border-white dark:border-slate-700 overflow-hidden shadow-xl shrink-0">
              <ResponsiveImage 
                src={farmer.avatar_url || `https://picsum.photos/seed/${farmer.id}/300/300`} 
                alt={farmer.full_name} 
                className="w-full h-full object-cover"
                baseWidth={300}
                baseHeight={300}
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                  {farmer.farm_name || farmer.full_name}
                </h1>
                {farmer.is_verified && (
                  <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] fill-1">verified</span>
                    {t('verified_farmer')}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 sm:gap-8 items-center text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span className="text-sm font-bold uppercase tracking-wide">{farmer.location_name || 'Cameroon'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-500 fill-1">star</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">4.9</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span className="text-sm font-bold">{t('years_experience')}: 8+</span>
                </div>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
                {farmer.bio || 'Passionate about sustainable agriculture and providing fresh produce to local Cameroonian markets.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-4">
                <button 
                  onClick={() => router.push(`/messages?partner=${farmer.id}`)}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  {t('contact_seller')}
                </button>
                {farmer.website && (
                  <a 
                    href={farmer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">language</span>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Farm Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
            {[
              { label: t('total_harvests'), value: '250+', icon: 'agriculture', color: 'text-primary' },
              { label: t('reputation'), value: 'Elite', icon: 'military_tech', color: 'text-amber-500' },
              { label: 'Markets', value: '4 regions', icon: 'local_shipping', color: 'text-blue-500' },
              { label: 'Followers', value: '1.2k', icon: 'group', color: 'text-indigo-500' }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] sm:text-[20px] ${stat.color}`}>{stat.icon}</span>
                  <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Farmer's Products Grid */}
        <div className="mt-16 sm:mt-24 space-y-8 sm:space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {t('products_by')} {farmer.full_name?.split(' ')[0]}
            </h2>
            <div className="bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-black text-primary uppercase tracking-widest">{products.length} Items</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  onClick={() => router.push(`/marketplace/${product.id}`)}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                      toast.success(`${product.name} added to cart`);
                    }}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                  </button>
                </ProductCard>
              </motion.div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20 bg-slate-100/50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 font-light">inventory_2</span>
              <p className="text-slate-500 font-bold uppercase tracking-widest">No active listings currently available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
