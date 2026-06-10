'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import ResponsiveImage from '@/components/ui/ResponsiveImage';

import { Product } from '@/types';

interface BuyerDashboardViewProps {
  user: any;
  t: (key: string) => string;
  language: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  liveMarketBenchmarks: React.ReactNode;
  quickActionsHub: React.ReactNode;
  stats: any[];
  featuredProducts: Product[];
  sellerOrders: any[];
  notifications: any[];
  escrowSecurityCard: React.ReactNode;
}

export default function BuyerDashboardView({
  user,
  t,
  language,
  searchTerm,
  setSearchTerm,
  handleSearch,
  liveMarketBenchmarks,
  quickActionsHub,
  stats,
  featuredProducts,
  sellerOrders,
  notifications,
  escrowSecurityCard,
}: BuyerDashboardViewProps) {
  
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 text-left"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white uppercase italic">
            Kamer<span className="text-primary tracking-normal">Fresh</span>
          </h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Fresh produce from Cameroon&apos;s finest farms.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-slate sm:items-center gap-3">
          <form onSubmit={handleSearch} className="relative group min-w-[240px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder={t('search')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:text-white" 
            />
          </form>
        </div>
      </motion.div>

      {/* Cameroon Live Market Price Benchmarks Board */}
      {liveMarketBenchmarks}

      {/* Quick Click-to-Search Category Chips */}
      <motion.div 
        variants={itemVariants}
        className="space-y-2.5"
      >
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-primary animate-pulse">local_mall</span>
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
            <Link
              key={chip.value}
              href={`/marketplace?category=${encodeURIComponent(chip.value)}`}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-bold border border-slate-100 dark:border-white/5 shadow-xs shrink-0 transition-transform active:scale-95 duration-200 cursor-pointer text-center"
            >
              {chip.label}
            </Link>
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
            className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary font-bold">hub</span>
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
                <Link
                  key={hub.name}
                  href={`/marketplace?search=${encodeURIComponent(hub.term)}`}
                  className={`p-3 border rounded-2xl transition-all duration-200 group active:scale-[0.98] relative overflow-hidden backdrop-blur-sm cursor-pointer ${hub.color} block`}
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
                </Link>
              ))}
            </div>
          </motion.div>

          <section className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">local_fire_department</span> {t('featured_products')}
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
                        <p className="text-[11px] sm:text-sm font-black text-primary leading-none">{product.price.toLocaleString()} FCFA</p>
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

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
            <h3 className="text-xl font-bold mb-8 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary font-bold">receipt_long</span> {t('recent_orders')}
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
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                        {formatDistanceToNow(new Date(order.created_at || new Date()), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm dark:text-white mb-1">{(order.total_amount || 0).toLocaleString()} FCFA</p>
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
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group text-left">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-white/50">trending_up</span> 
              {t('market_trends')}
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
            
            <Link href="/marketplace" className="mt-8 w-full bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 relative z-10 font-bold hover:bg-slate-100">
              {t('view_details')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Escrow Protective Shield */}
          {escrowSecurityCard}
        </div>
      </div>
    </motion.div>
  );
}
