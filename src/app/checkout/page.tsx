'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { formatUnit } from '@/lib/unitUtils';
import { convertQuantity } from '@/lib/unitUtils';

function CheckoutContent() {
  const { cart, clearCart } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zip: '',
    paymentMethod: 'card',
    cardNumber: '',
    mobileNumber: '',
    bankAccount: ''
  });

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const shipping = 0; 
  const total = subtotal + shipping;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'verifying' | 'finalizing'>('processing');

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }

    setProcessingPayment(true);
    setPaymentStatus('processing');
    
    // Simulate payment processing delay (reduced for better UX)
    await new Promise(resolve => setTimeout(resolve, 800));
    setPaymentStatus('verifying');
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isNaN(total) || total <= 0) {
      toast.error('Invalid order total. Please check your cart.');
      setProcessingPayment(false);
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Finalizing your order...');
    
    // We'll use a local variable to track if we've already finalized success/failure
    // to prevent multiple state updates if multiple interval ticks overlap
    let finalized = false;

    try {
      setPaymentStatus('finalizing');
      // 1. Prepare Order and Items
      const orderData = {
        buyer_id: user.id,
        total_amount: Number(total),
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        shipping_address: `${formData.address}, ${formData.city}, ${formData.zip}`
      };

      const orderItems = cart.map(item => {
        const baseQuantity = convertQuantity(item.quantity, item.unit, item.baseUnit);
        const pricePerBaseUnit = (item.price * item.quantity) / baseQuantity;
        
        return {
          product_id: item.id,
          quantity: Number(baseQuantity),
          price_at_purchase: Number(pricePerBaseUnit)
        };
      });

      // 2. Create Order and Items
      const order = await supabaseService.createOrder(orderData, orderItems);

      if (order) {
        // 3. Initiate Campay Payment (Only for Mobile Money)
        // If it's card or bank, we currently mock success for this demo/prototype
        // but set order to pending. Campay collect is specifically for MM.
        
        let campayReference = null;
        
        if (formData.paymentMethod === 'mobile-money') {
          setPaymentStatus('processing');
          const paymentPhone = formData.mobileNumber || user.phone_number;
          
          if (!paymentPhone) {
            throw new Error('Please provide a phone number for Mobile Money payment');
          }

          console.log('[Checkout] Initiating Campay payment for phone:', paymentPhone);
          const campayResult = await supabaseService.initiateCampayPayment(
            total, 
            paymentPhone, 
            order.id
          );
          campayReference = campayResult.reference;

          // 4. Create Payment Record (Pending)
          await supabaseService.createPayment({
            order_id: order.id,
            campay_reference: campayReference,
            amount: Number(total),
            currency: 'XAF',
            status: 'pending',
            method: formData.paymentMethod,
            created_at: new Date().toISOString()
          });
        } else {
          // For card/bank, we skip campay collect for now
          // and just record the payment attempt
          await supabaseService.createPayment({
            order_id: order.id,
            amount: Number(total),
            currency: 'XAF',
            status: 'pending',
            method: formData.paymentMethod,
            created_at: new Date().toISOString()
          });
          
          // Fast exit for non-MM since we don't have a checkStatus for them yet
          setPaymentStatus('finalizing');
          await new Promise(resolve => setTimeout(resolve, 1000));
          clearCart();
          toast.success('Order placed successfully!', { id: loadingToast });
          setOrderSuccess(order.id);
          setProcessingPayment(false);
          setLoading(false);
          return;
        }

        // 5. Update Product Stock
        await Promise.all(cart.map(item => {
          const baseQuantity = convertQuantity(item.quantity, item.unit, item.baseUnit);
          return supabaseService.updateProductStock(item.id, baseQuantity)
            .catch(err => console.error(`Failed to update stock:`, err));
        }));

        // 6. Polling for status
        if (campayReference) {
          let pollCount = 0;
          const maxPolls = 15; // 15 * 3s = 45s
          
          const pollInterval = setInterval(async () => {
            if (finalized) {
              clearInterval(pollInterval);
              return;
            }

            pollCount++;
            setPaymentStatus('verifying');
            
            try {
              console.log(`[Checkout] Polling status (${pollCount}/${maxPolls}) for ref: ${campayReference}`);
              const statusResult = await supabaseService.checkCampayStatus(campayReference);
              const status = statusResult.status?.toUpperCase();

              console.log(`[Checkout] Status result:`, status);

              if (status === 'SUCCESSFUL') {
                finalized = true;
                clearInterval(pollInterval);
                setPaymentStatus('finalizing');
                clearCart();
                toast.success('Order placed successfully!', { id: loadingToast });
                setOrderSuccess(order.id);
                setProcessingPayment(false);
                setLoading(false);
              } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
                finalized = true;
                clearInterval(pollInterval);
                toast.error(`Payment ${status.toLowerCase()}. Please try again.`, { id: loadingToast });
                setProcessingPayment(false);
                setLoading(false);
              } else if (pollCount >= maxPolls) {
                finalized = true;
                clearInterval(pollInterval);
                // Webhook might still pick it up if it was a timeout
                // For better UX in a demo, we treat as pending success
                clearCart();
                setOrderSuccess(order.id);
                setProcessingPayment(false);
                setLoading(false);
                toast.success('Order received and is pending verification.', { id: loadingToast });
              }
            } catch (e) {
              console.error('[Checkout] Polling error:', e);
              // We don't stop the interval on random network errors, just keep trying
            }
          }, 3000);
        }

      } else {
        throw new Error('Order creation returned no data');
      }
    } catch (error: any) {
      finalized = true;
      console.error('[Checkout] Checkout failed detailed error:', error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred');
      toast.error(`Checkout failed: ${errorMessage}. Please try again.`, { id: loadingToast });
      setProcessingPayment(false);
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
        >
          <span className="material-symbols-outlined text-5xl">check_circle</span>
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black dark:text-white">Order Confirmed!</h2>
          <p className="text-slate-500 dark:text-slate-400">Thank you for your purchase. Your order #ORD-{orderSuccess.substring(0, 8)} is being processed.</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-left space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Status</span>
            <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Pending Approval</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Estimated Delivery</span>
            <span className="text-sm font-bold dark:text-white">2-3 Business Days</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/orders" className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20">
            View My Orders
          </Link>
          <Link href="/marketplace" className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-8 py-4 rounded-2xl font-black dark:text-white">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (processingPayment) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">
              {formData.paymentMethod === 'card' ? 'credit_card' : formData.paymentMethod === 'mobile-money' ? 'smartphone' : 'account_balance'}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black dark:text-white">
            {paymentStatus === 'processing' ? 'Processing Payment' : paymentStatus === 'verifying' ? 'Verifying Transaction' : 'Finalizing Order'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {paymentStatus === 'processing' && formData.paymentMethod === 'mobile-money' 
              ? 'Please check your phone for the Mobile Money prompt...' 
              : paymentStatus === 'verifying' 
                ? 'Confirming payment with the provider...'
                : 'Securing your items and creating your order...'}
          </p>
        </div>
        <div className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Amount to Pay</span>
            <span className="text-lg font-black text-primary">{total.toLocaleString()} CFA</span>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
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
            { step: 2, label: 'Method' },
            { step: 3, label: 'Details' },
            { step: 4, label: 'Review' }
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
                    { id: 'mobile-money', label: 'Mobile Money (MTN/Orange)', icon: 'smartphone' },
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
                        <div className="text-left">
                          <span className={`font-bold block ${formData.paymentMethod === method.id ? 'text-primary' : 'dark:text-white'}`}>
                            {method.label}
                          </span>
                          {method.id === 'mobile-money' && (
                            <span className="text-[10px] text-slate-400 font-medium tracking-tight">KamerFresh Secured Checkout</span>
                          )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.paymentMethod === method.id ? 'border-primary' : 'border-slate-200'
                      }`}>
                        {formData.paymentMethod === method.id && <div className="w-3 h-3 bg-primary rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === 'mobile-money' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-2xl"
                  >
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-yellow-600 text-lg">info</span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wider">Sandbox Test Instructions</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-500/80 leading-relaxed">
                          For testing purposes, you can use these numbers (Max 25 XAF): <br />
                          • <strong>237677777777</strong> (MTN Success) <br />
                          • <strong>237699999999</strong> (Orange Success)
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="flex justify-between pt-4">
                  <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                  <button 
                    onClick={handleNext}
                    className="bg-primary text-white px-12 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Continue to Details
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
                <h3 className="text-2xl font-black dark:text-white">
                  {formData.paymentMethod === 'card' ? 'Card Details' : formData.paymentMethod === 'mobile-money' ? 'Mobile Number' : 'Bank Details'}
                </h3>
                <div className="space-y-4">
                  {formData.paymentMethod === 'card' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Number</label>
                        <input 
                          type="text" 
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                          placeholder="0000 0000 0000 0000"
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry</label>
                          <input type="text" placeholder="MM/YY" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CVV</label>
                          <input type="text" placeholder="123" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" />
                        </div>
                      </div>
                    </>
                  )}
                  {formData.paymentMethod === 'mobile-money' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                        placeholder="e.g. 677000000 or 2376..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">Enter your 9-digit mobile number or include country code.</p>
                    </div>
                  )}
                  {formData.paymentMethod === 'bank' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Number</label>
                      <input 
                        type="text" 
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                        placeholder="Enter your account number"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={handleBack} className="text-slate-400 font-bold hover:text-slate-600">Back</button>
                  <button 
                    onClick={handleNext}
                    className="bg-primary text-white px-12 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Continue to Review
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
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
                      <p className="text-sm font-bold dark:text-white uppercase">{formData.paymentMethod.replace('-', ' ')}</p>
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
                              <p className="text-xs text-slate-400">Qty: {item.quantity} {formatUnit(item.unit)}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black dark:text-white">{(item.price * item.quantity).toLocaleString()} CFA</p>
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
                        Place Order - {total.toLocaleString()} CFA
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
              <span className="font-bold dark:text-white">{subtotal.toLocaleString()} CFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shipping</span>
              <span className="font-bold dark:text-white">{shipping.toLocaleString()} CFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-bold dark:text-white">0 CFA</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-3xl font-black text-primary">{total.toLocaleString()} CFA</span>
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
