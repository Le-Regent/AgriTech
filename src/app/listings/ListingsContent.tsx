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
import { toast } from 'sonner';
import { Plus, BarChart2, Edit, Trash2, Sprout } from 'lucide-react';

export default function ListingsContent() {
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
      const { profiles, id, ...cleanData } = productData as any;
      
      if (editingProduct) {
        await supabaseService.updateProduct(editingProduct.id, cleanData);
        toast.success('Product updated successfully');
      } else {
        await supabaseService.createProduct({
          ...cleanData,
          farmer_id: user?.id,
          is_verified: true,
          created_at: new Date().toISOString()
        });
        toast.success('Product created successfully');
      }
      fetchProducts();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save product:', error);
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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight dark:text-white">My Listings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your farm&apos;s products on the marketplace.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-muted-dark h-64 rounded-[2.5rem] border border-slate-100 dark:border-border-dark animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
            >
              <ProductCard 
                product={product}
                onClick={() => openEditModal(product)}
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <Link
                    href={`/listings/${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 bg-white/90 dark:bg-surface-dark/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-blue-500 transition-colors"
                  >
                    <BarChart2 size={20} />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(product);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-surface-dark/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    className="w-10 h-10 bg-white/90 dark:bg-surface-dark/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </ProductCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <Sprout size={40} />
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">Start Selling</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            List your high-quality produce on the AgriTech Pro marketplace and connect with thousands of buyers worldwide.
          </p>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Create Your First Listing
          </button>
        </div>
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
    </>
  );
}
