'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useOffline } from '@/context/OfflineContext';
import { useCart } from '@/context/CartContext';
import { INITIAL_PRODUCTS } from '@/constants';
import { getWeatherData, getCurrentPosition, getForecastData, WeatherData, ForecastData } from '@/lib/weatherService';
import { supabaseService } from '@/services/supabaseService';
import { CropDiagnosis, Product, Order, AppNotification } from '@/types';
import { downloadDiagnosisReport } from '@/lib/diagnosisUtils';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import LiveMap from '@/components/ui/LiveMap';

const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });

import LandingPage from '@/app/welcome/page';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Skeleton from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';
import KamerCalendar from '@/components/ui/AgriCalendar';

function DashboardContent() {
  const { user, updateProfile } = useUser();
  const { t, language } = useLanguage();
  const { cart } = useCart();
  const { isOnline, saveToCache, getFromCache, addToSyncQueue } = useOffline();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [otpInputOrderId, setOtpInputOrderId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState<string>('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isFarmer = user?.user_type === 'farmer';
  const hasLoadedFromCache = useRef(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [activeMode, setActiveMode] = useState<'farmer' | 'buyer'>('farmer');

  useEffect(() => {
    if (user?.user_type) {
      setActiveMode(user.user_type === 'farmer' ? 'farmer' : 'buyer');
    }
  }, [user?.user_type]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  // Load from cache immediately on mount or user change
  useEffect(() => {
    async function loadCache() {
      if (!user?.id || hasLoadedFromCache.current) return;

      const [
        cachedWeather,
        cachedForecast,
        cachedDiagnoses,
        cachedMyProducts,
        cachedOrders,
        cachedFeatured,
        cachedNotifs
      ] = await Promise.all([
        getFromCache('weather'),
        getFromCache('forecast'),
        getFromCache(`diagnoses_${user.id}`),
        getFromCache(`my_products_${user.id}`),
        getFromCache(`orders_${user.id}`),
        getFromCache('featured_products'),
        getFromCache(`notifs_${user.id}`)
      ]);

      if (cachedWeather) setWeather(cachedWeather);
      if (cachedForecast) setForecast(cachedForecast);
      if (cachedDiagnoses) setDiagnoses(cachedDiagnoses);
      if (cachedMyProducts) setMyProducts(cachedMyProducts);
      if (cachedOrders) setSellerOrders(cachedOrders);
      if (cachedFeatured) setFeaturedProducts(cachedFeatured);
      if (cachedNotifs) setNotifications(cachedNotifs);

      // If we have at least partial data, we can stop the skeleton early
      if (cachedWeather || cachedOrders || cachedMyProducts) {
        setDataLoading(false);
        setWeatherLoading(false);
      }
      
      hasLoadedFromCache.current = true;
    }
    
    loadCache();
  }, [user?.id, getFromCache]);

  useEffect(() => {
    async function fetchData() {
      // If we don't have cached data, show loading
      if (!hasLoadedFromCache.current) {
        setDataLoading(true);
      }
      
      if (!isOnline) {
        setDataLoading(false);
        setWeatherLoading(false);
        return;
      }
      
      try {
        // Handle Weather
        const fetchWeather = async () => {
          try {
            const position = await getCurrentPosition();
            const [weatherData, forecastData] = await Promise.all([
              getWeatherData(position.coords.latitude, position.coords.longitude),
              getForecastData(position.coords.latitude, position.coords.longitude)
            ]);
            setWeather(weatherData);
            setForecast(forecastData);
            saveToCache('weather', weatherData);
            saveToCache('forecast', forecastData);
          } catch (weatherErr) {
            console.warn('Geolocation or weather error:', weatherErr);
            // Default to Douala coordinates if geolocation fails
            const [weatherData, forecastData] = await Promise.all([
              getWeatherData(4.05, 9.71),
              getForecastData(4.05, 9.71)
            ]);
            setWeather(weatherData);
            setForecast(forecastData);
          } finally {
            setWeatherLoading(false);
          }
        };

        const fetchAppData = async () => {
          if (!user?.id) return;

          // Parallelize all app data fetching
          const fetchTasks = [
            supabaseService.getNotifications(user.id).then(notifs => {
              setNotifications(notifs);
              saveToCache(`notifs_${user.id}`, notifs);
              return notifs;
            }).catch(e => {
              console.warn('Notifications fetch error:', e);
              return [];
            })
          ];

          if (isFarmer) {
            fetchTasks.push(
              supabaseService.getDiagnoses(user.id).then(data => {
                setDiagnoses(data);
                saveToCache(`diagnoses_${user.id}`, data);
                return data;
              }),
              supabaseService.getProductsByFarmerId(user.id).then(data => {
                setMyProducts(data);
                saveToCache(`my_products_${user.id}`, data);
                return data;
              }),
              supabaseService.getOrders(user.id, 'farmer').then(data => {
                setSellerOrders(data);
                saveToCache(`orders_${user.id}`, data);
                return data;
              })
            );
          } else {
            fetchTasks.push(
              supabaseService.getOrders(user.id, 'buyer').then(data => {
                setSellerOrders(data);
                saveToCache(`orders_${user.id}`, data);
                return data;
              }),
              supabaseService.getProducts().then(data => {
                const filtered = data.filter(p => p.stock_quantity > 0).slice(0, 4);
                setFeaturedProducts(filtered);
                saveToCache('featured_products', filtered);
                return data;
              })
            );
          }

          await Promise.allSettled(fetchTasks);
        };

        // Fire weather and app data in parallel
        // We don't await them combined here, so that whichever finishes first can update the UI
        fetchWeather();
        fetchAppData().finally(() => {
          setDataLoading(false);
        });

        // Smart Logic: Occasionally trigger market/climate insights for farmers
        if (isFarmer && user?.id && isOnline) {
          const lastInsightTime = localStorage.getItem('last_insight_trigger');
          const now = Date.now();
          const oneHour = 3600000;

          if (!lastInsightTime || (now - parseInt(lastInsightTime)) > oneHour) {
            supabaseService.generateInsights(user.id);
            localStorage.setItem('last_insight_trigger', now.toString());
          }
        }
      } catch (error: any) {
        console.error('Failed to update dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    
    if (user?.id) {
      fetchData();
    }
  }, [isFarmer, user?.id, user?.user_type, saveToCache, isOnline]);

  useEffect(() => {
    if (!user?.id) return;
    const ordersChannel = supabase.channel(`db-orders-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: isFarmer ? undefined : `buyer_id=eq.${user.id}` }, async () => {
      const ordersData = await supabaseService.getOrders(user.id!, isFarmer ? 'farmer' : 'buyer');
      setSellerOrders(ordersData);
    }).subscribe();
    const notifChannel = supabase.channel(`db-notifs-${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async () => {
      try {
        const notifs = await supabaseService.getNotifications(user.id!);
        setNotifications(notifs);
        toast('New notification', { icon: '🔔' });
      } catch (e) {
        console.warn('Notification update failed:', e);
      }
    }).subscribe();
    return () => { supabase.removeChannel(ordersChannel); supabase.removeChannel(notifChannel); };
  }, [user?.id, isFarmer]);

  const stats = useMemo(() => {
    if (isFarmer) {
      return [
        { label: t('crop_health'), value: diagnoses.length > 0 ? (diagnoses.filter(d => d.result_label === 'healthy' || d.status === 'healthy').length / diagnoses.length * 100).toFixed(0) + '%' : '--', icon: 'potted_plant', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { label: t('total_inventory'), value: myProducts.reduce((sum, p) => sum + p.stock_quantity, 0).toLocaleString(), icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        { label: t('pending_orders'), value: sellerOrders.filter(o => o.status === 'pending').length.toString(), icon: 'shopping_cart', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
        { label: t('total_revenue'), value: sellerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0).toLocaleString() + ' CFA', icon: 'payments', color: 'text-primary', bg: 'bg-primary/10' }
      ];
    }
    return [
      { label: t('active_orders'), value: sellerOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length.toString(), icon: 'shopping_bag', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      { label: t('notifications'), value: notifications.filter(n => !n.is_read).length.toString(), icon: 'notifications', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
      { label: t('total_spent'), value: sellerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString() + ' CFA', icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      { label: t('purchase_history'), value: sellerOrders.length.toString(), icon: 'history', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' }
    ];
  }, [isFarmer, diagnoses, myProducts, sellerOrders, notifications, t]);

  const quickActionsHub = (
    <motion.div 
      variants={itemVariants} 
      className="w-full mb-8"
    >
      <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 text-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-800/80 shadow-xl overflow-hidden relative">
        {/* Animated fluid decorative background blobs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-10000" />
        <div className="absolute left-1/4 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Inner Card Content: Responsive multi-layout grid */}
        <div className="p-6 sm:p-8 lg:p-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Section 1: Dynamic Personalized Welcome Header */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Top line with Active Status Badges and Immediate Role Switch */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border border-white/5">
                  <span className="material-symbols-outlined text-[13px]">person_play</span>
                  {isFarmer ? 'Active: Farmer / Producteur' : 'Active: Buyer / Acheteur'}
                </div>
                
                {/* Micro-Toggle Role Switch with high accessibility click layer */}
                <button
                  onClick={async () => {
                    const targetRole = isFarmer ? 'buyer' : 'farmer';
                    const res = await updateProfile({ user_type: targetRole });
                    if (res?.error) {
                      toast.error(res.error);
                    } else {
                      toast.success(`Active mode: ${targetRole === 'farmer' ? 'Farmer' : 'Buyer'}`, {
                        description: `Seamlessly loaded ${targetRole} workspace.`
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none transition-all duration-200 border border-primary/30 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[12px]">swap_horiz</span>
                  {isFarmer ? 'Switch to Buyer' : 'Switch to Farmer'}
                </button>
              </div>

              {/* Dynamic Welcome Heading with User Name */}
              <div className="space-y-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Hello, {user?.full_name ? user.full_name.split(' ')[0] : (isFarmer ? 'Farmer' : 'Buyer')}! 👋
                </h3>
                <p className="text-xs sm:text-sm text-slate-305 max-w-xl leading-relaxed font-medium">
                  {isFarmer 
                    ? t('farmer_onboarding_desc')
                    : t('buyer_onboarding_desc')}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for both roles (Responsive Row of actions list) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              {isFarmer ? (
                <>
                  {/* Action 1: Diagnosis */}
                  <button 
                    onClick={() => router.push('/diagnosis')}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight">
                          {t('onboarding_diagnose_title')}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                          {t('onboarding_diagnose_subtitle')}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all text-sm ml-2">
                      arrow_forward_ios
                    </span>
                  </button>

                  {/* Action 2: Go to Marketplace */}
                  <button 
                    onClick={() => router.push('/marketplace')}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-orange-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-orange-300 transition-colors uppercase tracking-tight">
                          {t('onboarding_marketplace_title')}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                          {t('onboarding_marketplace_subtitle')}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 group-hover:text-orange-400 transition-all text-sm ml-2">
                      arrow_forward_ios
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* Action 1: Browse Produce */}
                  <button 
                    onClick={() => router.push('/marketplace')}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-indigo-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">
                          {t('onboarding_shop_title')}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                          {t('onboarding_shop_subtitle')}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all text-sm ml-2">
                      arrow_forward_ios
                    </span>
                  </button>

                  {/* Action 2: Track Orders */}
                  <button 
                    onClick={() => router.push('/orders')}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-purple-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                          {t('onboarding_orders_title')}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                          {t('onboarding_orders_subtitle')}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 group-hover:text-purple-400 transition-all text-sm ml-2">
                      arrow_forward_ios
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Interactive Role Status Sidebar Card - Responsive (stacked on mobile/tablet, visual block on desktop) */}
          <div className="w-full bg-slate-950/40 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4 shadow-inner">
            {isFarmer ? (
              <>
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
                      <span className="material-symbols-outlined text-sm text-primary">storefront</span>
                      {t('my_store_badge') || 'My Store'}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight leading-snug">
                      {t('my_store_title') || 'Your Digital Farm Stall'}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                      {t('my_store_desc') || "Check pricing benchmarks or list new items for escrow purchase instantly."}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t('active_catalog') || 'My Listings'}</span>
                      <span className="font-extrabold text-primary">
                        {dataLoading ? "..." : myProducts.length} {t('listings') || 'Listings'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/farmer/${user?.id || 'profile'}`)}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 bg-primary hover:bg-primary/95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-sm">point_of_sale</span>
                  {t('go_to_store_btn') || 'Go to My Farm Stall'}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
                      <span className="material-symbols-outlined text-sm text-primary animate-bounce">shopping_cart</span>
                      {t('my_basket_badge') || 'My Basket'}
                    </span>
                    {cart.length > 0 && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                        {cart.length} item{cart.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight leading-snug">
                      {t('my_basket_title') || 'Fresh Local Shopping'}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                      {t('my_basket_desc') || "Track item transit or continue to checkout with your active cooperative basket."}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t('checkout_ready') || 'Basket Status'}</span>
                      <span className="font-extrabold text-primary">
                        {cart.length > 0 ? (t('ready_now') || 'Ready now') : 'Empty'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/cart')}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 bg-primary hover:bg-primary/95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  {t('checkout_cart_btn') || 'Go to Basket'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) router.push(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  if (dataLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isFarmer) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-12"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
              Kamer<span className="text-primary tracking-normal">Market</span>
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Fresh produce from Cameroon&apos;s finest farms.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleSearch} className="relative group min-w-[240px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:text-white" />
            </form>
          </div>
        </motion.div>

        {/* Cameroon Live Market Price Benchmarks Board */}
        <motion.div 
          variants={itemVariants}
          className="bg-slate-900 border border-white/5 text-white rounded-[2rem] p-5 sm:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-white/5">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-420">
                  Live Farm-Gate Benchmarks
                </h4>
                <p className="text-[9px] text-slate-400 md:max-w-xs">
                  Updated local wholesale rates in Main Food Sourcing Hubs
                </p>
              </div>
            </div>

            {/* Price Cards Horizontal Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 scroll-smooth">
              {[
                { name: 'Cocoa Beans (Kumba)', price: '1,850 CFA/kg', change: '+2.4%', up: true },
                { name: 'Irish Potatoes (Foumbot)', price: '18,500 CFA/sac', change: '+4.0%', up: true },
                { name: 'Plantains (Makenene)', price: '3,800 CFA/reg', change: '-1.5%', up: false },
                { name: 'Garri (Buea)', price: '12,000 CFA/sac', change: '+1.1%', up: true },
                { name: 'Arabica Coffee (Bafoussam)', price: '2,100 CFA/kg', change: 'Stable', up: null },
              ].map((bench, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex flex-col justify-between shrink-0 min-w-[135px] sm:min-w-[155px]">
                  <span className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase">{bench.name}</span>
                  <div className="flex items-baseline justify-between gap-1 mt-1">
                    <span className="text-[11px] font-black text-white">{bench.price}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                      bench.up === true ? 'text-emerald-400 bg-emerald-500/15' :
                      bench.up === false ? 'text-red-400 bg-red-500/15' : 'text-slate-400 bg-white/10'
                    }`}>
                      {bench.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Click-to-Search Category Chips */}
        <motion.div 
          variants={itemVariants}
          className="space-y-2.5"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary">local_mall</span>
            {t('quick_shop_categories') || 'Quick Categories'}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { label: language === 'fr' ? '🥬 Légumes' : '🥬 Vegetables', value: 'Vegetables' },
              { label: language === 'fr' ? '🍍 Fruits' : '🍍 Fruits', value: 'Fruits' },
              { label: language === 'fr' ? '🌾 Grains & Fèves' : '🌾 Grains & Beans', value: 'Grains & Beans' },
              { label: language === 'fr' ? '🍚 Épicerie' : '🍚 Foodstuff', value: 'Foodstuff' },
              { label: language === 'fr' ? '🌶️ Épices' : '🌶️ Spices & Pepper', value: 'Spices & Pepper' },
              { label: language === 'fr' ? '🍯 Huiles' : '🍯 Oils', value: 'Oils' },
            ].map((chip) => (
              <button
                key={chip.value}
                onClick={() => router.push(`/marketplace?category=${encodeURIComponent(chip.value)}`)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-bold border border-slate-100 dark:border-white/5 shadow-xs shrink-0 transition-transform active:scale-95 duration-200 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </motion.div>

        {quickActionsHub}

        <motion.div 
          variants={containerVariants} 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined fill-1 text-lg sm:text-xl">{stat.icon}</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
              <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* National Agricultural Cooperatives & Sourcing Hubs */}
            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">hub</span>
                    {language === 'fr' ? 'COOPÉRATIVES RÉGIONALES' : 'REGIONAL COOPERATIVE HUBS'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {language === 'fr' 
                      ? 'Parcourez le Cameroun par zones de production majeures' 
                      : 'Connect with direct food pools in peak production basins'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Kumba Hubs', region: 'South-West', crop: 'Cocoa & Pepper', term: 'Kumba', desc: 'Volcanic Soil Sourcing', color: 'border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5', icon: 'forest' },
                  { name: 'Foumbot Co-ops', region: 'West Province', crop: 'Potatoes & Vegs', term: 'Foumbot', desc: 'The Garden State', color: 'border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5', icon: 'agriculture' },
                  { name: 'Makenene Hub', region: 'Centre Province', crop: 'Plantains & Bananas', term: 'Makenene', desc: 'Central Route', color: 'border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5', icon: 'local_shipping' },
                  { name: 'Buea Farms', region: 'South-West', crop: 'Volcanic Soil Tea', term: 'Buea', desc: 'Mountain Slopes', color: 'border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5', icon: 'wb_sunny' },
                ].map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => router.push(`/marketplace?search=${encodeURIComponent(hub.term)}`)}
                    className={`p-3 text-left border rounded-2xl transition-all duration-200 group active:scale-[0.98] relative overflow-hidden backdrop-blur-sm cursor-pointer ${hub.color}`}
                  >
                    <div className="flex items-start justify-between gap-1 relative z-10">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors block">{hub.region}</span>
                        <h5 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1 leading-tight tracking-tight">{hub.name}</h5>
                        <p className="text-[10px] sm:text-xs font-black text-primary mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px] leading-none">compost</span>
                          {hub.crop}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-base group-hover:scale-110 group-hover:text-primary transition-all shrink-0 mt-0.5 leading-none">
                        {hub.icon}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            <section className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_fire_department</span> {t('featured_products')}
                </h3>
                <Link href="/marketplace" className="text-primary text-sm font-bold hover:underline">{t('view_all')}</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <Link key={product.id} href={`/marketplace/${product.id}`} className="group gap-2 flex flex-col justify-between text-left">
                    <div className="space-y-3">
                      <div className="aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-sm border border-slate-100/15 dark:border-white/5 relative">
                        <ResponsiveImage src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" baseWidth={400} baseHeight={250} />
                        {product.is_verified && (
                          <span className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md flex items-center justify-center w-5 h-5">
                            <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-base dark:text-white group-hover:text-primary transition-colors leading-snug tracking-tight line-clamp-1">{product.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">
                          <p className="text-[11px] sm:text-sm font-black text-primary leading-none">{product.price.toLocaleString()} CFA</p>
                          <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded dark:text-slate-400 uppercase tracking-wider self-start sm:self-auto truncate max-w-full">{product.category}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-2 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl opacity-20 mb-2">storefront</span>
                    <p>No products featured today.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-8 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">order_play</span> {t('recent_orders')}
              </h3>
              <div className="space-y-4">
                {sellerOrders.length > 0 ? sellerOrders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-slate-200 dark:hover:border-border-dark">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center border border-slate-100 dark:border-border-dark shadow-sm">
                        <span className="material-symbols-outlined text-primary">package_2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-white tracking-tight leading-none mb-1">ORD-{order.id.slice(0, 6).toUpperCase()}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                          {order.order_items?.[0]?.products?.name || 'Produce'} {order.order_items?.length > 1 ? `+${order.order_items.length - 1} more` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">{formatDistanceToNow(new Date(order.created_at || new Date()), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm dark:text-white mb-1">{(order.total_amount || 0).toLocaleString()} CFA</p>
                      <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 font-medium">You haven&apos;t placed any orders yet.</p>
                    <Link href="/marketplace" className="text-xs font-bold text-primary mt-2 block hover:underline">Start Shopping</Link>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className={`bg-gradient-to-br ${isFarmer ? 'from-emerald-600 to-teal-700' : 'from-primary to-primary-dark'} text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group`}>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
              <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-white/50">{isFarmer ? 'lightbulb' : 'trending_up'}</span> 
                {isFarmer ? t('smart_insights') : t('market_trends')}
              </h3>
              
              <div className="space-y-4 relative z-10">
                {notifications.filter(n => n.category === 'market' || n.category === 'climate' || n.category === 'proposition').length > 0 ? (
                  notifications
                    .filter(n => n.category === 'market' || n.category === 'climate' || n.category === 'proposition')
                    .slice(0, 3)
                    .map((item, i) => (
                      <div key={i} className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.title}</p>
                        <p className="text-xs font-bold leading-relaxed">{item.message}</p>
                      </div>
                    ))
                ) : (
                  <div className="space-y-3">
                    {[
                      { name: 'Cassava (Garri)', trend: '+12%', color: 'text-emerald-300' },
                      { name: 'Cocoa Beans', trend: '+5%', color: 'text-emerald-300' },
                      { name: 'Plantains', trend: '-2%', color: 'text-rose-300' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-bold bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="tracking-tight">{item.name}</span>
                        <span className={`flex items-center gap-1 ${item.color}`}>
                          <span className="material-symbols-outlined text-sm">{item.trend.startsWith('+') ? 'trending_up' : 'trending_down'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Link href={isFarmer ? "/insights" : "/marketplace"} className="mt-8 w-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                {t('view_details')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Escrow Protective Shield */}
            <div className="bg-slate-950 border border-white/5 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden text-left space-y-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                </span>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 leading-none">
                    Guaranteed Escrow
                  </h4>
                  <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Trusted Agri-Trade</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Your payment is buffered in a secure, digital hold when you order. Funds are only cleared once you verify your goods:
              </p>

              <div className="space-y-2 border-t border-white/5 pt-3">
                {[
                  'Farmer ships fresh bags down transit corridors',
                  'You check food health at the Douala/Yaoundé zone',
                  'Confirm satisfaction to dispatch payments'
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-300">
                    <span className="material-symbols-outlined text-xs text-primary shrink-0 mt-0.5">check_circle</span>
                    <p className="leading-tight">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-500 border-t border-white/5 pt-3">
                <span>VERIFICATION CODE</span>
                <span className="text-emerald-400 font-bold">100% SECURED</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const recentActivities = [
    ...diagnoses.slice(0, 3).map(d => ({
      title: 'Diagnosis Completed',
      time: formatDistanceToNow(new Date(d.created_at), { addSuffix: true }),
      desc: `${d.crop_type} - ${d.result_label || d.status}.`,
      icon: 'biotech',
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
    })),
    ...sellerOrders.slice(0, 3).map(o => ({
      title: 'Order Received',
      time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true }),
      desc: `New order from ${o.profiles?.full_name || 'a buyer'} for ${o.order_items?.[0]?.products?.name || 'products'}.`,
      icon: 'shopping_cart',
      color: 'bg-green-50 dark:bg-green-500/10 text-green-500'
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

  if (recentActivities.length === 0) {
    recentActivities.push({
      title: 'Welcome to KamerFresh',
      time: 'Just now',
      desc: 'Start by listing products or scanning your crops for health checks.',
      icon: 'info',
      color: 'bg-primary/10 text-primary'
    });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex-1">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
            Kamer<span className="text-primary tracking-normal">Fresh</span> 🇨🇲
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">Welcome back, {user?.full_name}. Here is what&apos;s happening today.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <button 
            onClick={() => setShowCalendar(true)}
            className="flex-1 sm:flex-none bg-white dark:bg-white/5 dark:text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">calendar_month</span>
            Calendar
          </button>
          
          <Link 
            id="new-diagnosis-btn" 
            href="/diagnosis" 
            className="flex-1 sm:flex-none bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">add_a_photo</span>
            {t('diagnose') || 'Diagnose'}
          </Link>
        </div>
      </motion.div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendar(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-6 right-6 z-30">
                <button 
                  onClick={() => setShowCalendar(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="h-[500px]">
                <KamerCalendar />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {quickActionsHub}

      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
      >
        {[
          { label: 'Soil Moisture', value: '42%', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { 
            label: 'Crop Health', 
            value: diagnoses.length > 0 ? (diagnoses[0].status === 'healthy' ? '98%' : diagnoses[0].status === 'warning' ? '75%' : '45%') : '94%', 
            icon: 'eco', 
            color: 'text-green-500', 
            bg: 'bg-green-50 dark:bg-green-500/10',
            healthStatus: diagnoses.length > 0 ? diagnoses[0].status : 'healthy'
          },
          { label: 'Est. Harvest', value: '12.4t', icon: 'agriculture', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { 
            label: 'Total Inventory', 
            value: myProducts.length > 0 
              ? `${myProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)} units` 
              : '0 units', 
            icon: 'inventory_2', 
            color: 'text-purple-500', 
            bg: 'bg-purple-50 dark:bg-purple-500/10' 
          },
          { 
            label: 'Pending Orders', 
            value: sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length.toString(), 
            icon: 'pending_actions', 
            color: 'text-amber-500', 
            bg: 'bg-amber-50 dark:bg-amber-500/10' 
          },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            {stat.label === 'Crop Health' && (
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20 blur-2xl ${
                stat.healthStatus === 'healthy' ? 'bg-green-500' : 
                stat.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            )}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center relative`}>
                <span className="material-symbols-outlined fill-1 text-sm sm:text-lg">{stat.icon}</span>
              </div>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg ${
                stat.label === 'Crop Health' ? (
                  stat.healthStatus === 'healthy' ? 'text-green-500 bg-green-50 dark:bg-green-500/10' :
                  stat.healthStatus === 'warning' ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' :
                  'text-red-500 bg-red-50 dark:bg-red-500/10'
                ) : 'text-green-500 bg-green-50 dark:bg-green-500/10'
              }`}>
                {stat.label === 'Crop Health' ? stat.healthStatus?.toUpperCase() : '+2%'}
              </span>
            </div>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 sm:space-y-8">
          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('field_status_map')}</h3>
              <div className="flex gap-2">
                <button className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-muted-dark rounded-lg text-[10px] sm:text-xs font-bold dark:text-slate-300">{t('satellite')}</button>
                <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">{t('heatmap')}</button>
              </div>
            </div>
            <div className="aspect-[16/9] bg-slate-100 dark:bg-muted-dark rounded-xl sm:rounded-2xl overflow-hidden relative group border border-slate-100 dark:border-border-dark">
              <LiveMap 
                center={[4.0511, 9.7679]} 
                zoom={14}
                markers={[
                  { 
                    position: [4.0511, 9.7679], 
                    title: 'North Field', 
                    description: 'Healthy - Corn',
                    sensors: { moisture: 68, temperature: 24, humidity: 78 }
                  },
                  { 
                    position: [4.0530, 9.7710], 
                    title: 'West Sector', 
                    description: 'Warning - Cassava',
                    sensors: { moisture: 42, temperature: 28, humidity: 65 }
                  },
                  { 
                    position: [4.0490, 9.7650], 
                    title: 'South Buffer', 
                    description: 'Healthy - Plantain',
                    sensors: { moisture: 72, temperature: 23, humidity: 82 }
                  }
                ]}
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm flex items-center gap-1.5 sm:gap-2 z-[400]">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-bold dark:text-white">{t('live_monitoring')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('orders_to_process')}</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                {sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length} NEW
              </span>
            </div>
            <div className="space-y-4">
              {sellerOrders.length > 0 ? (
                sellerOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl border border-slate-100 dark:border-border-dark">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-border-dark">
                          <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm dark:text-white">{order.profiles?.full_name || 'Buyer'}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">{item.products?.name} x {item.quantity}</span>
                          <span className="font-bold dark:text-white">{(item.quantity * item.price_at_purchase).toLocaleString()} CFA</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={async () => {
                              try {
                                if (isOnline) {
                                  await supabaseService.updateOrderStatus(order.id, 'processing');
                                  toast.success('Order moved to processing');
                                } else {
                                  addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'processing' });
                                  toast.info('Order accepted offline. Will sync when online.');
                                }
                                setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'processing' } : o));
                              } catch (err) {
                                toast.error('Failed to update order');
                              }
                            }}
                            className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/90 transition-all"
                          >
                            {t('accept_order')}
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button 
                            onClick={async () => {
                              try {
                                  if (isOnline) {
                                    await supabaseService.updateOrderStatus(order.id, 'shipped');
                                    toast.success('Order marked as shipped');
                                  } else {
                                    addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'shipped' });
                                    toast.info('Order updated offline. Will sync when online.');
                                  }
                                  setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped' } : o));
                              } catch (err) {
                                toast.error('Failed to update order');
                              }
                            }}
                            className="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 transition-all"
                          >
                            {t('mark_shipped')}
                          </button>
                        )}
                        {order.status === 'shipped' && otpInputOrderId !== order.id && (
                          <button 
                            onClick={() => {
                              setOtpInputOrderId(order.id);
                              setOtpValue('');
                            }}
                            className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 transition-all"
                          >
                            Verify Delivery
                          </button>
                        )}
                        {otpInputOrderId === order.id && (
                          <div className="w-full mt-2 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-[1.25rem] border border-slate-200/55 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Enter 6-Digit Delivery OTP</p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                maxLength={6}
                                placeholder="e.g. 123456"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-muted-dark dark:text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary text-center tracking-widest"
                              />
                              <button 
                                onClick={async () => {
                                  if (otpValue.length !== 6) {
                                    toast.error('Please enter a 6-digit OTP code');
                                    return;
                                  }
                                  try {
                                    if (isOnline) {
                                      await supabaseService.updateOrderStatus(order.id, 'delivered');
                                      toast.success('Delivery verified successfully!');
                                    } else {
                                      addToSyncQueue('ORDER_STATUS_UPDATE', { id: order.id, status: 'delivered' });
                                      toast.info('Delivery verified offline. Will sync when online.');
                                    }
                                    setSellerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
                                    setOtpInputOrderId(null);
                                    setOtpValue('');
                                  } catch (err) {
                                    toast.error('Failed to verify delivery');
                                  }
                                }}
                                className="bg-primary text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/95"
                              >
                                Verify
                              </button>
                              <button 
                                onClick={() => {
                                  setOtpInputOrderId(null);
                                  setOtpValue('');
                                }}
                                className="bg-slate-200 dark:bg-muted-dark text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      <button className="px-3 bg-slate-200 dark:bg-muted-dark text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-surface-hover-dark transition-all">
                        {t('details_btn')}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No orders to process.</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart AI Farmer Advisor & Action Almanac */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-emerald-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none border border-emerald-500/30">
                <span className="material-symbols-outlined text-[13px] animate-pulse">eco</span>
                AGRO-ALMANAC
              </span>
              <span className="text-[10px] font-bold text-slate-400">May Peak Rain</span>
            </div>
            
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-black text-white tracking-tight uppercase">
                Smart Cultivation Advisory
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                High humidity stages detected in West & South-West zones.
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3 text-left">
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0 mt-0.5">verified_user</span>
                <p><strong>Crops:</strong> Plant cassava mounds immediately; inspect banana suckers for efficient drainage to protect roots.</p>
              </div>
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-orange-400 shrink-0 mt-0.5">warning</span>
                <p><strong>Risk:</strong> High susceptibility to Cocoa Black Pod Rot. Keep spacing wide and spray safely under recommendations.</p>
              </div>
              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className="material-symbols-outlined text-sm text-sky-400 shrink-0 mt-0.5">biotech</span>
                <p><strong>Health Scans:</strong> Utilize LeafScanner daily to capture and spot premature blight before outbreak spreads.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('past_diagnoses')}</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md">
                  {diagnoses.length} 
                </span>
              </div>
              <div className="flex gap-4">
                <Link href="/history?tab=diagnoses" className="text-slate-400 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                  {t('view_all')}
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
                <Link href="/diagnosis" className="text-primary text-xs font-black uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all">{t('new_scan')}</Link>
              </div>
            </div>
            <div className="space-y-4">
              {diagnoses.length > 0 ? diagnoses.slice(0, 3).map((diagnosis) => (
                <div key={diagnosis.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl border border-slate-100 dark:border-border-dark">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <ResponsiveImage 
                      src={diagnosis.image_url} 
                      alt={diagnosis.crop_type} 
                      className="w-full h-full object-cover"
                      baseWidth={100}
                      baseHeight={100}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-sm dark:text-white truncate">{diagnosis.crop_type}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        diagnosis.status === 'healthy' ? 'bg-green-100 text-green-600' :
                        diagnosis.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {diagnosis.result_label || diagnosis.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence: {((diagnosis.confidence || 0) * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-slate-400">{new Date(diagnosis.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => downloadDiagnosisReport(diagnosis)}
                      className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                      title="Download Report"
                    >
                      download
                    </button>
                    <Link href={`/diagnosis/result?id=${diagnosis.id}`} className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">chevron_right</Link>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No diagnoses recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('my_inventory')}</h3>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {myProducts.length} 
                </span>
              </div>
              <Link href="/listings" className="text-slate-400 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                {t('manage_all')}
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
            <div className="space-y-4">
              {myProducts.length > 0 ? (
                myProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <ResponsiveImage 
                        src={product.image_url || 'https://picsum.photos/seed/product/100/100'} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        baseWidth={100}
                        baseHeight={100}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm dark:text-white truncate">{product.name}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          product.stock_quantity > 50 ? 'bg-green-100 text-green-600' :
                          product.stock_quantity > 10 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {product.stock_quantity} {product.unit} left
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{product.price.toLocaleString()} CFA / {product.unit}</p>
                    </div>
                    <Link href={`/marketplace/${product.id}`} className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">edit</Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No products listed yet.</p>
                  <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline mt-2 inline-block">Go to Marketplace to add products</Link>
                </div>
              )}
            </div>
          </div>

          {/* Market Demand Index for Cameroon Sourcing */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-primary">analytics</span>
                  MARKET DEMAND INDEX
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">What Cameroonian wholesalers and buyers are actively seeking</p>
              </div>
              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/15 leading-none">HIGH DEMAND</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              {[
                { crop: 'Penja White Pepper', target: 'Douala / Export', demand: '98%', trend: '+8.4%', up: true, desc: 'Grade A Sun-Dried' },
                { crop: 'Yellow Maize', target: 'Bafoussam Feeds', demand: '92%', trend: '+14.2%', up: true, desc: 'Dry Bulk Shelled' },
                { crop: 'Mbe Yam Tubers', target: 'Yaoundé Mfoundi', demand: '81%', trend: '-2.1%', up: false, desc: 'Large Tubers preferred' },
                { crop: 'Organic Avocado', target: 'Mbouda Sourcing', demand: '74%', trend: '+5.0%', up: true, desc: 'Fuerte & Butter varieties' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1 hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 truncate">{item.target}</span>
                    <span className={`text-[8px] font-black ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>{item.trend}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1 leading-tight tracking-tight">{item.crop}</h4>
                  <p className="text-[9px] text-slate-500 truncate">{item.desc}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: item.demand }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{item.demand}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">{t('recent_activity')}</h3>
            <div className="space-y-6">
              {recentActivities.map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center ${item.color}`}>
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm dark:text-white">{item.title}</h4>
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6 sm:space-y-8">
          <div className="bg-background-dark text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <h3 className="text-lg sm:text-xl font-bold mb-6 relative z-10">{t('weather_forecast')}</h3>
            {weatherLoading ? (
              <div className="animate-pulse space-y-4 relative z-10">
                <div className="h-10 w-24 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-32 bg-white/10 rounded-lg"></div>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <p className="text-3xl sm:text-4xl font-black">{weather.temp}°C</p>
                    <p className="text-xs sm:text-sm text-slate-400 capitalize">
                      {weather.description}, {weather.rain ? `${weather.rain}mm rain` : 'No Rain'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{weather.city}</p>
                  </div>
                  {weather.icon && (
                    <Image 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                      alt={weather.description}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10 mb-8">
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-blue-400">water_drop</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('humidity')}</p>
                      <p className="text-sm font-black">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-400">air</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('wind')}</p>
                      <p className="text-sm font-black">{weather.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>

                {forecast && (
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">{t('hourly_temp')} (°C)</p>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast.hourly}>
                            <defs>
                              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="temp" stroke="#fbbf24" fillOpacity={1} fill="url(#colorTemp)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">{t('precip')} (mm)</p>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={forecast.daily}>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe Spraying and Smart Harvest window */}
                <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border text-left ${
                  (weather.rain || weather.humidity > 80)
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}>
                  <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                    {(weather.rain || weather.humidity > 80) ? 'warning' : 'task_alt'}
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {(weather.rain || weather.humidity > 80) ? 'PRESP_CROP WARNING' : 'SAFE SPRAY WINDOW'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
                      {(weather.rain || weather.humidity > 80) 
                        ? 'High rainfall or humidity risks washing organic treatment spray off cocoa fields or potato plants. Postpone active applications.' 
                        : 'Optimal humidity levels with zero short-term rain forecast. Ideal to dispatch nutrient spray and execute scans.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 relative z-10">Weather data unavailable. Please enable location access.</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">{t('active_categories')}</h3>
            <div className="space-y-4">
              {myProducts.length > 0 ? Array.from(new Set(myProducts.map(p => p.category))).slice(0, 3).map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs sm:text-sm font-bold mb-2 dark:text-slate-300">
                    <span>{cat}</span>
                    <span className="text-slate-400 dark:text-slate-500">{Math.round((myProducts.filter(p => p.category === cat).length / myProducts.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(myProducts.filter(p => p.category === cat).length / myProducts.length) * 100}%` }}></div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500">No category data available.</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, isAuthReady } = useUser();

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">potted_plant</span>
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight dark:text-white mb-2">KamerFresh</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Initializing smart farm dashboard...</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div 
          key="landing" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <LandingPage />
        </motion.div>
      ) : (
        <motion.div 
          key="dashboard"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <DashboardContent />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
