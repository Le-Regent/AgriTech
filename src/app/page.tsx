'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import ResponsiveImage from '@/components/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { INITIAL_PRODUCTS } from '@/constants';
import { getWeatherData, getCurrentPosition, getForecastData, WeatherData, ForecastData } from '@/lib/weatherService';
import { supabaseService } from '@/services/supabaseService';
import { CropDiagnosis } from '@/types';
import { downloadDiagnosisReport } from '@/lib/diagnosisUtils';
import { formatDistanceToNow } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar 
} from 'recharts';
import LandingPage from '@/app/welcome/page';
import { toast } from 'sonner';

const SAMPLE_DIAGNOSES: CropDiagnosis[] = [
  {
    id: 'sample-1',
    farmer_id: 'sample',
    crop_type: 'White Cassava',
    confidence: 0.92,
    status: 'warning',
    result_label: 'Warning',
    image_url: 'https://picsum.photos/seed/cassava-disease/400/300',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    recommendation: 'Remove infected plants immediately to prevent spread.'
  },
  {
    id: 'sample-2',
    farmer_id: 'sample',
    crop_type: 'Premium Cocoa',
    confidence: 0.88,
    status: 'critical',
    result_label: 'Critical',
    image_url: 'https://picsum.photos/seed/cocoa-disease/400/300',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    recommendation: 'Apply approved fungicides and improve drainage.'
  }
];

function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [diagnoses, setDiagnoses] = useState<CropDiagnosis[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const isFarmer = user?.role === 'farmer';

  useEffect(() => {
    async function fetchData() {
      try {
        let position;
        try {
          position = await getCurrentPosition();
        } catch (posError) {
          console.warn('Failed to get current position, using default:', posError);
          position = { coords: { latitude: 4.05, longitude: 9.71 } };
        }
        
        const [weatherData, forecastData] = await Promise.all([
          getWeatherData(position.coords.latitude, position.coords.longitude),
          getForecastData(position.coords.latitude, position.coords.longitude)
        ]);
        setWeather(weatherData);
        setForecast(forecastData);

        if (user?.id) {
          if (isFarmer) {
            const [diagnosisData, productsData] = await Promise.all([
              supabaseService.getDiagnoses(user.id),
              supabaseService.getProductsByFarmerId(user.id)
            ]);
            setDiagnoses(diagnosisData);
            setMyProducts(productsData);
          } else {
            const orders = await supabaseService.getOrders(user.id, 'buyer');
            setBuyerOrders(orders);
          }
        }
      } catch (error: any) {
        console.error('Failed to get dashboard data:', error.message || error);
        toast.error('Failed to load dashboard data');
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchData();
  }, [isFarmer, user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (!isFarmer) {
    const activeOrdersCount = buyerOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped').length;
    const totalSpent = buyerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const recentOrders = buyerOrders.slice(0, 3);

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">Marketplace Overview</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Welcome back, {user?.full_name}. Ready to source fresh produce?</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleSearch} className="relative group min-w-[280px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search marketplace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all shadow-sm"
              />
            </form>
            <Link href="/marketplace" className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              Browse Marketplace
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Active Orders', value: activeOrdersCount.toString(), icon: 'shopping_bag', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Total Orders', value: buyerOrders.length.toString(), icon: 'receipt_long', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
            { label: 'Total Spent', value: `${totalSpent.toLocaleString()} CFA`, icon: 'payments', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
            { label: 'Reward Points', value: Math.floor(totalSpent / 1000).toString(), icon: 'stars', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center`}>
                  <span className="material-symbols-outlined fill-1 text-xl sm:text-2xl">{stat.icon}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold dark:text-white">Featured Products</h3>
                <Link href="/marketplace" className="text-primary text-xs sm:text-sm font-bold hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INITIAL_PRODUCTS.slice(0, 2).map((product) => (
                  <Link key={product.id} href={`/marketplace/${product.id}`} className="group">
                      <div className="aspect-video rounded-xl overflow-hidden mb-3">
                        <ResponsiveImage 
                          src={product.image_url || ''} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          baseWidth={400}
                          baseHeight={300}
                        />
                      </div>
                    <h4 className="font-bold text-sm dark:text-white group-hover:text-primary transition-colors">{product.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.price} CFA/{product.unit}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                      <div>
                        <h4 className="font-bold text-sm dark:text-white">#ORD-{order.id.substring(0, 8)}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {order.order_items?.[0]?.products?.name} {order.order_items?.length > 1 ? `+ ${order.order_items.length - 1} more` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm dark:text-white">{order.total_amount.toLocaleString()} CFA</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No orders yet.</p>
                    <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline mt-2 inline-block">Start shopping</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="bg-primary text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 relative z-10">Market Trends</h3>
              <p className="text-xs text-white/80 mb-6 relative z-10">Cassava is in high demand this week in Douala. Prices up by 12%.</p>
              <div className="space-y-3 relative z-10">
                {['Cassava', 'Cocoa', 'Plantains'].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-bold">
                    <span>{item}</span>
                    <span className="flex items-center gap-1 text-emerald-300">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      +12%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Reorder', icon: 'reorder', path: '/orders' },
                  { label: 'Support', icon: 'support_agent', path: '/messages' },
                  { label: 'Coupons', icon: 'confirmation_number', path: '/profile' },
                  { label: 'Settings', icon: 'settings', path: '/profile' },
                ].map((action, i) => (
                  <Link key={i} href={action.path} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">{action.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider dark:text-slate-300">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recentActivities = [
    ...diagnoses.slice(0, 3).map(d => ({
      title: 'Diagnosis Completed',
      time: formatDistanceToNow(new Date(d.created_at), { addSuffix: true }),
      desc: `${d.crop_type} - ${d.result_label || d.status}. ${d.recommendation?.slice(0, 50)}...`,
      icon: 'biotech',
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
    })),
    { title: 'Market Listing Sold', time: '5 hours ago', desc: '500kg of White Cassava purchased by FreshMarket Douala.', icon: 'shopping_cart', color: 'bg-green-50 dark:bg-green-500/10 text-green-500' },
    { title: 'Weather Alert', time: '1 day ago', desc: 'Heavy tropical rain expected in Littoral. Irrigation paused.', icon: 'thunderstorm', color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">Farm Overview</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Welcome back, {user?.full_name}. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="relative group min-w-[280px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search marketplace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all shadow-sm"
            />
          </form>
          <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            Mar 11
          </button>
          <Link href="/diagnosis" className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            New Diagnosis
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Soil Moisture', value: '42%', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { 
            label: 'Crop Health', 
            value: diagnoses.length > 0 ? (diagnoses[0].status === 'healthy' ? '98%' : diagnoses[0].status === 'warning' ? '75%' : '45%') : '94%', 
            icon: 'eco', 
            color: 'text-green-500', 
            bg: 'bg-green-50 dark:bg-green-500/10',
            healthStatus: diagnoses.length > 0 ? diagnoses[0].status : 'healthy' // healthy, warning, critical
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
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            {stat.label === 'Crop Health' && (
              <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20 blur-2xl ${
                stat.healthStatus === 'healthy' ? 'bg-green-500' : 
                stat.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center relative`}>
                <span className="material-symbols-outlined fill-1 text-xl sm:text-2xl">{stat.icon}</span>
                {stat.label === 'Crop Health' && (
                  <div className={`absolute -inset-1 rounded-xl sm:rounded-2xl border-2 ${
                    stat.healthStatus === 'healthy' ? 'border-green-500/50' : 
                    stat.healthStatus === 'warning' ? 'border-yellow-500/50' : 'border-red-500/50'
                  } animate-pulse`}></div>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg ${
                stat.label === 'Crop Health' ? (
                  stat.healthStatus === 'healthy' ? 'text-green-500 bg-green-50 dark:bg-green-500/10' :
                  stat.healthStatus === 'warning' ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' :
                  'text-red-500 bg-red-50 dark:bg-red-500/10'
                ) : 'text-green-500 bg-green-50 dark:bg-green-500/10'
              }`}>
                {stat.label === 'Crop Health' ? stat.healthStatus?.toUpperCase() : '+2.4%'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-xl sm:text-2xl font-black dark:text-white">{stat.value}</p>
              {stat.label === 'Crop Health' && (
                <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" 
                      strokeDasharray={88} 
                      strokeDashoffset={88 * (1 - parseInt(stat.value) / 100)} 
                      className={
                        stat.healthStatus === 'healthy' ? 'text-green-500' : 
                        stat.healthStatus === 'warning' ? 'text-yellow-500' : 'text-red-500'
                      } 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className={`absolute text-[8px] font-black ${
                    stat.healthStatus === 'healthy' ? 'text-green-600' : 
                    stat.healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{stat.value}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold dark:text-white">Field Status Map</h3>
              <div className="flex gap-2">
                <button className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] sm:text-xs font-bold dark:text-slate-300">Satellite</button>
                <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">Heatmap</button>
              </div>
            </div>
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden relative group">
              <ResponsiveImage 
                src="https://picsum.photos/seed/farm-map/1200/800" 
                alt="Satellite view of the farm fields showing crop distribution and health zones" 
                className="w-full h-full object-cover opacity-80 dark:opacity-60"
                baseWidth={1200}
                baseHeight={800}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl shadow-sm flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] sm:text-xs font-bold dark:text-white">Live Monitoring Active</span>
              </div>
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex gap-2">
                <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-lg sm:text-xl dark:text-white">add</span>
                </button>
                <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-lg sm:text-xl dark:text-white">remove</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold dark:text-white">Past Crop Diagnoses</h3>
              <Link href="/diagnosis" className="text-primary text-xs font-bold hover:underline">New Scan</Link>
            </div>
            <div className="space-y-4">
              {(diagnoses.length > 0 ? diagnoses : SAMPLE_DIAGNOSES).slice(0, 5).map((diagnosis) => (
                <div key={diagnosis.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
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
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold dark:text-white">My Inventory</h3>
              <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline">Manage All</Link>
            </div>
            <div className="space-y-4">
              {myProducts.length > 0 ? (
                myProducts.slice(0, 5).map((product) => (
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

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">Recent Activity</h3>
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
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-background-dark text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <h3 className="text-lg sm:text-xl font-bold mb-6 relative z-10">Weather Forecast</h3>
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
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Humidity</p>
                      <p className="text-sm font-black">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-400">air</span>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Wind</p>
                      <p className="text-sm font-black">{weather.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>

                {forecast && (
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Hourly Temp (°C)</p>
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
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Daily Precipitation (mm)</p>
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
            <h3 className="text-lg sm:text-xl font-bold mb-6 dark:text-white">Crop Distribution</h3>
            <div className="space-y-4">
              {[
                { name: 'Cassava', area: '45%', color: 'bg-yellow-400' },
                { name: 'Cocoa', area: '30%', color: 'bg-green-500' },
                { name: 'Plantains', area: '25%', color: 'bg-orange-400' },
              ].map((crop, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs sm:text-sm font-bold mb-2 dark:text-slate-300">
                    <span>{crop.name}</span>
                    <span className="text-slate-400 dark:text-slate-500">{crop.area}</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${crop.color}`} style={{ width: crop.area }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
        <h2 className="text-xl font-black tracking-tight dark:text-white mb-2">AgriTech Pro</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Initializing smart farm dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <DashboardContent />
  );
}
