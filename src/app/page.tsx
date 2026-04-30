'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useOffline } from '@/context/OfflineContext';
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

function DashboardContent() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { isOnline, saveToCache, getFromCache, addToSyncQueue } = useOffline();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isFarmer = user?.user_type === 'farmer';
  const hasLoadedFromCache = useRef(false);

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
      if (cachedWeather || cachedOrders || cachedMyProducts || cachedDiagnoses) {
        setDataLoading(false);
        setWeatherLoading(false);
      }
      
      hasLoadedFromCache.current = true;
    }
    
    loadCache();
  }, [user?.id, getFromCache]);

  useEffect(() => {
    async function fetchData() {
      // If we already have data from cache, don't trigger the global \"dataLoading\" spinner
      const shouldShowSpinner = !hasLoadedFromCache.current && !weather && !sellerOrders.length && !myProducts.length;
      if (shouldShowSpinner) {
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

        // Fire weather and app data in parallel for maximum speed
        fetchWeather();
        fetchAppData();

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
        // We only stop the \"global\" data loading here if we actually finished everything
        if (hasLoadedFromCache.current) {
          setDataLoading(false);
        }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) router.push(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const recentActivities = useMemo(() => {
    const activities = [
      ...diagnoses.slice(0, 3).map(d => ({
        title: 'Diagnosis Completed',
        time: formatDistanceToNow(new Date(d.created_at), { addSuffix: true }),
        desc: `${d.crop_type} - ${d.result_label || d.status}.`,
        icon: 'biotech',
        color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
      })),
      ...sellerOrders.slice(0, 3).map(o => ({
        title: isFarmer ? 'Order Received' : 'Order Placed',
        time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true }),
        desc: isFarmer 
          ? `New order from ${o.profiles?.full_name || 'a buyer'} for ${o.order_items?.[0]?.products?.name || 'products'}.`
          : `Order status: ${o.status}. Total: ${o.total_amount.toLocaleString()} CFA.`,
        icon: 'shopping_cart',
        color: 'bg-green-50 dark:bg-green-500/10 text-green-500'
      })),
    ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

    if (activities.length === 0) {
      activities.push({
        title: 'Welcome to AgriTech',
        time: 'Just now',
        desc: isFarmer ? 'Start by listing products or scanning your crops.' : 'Browse the marketplace for fresh produce.',
        icon: 'info',
        color: 'bg-primary/10 text-primary'
      });
    }
    return activities;
  }, [diagnoses, sellerOrders, isFarmer]);

  return (
    <>
      {dataLoading ? (
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
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96 lg:col-span-2 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : isFarmer ? (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
                Agri<span className="text-primary tracking-normal">Control</span> 🇨🇲
              </h2>
              <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Welcome back, {user?.full_name}.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link id="new-diagnosis-btn" href="/diagnosis" className="bg-primary text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                {t('diagnose')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center relative`}>
                    <span className="material-symbols-outlined fill-1 text-sm sm:text-lg">{stat.icon}</span>
                  </div>
                </div>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
                <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-8">
              <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-xl font-bold dark:text-white">{t('field_status_map')}</h3>
                </div>
                <div className="aspect-[16/9] bg-slate-100 dark:bg-muted-dark rounded-xl sm:rounded-2xl overflow-hidden relative group border border-slate-100 dark:border-border-dark">
                  <LiveMap 
                    center={[4.0511, 9.7679]} 
                    zoom={14}
                    markers={[
                      { position: [4.0511, 9.7679], title: 'North Field', description: 'Healthy - Corn' },
                      { position: [4.0530, 9.7710], title: 'West Sector', description: 'Warning - Cassava' }
                    ]}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm transition-all">
                <h3 className="text-base sm:text-xl font-bold mb-4 dark:text-white">{t('recent_orders')}</h3>
                <div className="space-y-4">
                  {sellerOrders.length > 0 ? (
                    sellerOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-4 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl border border-slate-100 dark:border-border-dark flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm dark:text-white">ORD-{order.id.slice(0, 6).toUpperCase()}</h4>
                          <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No orders found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-8">
              {weather && (
                <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
                  <h3 className="text-base sm:text-xl font-bold mb-4 dark:text-white">{t('weather_title')}</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black dark:text-white">{Math.round(weather.temp)}°</div>
                    <div className="text-sm dark:text-slate-400 capitalize">{weather.description}</div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-surface-dark p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-border-dark shadow-sm">
                <h3 className="text-base sm:text-xl font-bold mb-4 dark:text-white">{t('recent_activity')}</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate">{activity.title}</h4>
                        <p className="text-[10px] text-slate-500">{activity.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
                Agri<span className="text-primary tracking-normal">Market</span>
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
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, i) => (
              <div key={i}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined fill-1 text-lg sm:text-xl">{stat.icon}</span>
                </div>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
                <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold dark:text-white">{t('featured_products')}</h3>
                  <Link href="/marketplace" className="text-primary text-sm font-bold hover:underline">{t('view_all')}</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                    <Link key={product.id} href={`/marketplace/${product.id}`} className="group space-y-3">
                      <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-md relative">
                          <Image src={product.image_url || ''} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg dark:text-white group-hover:text-primary transition-colors">{product.name}</h4>
                        <p className="text-sm font-black text-primary">{product.price.toLocaleString()} CFA</p>
                      </div>
                    </Link>
                  )) : (
                    <div className="col-span-2 py-12 text-center text-slate-500">
                      <p>No products featured today.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div className={`bg-gradient-to-br from-primary to-primary-dark text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group`}>
                <h3 className="text-xl font-bold relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-white/50">trending_up</span> 
                  {t('market_trends')}
                </h3>
                <Link href="/marketplace" className="mt-8 w-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                  {t('view_details')}
                </Link>
              </div>

              <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6 dark:text-white">{t('quick_actions')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'marketplace', icon: 'storefront', path: '/marketplace' },
                    { label: 'orders', icon: 'shopping_bag', path: '/orders' },
                  ].map((action, i) => (
                    <Link key={i} href={action.path} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all hover:scale-105">
                      <span className="material-symbols-outlined text-primary">{action.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">{t(action.label)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { user, isAuthReady } = useUser();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="space-y-6 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-primary text-3xl animate-bounce">eco</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">Agri<span className="text-primary">Tech</span></h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis px-4">Initializing farm systems...</p>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <DashboardContent />
    </div>
  );
}
