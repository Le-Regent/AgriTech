'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { supabaseService } from '@/services/supabaseService';
import { Product } from '@/types';
import ProductModal from '@/components/ProductModal';
import ProductCard from '@/components/marketplace/ProductCard';
import ResponsiveImage from '@/components/ResponsiveImage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { toast } from 'sonner';

function ListingsContent() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await supabaseService.getProducts();
      // Filter products by farmer_id
      const farmerProducts = data.filter((p: any) => p.farmer_id === user.id);
      setProducts(farmerProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        await supabaseService.updateProduct(editingProduct.id, productData);
      } else {
        await supabaseService.createProduct({
          ...productData,
          farmer_id: user?.id,
          is_verified: true, // Auto-verify for now
          created_at: new Date().toISOString()
        });
      }
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight dark:text-white">My Listings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your farm&apos;s products on the marketplace.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 h-64 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              layout
              key={product.id}
            >
              <ProductCard product={product}>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="w-10 h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </ProductCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-4xl">potted_plant</span>
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">Start Selling</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            List your high-quality produce on the AgriTech Pro marketplace and connect with thousands of buyers worldwide.
          </p>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
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
    </div>
  );
}

export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <ListingsContent />
    </ProtectedRoute>
  );
}
