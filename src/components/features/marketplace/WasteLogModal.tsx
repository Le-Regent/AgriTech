'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { toast } from 'sonner';

interface WasteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function WasteLogModal({ isOpen, onClose, product, onSuccess }: WasteLogModalProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('expired');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (Number(quantity) > (product.stock_quantity || 0)) {
        toast.error('Waste quantity cannot exceed current stock');
        return;
    }

    setLoading(true);
    try {
      const estimatedLoss = Number(quantity) * product.price;
      
      await supabaseService.createWasteLog({
        farmer_id: product.farmer_id,
        product_name: product.name,
        category: product.category,
        quantity_wasted: Number(quantity),
        estimated_loss: estimatedLoss,
        reason: reason,
        expiry_date: product.expiry_date,
        created_at: new Date().toISOString()
      });

      // Also update the product stock
      await supabaseService.updateProductStock(product.id, Number(quantity));

      toast.success(`Logged ${quantity} ${product.unit} of ${product.name} as waste.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to log waste:', error);
      toast.error(error.message || 'Failed to log waste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined">delete_sweep</span>
                </div>
                <div>
                  <h3 className="text-xl font-black dark:text-white uppercase">Log Waste</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity Wasted ({product.unit})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Max: ${product.stock_quantity}`}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Waste</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-red-500/20 outline-none"
                >
                  <option value="expired">Expired / Spoiled</option>
                  <option value="damaged">Damaged during storage</option>
                  <option value="pests">Pest infestation</option>
                  <option value="market">Market surplus / No buyer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  This will deduct stock from your listing
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Logging...' : 'Confirm Waste Log'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
