'use client';

import React, { useState, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { Product } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Eye, 
  MoreVertical,
  Layers,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Tag
} from 'lucide-react';

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await supabaseService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleVerification = async (productId: string, currentStatus: boolean) => {
    setUpdatingId(productId);
    try {
      await supabaseService.updateProduct(productId, { is_verified: !currentStatus });
      setProducts(products.map(p => p.id === productId ? { ...p, is_verified: !currentStatus } : p));
    } catch (error) {
      console.error('Error updating verification:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) return;
    try {
      await supabaseService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesVerification = verificationFilter === 'all' || 
                               (verificationFilter === 'verified' && p.is_verified) ||
                               (verificationFilter === 'unverified' && !p.is_verified);
    return matchesSearch && matchesCategory && matchesVerification;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));
  const unverifiedCount = products.filter(p => !p.is_verified).length;
  const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);

  const stats = [
    { label: 'Total Listings', value: products.length, icon: Layers, color: 'text-blue-600 bg-blue-100' },
    { label: 'Unverified', value: unverifiedCount, icon: AlertCircle, color: 'text-amber-600 bg-amber-100' },
    { label: 'Total Inventory', value: totalStock, icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Categories', value: categories.length, icon: Tag, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Product Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Moderation & Quality Assurance Center</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search products or farmers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64 md:w-80 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 animate-pulse">
               <div className="h-20" />
             </div>
          ))
        ) : (
          stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.color} dark:bg-opacity-20`}>
                  <stat.icon size={18} />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-white/5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filters</span>
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none"
          >
            <option value="all">Every Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none"
          >
            <option value="all">Validation: All</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Needs Review</option>
          </select>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Produce Listing</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price & Stock</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Oversight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-8 py-6">
                      <div className="h-12 bg-slate-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Search size={48} className="opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">No listings match your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/10 shrink-0">
                          <img 
                            src={product.image_url || `https://picsum.photos/seed/${product.id}/64/64`} 
                            alt={product.name} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                            by <span className="text-slate-600 dark:text-slate-300">{product.profiles?.full_name || 'Anonymous Farmer'}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{product.price.toLocaleString()} CFA</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {product.stock_quantity} {product.unit}s available
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {product.is_verified ? (
                          <div className="flex items-center gap-1.5 text-green-500">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Vetting</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right transition-all">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                        <button 
                          onClick={() => handleToggleVerification(product.id, product.is_verified)}
                          disabled={updatingId === product.id}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            product.is_verified 
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                              : 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          } disabled:opacity-50`}
                          title={product.is_verified ? 'Unverify Listing' : 'Approve & Verify'}
                        >
                          {updatingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                             <CheckCircle size={20} />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                          title="Delete Listing"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
