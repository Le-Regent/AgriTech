'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { useOffline } from '@/context/OfflineContext';
import { supabaseService } from '@/services/supabaseService';
import { Product } from '@/types';
import ProductModal from '@/components/features/marketplace/ProductModal';
import ProductCard from '@/components/features/marketplace/ProductCard';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { toast } from 'sonner';

function ListingsContent() {
  const { user } = useUser();
  const { isOnline, saveToCache, getFromCache } = useOffline();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const productsRef = useRef<Product[]>(products);
  useEffect(() => { productsRef.current = products; }, [products]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    
    // 1. Try to load from cache immediately
    const cachedProducts = await getFromCache(`farmer_listings_${user.id}`);
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (isOnline) {
        const data = await supabaseService.getProductsByFarmerId(user.id);
        if (data) {
          setProducts(data);
          saveToCache(`farmer_listings_${user.id}`, data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, getFromCache, saveToCache]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      // Strip fields that are not in the products table
      const { profiles, id, ...cleanData } = productData as any;
      
      if (editingProduct) {
        await supabaseService.updateProduct(editingProduct.id, cleanData);
        toast.success('Product updated successfully');
      } else {
        await supabaseService.createProduct({
          ...cleanData,
          farmer_id: user?.id,
          is_verified: true, // Auto-verify for now
          created_at: new Date().toISOString()
        });
        toast.success('Product created successfully');
      }
      fetchProducts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      // Better error reporting
      const errorMessage = error.message || error.details || 'Unknown error';
      toast.error(`Failed to save product: ${errorMessage}`);
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await supabaseService.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const openAddModal = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
      className="space-y-4 sm:space-y-8"
    >
      <motion.div 
        variants={itemVariants}
        className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl -mx-4 px-4 py-4 border-b border-slate-100 dark:border-white/5 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">My Listings</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your farm&apos;s products on the marketplace.</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 sm:w-auto"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Product
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              className="bg-white dark:bg-slate-900 h-[400px] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-pulse" 
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8"
        >
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <ProductCard 
                product={product}
                onClick={() => openEditModal(product)}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <Link
                    href={`/listings/${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-blue-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">insights</span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(product);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </ProductCard>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center space-y-6"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined text-5xl">potted_plant</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black dark:text-white">Start Selling</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-bold text-xs uppercase tracking-widest leading-relaxed">
              List your high-quality produce on the marketplace and connect with thousands of buyers worldwide.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Your First Listing
          </button>
        </motion.div>
      )}

      {user && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          initialData={editingProduct}
          farmerId={user.id}
        />
      )}
    </motion.div>
  );
}

export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <ListingsContent />
    </ProtectedRoute>
  );
}
