'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';
import { formatUnit } from '@/lib/unitUtils';

function CartContent() {
  const { cart, removeFromCart, clearCart, totalItems, updateQuantity } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
          <span className="material-symbols-outlined text-4xl text-slate-400">shopping_cart</span>
        </div>
        <h2 className="text-3xl font-black dark:text-white">Your cart is empty</h2>
        <p className="text-slate-500 dark:text-slate-400">Looks like you haven&apos;t added any fresh produce yet.</p>
        <Link href="/marketplace" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black dark:text-white flex items-center gap-3">
            Shopping Cart
            <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{totalItems} items</span>
          </h2>
          <Link href="/marketplace" className="text-xs font-bold text-slate-400 hover:text-primary flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Continue Shopping
          </Link>
        </div>
        <button 
          onClick={clearCart}
          className="text-slate-400 hover:text-red-500 font-bold text-sm flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 sm:gap-6 transition-colors"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0">
                  <ResponsiveImage 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    baseWidth={200}
                    baseHeight={200}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-base sm:text-lg dark:text-white truncate">{item.name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.price.toLocaleString()} CFA / {formatUnit(item.unit)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.unit)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.unit)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="font-black text-sm w-8 text-center dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.unit)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white">{(item.price * item.quantity).toLocaleString()} CFA</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-colors sticky top-28">
            <h3 className="font-black text-xl mb-6 dark:text-white">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-bold">
                <span>Subtotal</span>
                <span>{totalPrice.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-bold">
                <span>Shipping</span>
                <span className="text-green-500">Free</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-bold">
                <span>Tax</span>
                <span>0 CFA</span>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                <span className="font-black text-lg dark:text-white">Total</span>
                <span className="font-black text-3xl text-primary">{totalPrice.toLocaleString()} CFA</span>
              </div>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Secure Checkout Powered by AgriTech Pay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}
