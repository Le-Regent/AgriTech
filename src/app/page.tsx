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
import { 
  Plus, 
  Map as MapIcon, 
  Calendar, 
  Camera, 
  X, 
  Droplets, 
  Leaf, 
  Agriculture, 
  Package, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ArrowRight, 
  ShoppingCart, 
  Search, 
  Flame, 
  PackageOpen, 
  History, 
  Lightbulb, 
  Zap, 
  ListRestart, 
  Headset, 
  Bell, 
  Settings,
  User as UserIcon,
  ChevronRight,
  Eye,
  Microscope,
  CreditCard,
  Download,
  Edit,
  Wind,
  Sprout,
  ShoppingBag as StoreIcon,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AgriCalendar from '@/components/ui/AgriCalendar';

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

const [showCalendar, setShowCalendar] = useState(false);
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
        { label: t('crop_health'), value: diagnoses.length > 0 ? (diagnoses.filter(d => d.result_label === 'healthy' || d.status === 'healthy').length / diagnoses.length * 100).toFixed(0) + '%' : '--', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { label: t('total_inventory'), value: myProducts.reduce((sum, p) => sum + p.stock_quantity, 0).toLocaleString(), icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
        { label: t('pending_orders'), value: sellerOrders.filter(o => o.status === 'pending').length.toString(), icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
        { label: t('total_revenue'), value: sellerOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0).toLocaleString() + ' CFA', icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' }
      ];
    }
    return [
      { label: t('active_orders'), value: sellerOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      { label: t('notifications'), value: notifications.filter(n => !n.is_read).length.toString(), icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
      { label: t('total_spent'), value: sellerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString() + ' CFA', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      { label: t('purchase_history'), value: sellerOrders.length.toString(), icon: History, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' }
    ];
  }, [isFarmer, diagnoses, myProducts, sellerOrders, notifications, t]);

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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
              Agri<span className="text-primary tracking-normal">Market</span>
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">Fresh produce from Cameroon&apos;s finest farms.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleSearch} className="relative group min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:text-white" />
            </form>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants} 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
              <p className="text-sm sm:text-lg font-black dark:text-white tracking-tighter truncate">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Flame size={20} className="text-primary" /> {t('featured_products')}
                </h3>
                <Link href="/marketplace" className="text-primary text-sm font-bold hover:underline">{t('view_all')}</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <Link key={product.id} href={`/marketplace/${product.id}`} className="group space-y-3">
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-md">
                      <ResponsiveImage src={product.image_url || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" baseWidth={400} baseHeight={250} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg dark:text-white group-hover:text-primary transition-colors">{product.name}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-primary">{product.price.toLocaleString()} CFA</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded dark:text-slate-400 uppercase">{product.category}</span>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-2 py-12 text-center text-slate-500">
                    <Store size={40} className="mx-auto opacity-20 mb-2" />
                    <p>No products featured today.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-8 dark:text-white flex items-center gap-2">
                <Package size={20} className="text-primary" /> {t('recent_orders')}
              </h3>
              <div className="space-y-4">
                {sellerOrders.length > 0 ? sellerOrders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-muted-dark/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-surface-hover-dark transition-colors border border-transparent hover:border-slate-200 dark:hover:border-border-dark">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center border border-slate-100 dark:border-border-dark shadow-sm">
                        <PackageOpen size={24} className="text-primary" />
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
                <Lightbulb size={20} className="text-white/50" /> 
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
                           {item.trend.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Link href={isFarmer ? "/insights" : "/marketplace"} className="mt-8 w-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 relative z-10">
                {t('view_details')} <ArrowRight size={14} />
              </Link>
            </div>

            <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                <Zap size={20} className="text-primary" /> {t('quick_actions')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'reorder', icon: ListRestart, path: '/orders', color: 'bg-blue-50 text-blue-500' },
                  { label: 'support', icon: Headset, path: '/support', color: 'bg-orange-50 text-orange-500' },
                  { label: 'notifications', icon: Bell, path: '/notifications', color: 'bg-purple-50 text-purple-500' },
                  { label: 'settings', icon: Settings, path: '/settings', color: 'bg-slate-100 text-slate-600' },
                ].map((action, i) => (
                  <Link key={i} href={action.path} className="flex flex-col items-center gap-3 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:scale-105 active:scale-95 duration-200 group">
                    <action.icon size={24} className={`${action.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">{t(action.label)}</span>
                  </Link>
                ))}
              </div>
            </section>
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
      icon: Microscope,
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
    })),
    ...sellerOrders.slice(0, 3).map(o => ({
      title: 'Order Received',
      time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true }),
      desc: `New order from ${o.profiles?.full_name || 'a buyer'} for ${o.order_items?.[0]?.products?.name || 'products'}.`,
      icon: ShoppingCart,
      color: 'bg-green-50 dark:bg-green-500/10 text-green-500'
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

  if (recentActivities.length === 0) {
    recentActivities.push({
      title: 'Welcome to AgriTech',
      time: 'Just now',
      desc: 'Start by listing products or scanning your crops for health checks.',
      icon: Info,
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
            Agri<span className="text-primary tracking-normal">Control</span> 🇨🇲
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">Welcome back, {user?.full_name}. Here is what&apos;s happening today.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex items-center gap-3">
          <button 
            onClick={() => setShowCalendar(true)}
            className="flex-1 sm:flex-none bg-white dark:bg-white/5 dark:text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm group"
          >
            <Calendar size={18} className="group-hover:scale-110 transition-transform" />
            Calendar
          </button>
          
          <Link 
            id="new-diagnosis-btn" 
            href="/diagnosis" 
            className="flex-1 sm:flex-none bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group"
          >
            <Camera size={18} className="group-hover:rotate-12 transition-transform" />
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
                  <X size={14} />
                </button>
              </div>
              <div className="h-[500px]">
                <AgriCalendar />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
      >
        {[
          { label: 'Soil Moisture', value: '42%', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { 
            label: 'Crop Health', 
            value: diagnoses.length > 0 ? (diagnoses[0].status === 'healthy' ? '98%' : diagnoses[0].status === 'warning' ? '75%' : '45%') : '94%', 
            icon: Leaf, 
            color: 'text-green-500', 
            bg: 'bg-green-50 dark:bg-green-500/10',
            healthStatus: diagnoses.length > 0 ? diagnoses[0].status : 'healthy'
          },
          { label: 'Est. Harvest', value: '12.4t', icon: Agriculture, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { 
            label: 'Total Inventory', 
            value: myProducts.length > 0 
              ? `${myProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)} units` 
              : '0 units', 
            icon: Package, 
            color: 'text-purple-500', 
            bg: 'bg-purple-50 dark:bg-purple-500/10' 
          },
          { 
            label: 'Pending Orders', 
            value: sellerOrders.filter(o => o.status === 'pending' || o.status === 'processing').length.toString(), 
            icon: Clock, 
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
                <stat.icon size={18} />
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
                  { position: [4.0511, 9.7679], title: 'North Field', description: 'Healthy - Corn' },
                  { position: [4.0530, 9.7710], title: 'West Sector', description: 'Warning - Cassava' },
                  { position: [4.0490, 9.7650], title: 'South Buffer', description: 'Healthy - Plantain' }
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
                          <UserIcon size={18} />
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
                  <ArrowRight size={12} />
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
                      className="text-slate-400 hover:text-primary transition-colors"
                      title="Download Report"
                    >
                      <Download size={20} />
                    </button>
                    <Link href={`/diagnosis/result?id=${diagnosis.id}`} className="text-slate-400 hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </Link>
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
                <ArrowRight size={14} />
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
                    <Link href={`/marketplace/${product.id}`} className="text-slate-400 hover:text-primary transition-colors">
                      <Edit size={18} />
                    </Link>
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

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">{t('recent_activity')}</h3>
            <div className="space-y-6">
              {recentActivities.map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={20} />
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
                    <Droplets size={18} className="text-blue-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('humidity')}</p>
                      <p className="text-sm font-black">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <Wind size={18} className="text-emerald-400" />
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
            <Sprout size={32} className="text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight dark:text-white mb-2">AgriTech Pro</h2>
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
