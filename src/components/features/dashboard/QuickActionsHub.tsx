'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface QuickActionsHubProps {
  user: any;
  isFarmer: boolean;
  t: (key: string) => string;
  cartLength: number;
  myProductsLength: number;
  dataLoading: boolean;
}

export default function QuickActionsHub({
  user,
  isFarmer,
  t,
  cartLength,
  myProductsLength,
  dataLoading,
}: QuickActionsHubProps) {
  const router = useRouter();

  return (
    <div id="quick-actions-hub" className="w-full mb-8">
      <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 text-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-800/80 shadow-xl overflow-hidden relative">
        {/* Animated fluid decorative background blobs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-10000" />
        <div className="absolute left-1/4 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Inner Card Content: Responsive multi-layout grid */}
        <div className="p-6 sm:p-8 lg:p-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Section 1: Dynamic Personalized Welcome Header */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Top line with Active Status Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border border-white/5">
                  <span className="material-symbols-outlined text-[13px]">assignment_ind</span>
                  {isFarmer ? 'Active: Farmer / Producteur' : 'Active: Buyer / Acheteur'}
                </div>
              </div>

              {/* Dynamic Welcome Heading with User Name */}
              <div className="space-y-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Hello, {user?.full_name ? user.full_name.split(' ')[0] : (isFarmer ? 'Farmer' : 'Buyer')}! ✨
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
                  {isFarmer 
                    ? t('farmer_onboarding_desc')
                    : t('buyer_onboarding_desc')}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for both roles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              {isFarmer ? (
                <>
                  {/* Action 1: Diagnosis */}
                  <button 
                    onClick={() => router.push('/diagnosis')}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99] cursor-pointer"
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
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-orange-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99] cursor-pointer"
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
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-indigo-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99] cursor-pointer"
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
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-purple-500/40 rounded-2xl shadow-sm transition-all duration-200 group text-left min-h-[48px] active:scale-[0.99] cursor-pointer"
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

          {/* Section 2: Interactive Role Status Sidebar Card */}
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
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-medium">
                      {t('my_store_desc') || "Check pricing benchmarks or list new items for escrow purchase instantly."}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t('active_catalog') || 'My Listings'}</span>
                      <span className="font-extrabold text-primary">
                        {dataLoading ? "..." : myProductsLength} {t('listings') || 'Listings'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/farmer/${user?.id || 'profile'}`)}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 bg-primary hover:bg-primary/95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
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
                    {cartLength > 0 && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                        {cartLength} item{cartLength !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight leading-snug">
                      {t('my_basket_title') || 'Fresh Local Shopping'}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-medium">
                      {t('my_basket_desc') || "Track item transit or continue to checkout with your active cooperative basket."}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t('checkout_ready') || 'Basket Status'}</span>
                      <span className="font-extrabold text-primary">
                        {cartLength > 0 ? (t('ready_now') || 'Ready now') : 'Empty'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/cart')}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 bg-primary hover:bg-primary/95 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  {t('checkout_cart_btn') || 'Go to Basket'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
