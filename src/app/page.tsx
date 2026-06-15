'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { useOffline } from '@/context/OfflineContext';
import { useCart } from '@/context/CartContext';
import { getWeatherData, getCurrentPosition, getForecastData, WeatherData, ForecastData } from '@/lib/weatherService';
import { supabaseService } from '@/services/supabaseService';
import { CropDiagnosis, Product, AppNotification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Skeleton from '@/components/ui/Skeleton';
import LandingPage from '@/app/welcome/page';

// Modular Dashboard Components
import LiveMarketBenchmarks from '@/components/features/dashboard/LiveMarketBenchmarks';
import EscrowSecurityCard from '@/components/features/dashboard/EscrowSecurityCard';
import QuickActionsHub from '@/components/features/dashboard/QuickActionsHub';
import FarmerDashboardView from '@/components/features/dashboard/FarmerDashboardView';
import BuyerDashboardView from '@/components/features/dashboard/BuyerDashboardView';

function DashboardContent() {
  const { user } = useUser();
  const { t, language } = useLanguage();
  const { cart } = useCart();
  const { isOnline, saveToCache, getFromCache, addToSyncQueue } = useOffline();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [expandedDiagnosisId, setExpandedDiagnosisId] = useState<string | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [otpInputOrderId, setOtpInputOrderId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState<string>('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const isFarmer = user?.user_type === 'farmer';
  const hasLoadedFromCache = useRef(false);

  const [showCalendar, setShowCalendar] = useState(false);

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
      if (!hasLoadedFromCache.current) {
        setDataLoading(true);
      }
      
      if (!isOnline) {
        setDataLoading(false);
        setWeatherLoading(false);
        return;
      }
      
      try {
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

        fetchWeather();
        fetchAppData().finally(() => {
          setDataLoading(false);
        });

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
  }, [isFarmer, user?.id, saveToCache, isOnline]);

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
        { label: t('total_revenue'), value: sellerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0).toLocaleString() + ' FCFA', icon: 'payments', color: 'text-primary', bg: 'bg-primary/10' }
      ];
    }
    return [
      { label: t('active_orders'), value: sellerOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length.toString(), icon: 'shopping_bag', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      { label: t('notifications'), value: notifications.filter(n => !n.is_read).length.toString(), icon: 'notifications', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
      { label: t('total_spent'), value: sellerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString() + ' FCFA', icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      { label: t('purchase_history'), value: sellerOrders.length.toString(), icon: 'history', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' }
    ];
  }, [isFarmer, diagnoses, myProducts, sellerOrders, notifications, t]);

  const liveMarketBenchmarks = <LiveMarketBenchmarks language={language} />;
  const escrowSecurityCard = <EscrowSecurityCard />;
  const renderedQuickActionsHub = (
    <QuickActionsHub
      user={user}
      isFarmer={isFarmer}
      t={t}
      cartLength={cart.length}
      myProductsLength={myProducts.length}
      dataLoading={dataLoading}
    />
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) router.push(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const recentActivities = useMemo(() => {
    const list = [];
    if (diagnoses.length > 0) {
      list.push({
        title: 'Crop Scan Performed',
        desc: `Scanned ${diagnoses[0].crop_type} - detected: ${diagnoses[0].result_label || diagnoses[0].status}`,
        time: formatDistanceToNow(new Date(diagnoses[0].created_at), { addSuffix: true }),
        icon: 'eco',
        color: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15'
      });
    }
    if (sellerOrders.length > 0) {
      list.push({
        title: isFarmer ? 'New Customer Order' : 'Order Placed',
        desc: `Order for ${sellerOrders[0].order_items?.[0]?.products?.name || 'produce'} with status ${sellerOrders[0].status}`,
        time: formatDistanceToNow(new Date(sellerOrders[0].created_at), { addSuffix: true }),
        icon: 'package_2',
        color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15'
      });
    }
    return list;
  }, [diagnoses, sellerOrders, isFarmer]);

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
      <BuyerDashboardView
        user={user}
        t={t}
        language={language}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        liveMarketBenchmarks={liveMarketBenchmarks}
        quickActionsHub={renderedQuickActionsHub}
        stats={stats}
        featuredProducts={featuredProducts}
        sellerOrders={sellerOrders}
        notifications={notifications}
        escrowSecurityCard={escrowSecurityCard}
      />
    );
  }

  return (
    <FarmerDashboardView
      user={user}
      t={t}
      diagnoses={diagnoses}
      myProducts={myProducts}
      sellerOrders={sellerOrders}
      isOnline={isOnline}
      notifications={notifications}
      weather={weather}
      forecast={forecast}
      weatherLoading={weatherLoading}
      setShowCalendar={setShowCalendar}
      recentActivities={recentActivities}
      expandedDiagnosisId={expandedDiagnosisId}
      setExpandedDiagnosisId={setExpandedDiagnosisId}
      otpInputOrderId={otpInputOrderId}
      setOtpInputOrderId={setOtpInputOrderId}
      otpValue={otpValue}
      setOtpValue={setOtpValue}
      setSellerOrders={setSellerOrders}
      addToSyncQueue={addToSyncQueue}
      quickActionsHub={renderedQuickActionsHub}
    />
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
