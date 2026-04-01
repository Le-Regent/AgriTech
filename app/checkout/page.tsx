'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '../../src/context/CartContext';
import { useUser } from '../../src/context/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResponsiveImage from '../../src/components/ResponsiveImage';
import { motion, AnimatePresence } from 'motion/react';

function CheckoutContent() {
  const { cart, clearCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zip: '',
    paymentMethod: 'card'
  });

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const shipping = 15.00;
  const total = subtotal + shipping;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handlePlaceOrder = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    clearCart();
    router.push('/orders?success=true');
  };

  if (cart.length === 0 && step < 3) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <span className="material-symbols-outlined text-6xl text-slate-200">shopping_cart_off</span>
        <h2 className="text-3xl font-black dark:text-white">Your cart is empty</h2>
        <p className="text-slate-500 dark:text-slate-400">Add some fresh produce to your cart before checking out.</p>
        <Link href="/marketplace" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20">
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-between px-4">
          {[
            { step: 1, label: 'Shipping' },
            { step: 2, label: 'Payment' },
            { step: 3, label: 'Review' }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
                step >= s.step ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {step > s.step ? <span className="material-symbols-outlined text-sm">check</span> : s.step}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step >= s.step ? 'text-primary' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-black dark:text-white">Shipping Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.full_name}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Street address, apartment, etc."
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ZIP Code</label>
                    <input 
                      type="text" 
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleNext}
                    disabled={!formData.address || !formData.city || !formData.zip}
                    className="bg-primary text-white px-12 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-black dark:text-white">Payment Method</h3>
                <div className="space-y-4">
                  {[
                    { id: 'card', label: 'Credit / Debit Card', icon: 'credit_card' },
                    { id: 'm-pesa', label: 'Mobile Money (M-Pesa)', icon: 'smartphone' },
                    { id: 'bank', label: 'Bank Transfer', icon: 'account_balance' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setFormData({...formData, paymentMethod: method.id})}
                      className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${
                        formData.paymentMethod === method.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined text-2xl ${formData.paymentMethod === method.id ? 'text-primary' : 'text-slate-400'}`}>
                          {method.icon}
                        </span>
                        <span className={`font-bold ${formData.paymentMethod === method.id ? 'text-primary' : 'dark:text-white'}`}>
                          {method.label}
                        </span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.paymentMethod === method.id ? 'border-primary' : 'border-slate-200'
                      }`}>
                        {formData.paymentMethod === method.id && <div className="w-3 h-3 bg-primary rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                  <button 
                    onClick={handleNext}
                    className="bg-primary text-white px-12 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-black dark:text-white">Review Your Order</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping To</p>
                      <p className="text-sm font-bold dark:text-white">{user?.full_name}</p>
                      <p className="text-sm text-slate-500">{formData.address}, {formData.city}, {formData.zip}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
                      <p className="text-sm font-bold dark:text-white uppercase">{formData.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Items</p>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden">
                              <ResponsiveImage src={item.image} alt={item.name} baseWidth={100} baseHeight={100} />
                            </div>
                            <div>
                              <p className="text-sm font-bold dark:text-white">{item.name}</p>
                              <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-8">
                  <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="bg-primary text-white px-12 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined">verified</span>
                        Place Order - ${total.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors sticky top-28">
          <h4 className="font-black text-lg mb-6 dark:text-white">Order Summary</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shipping</span>
              <span className="font-bold dark:text-white">${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-bold dark:text-white">$0.00</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
