import { useState, useCallback } from 'react';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useProducts() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFarmerProducts = useCallback(async (farmerId: string) => {
    setLoading(true);
    try {
      const data = await productService.getProductsByFarmerId(farmerId);
      setProducts(data);
    } catch (error: any) {
      console.error('Failed to fetch farmer products:', error);
      toast.error(error.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (product: Partial<Product>) => {
    setLoading(true);
    try {
      await productService.createProduct(product);
      toast.success('Product listed successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error.message || 'Failed to list product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    setLoading(true);
    try {
      await productService.updateProduct(id, product);
      toast.success('Product updated successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.message || 'Failed to update product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    // Note: In a real app, you should use a custom modal for confirmation.
    // confirm() is disabled in this environment.
    setLoading(true);
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error(error.message || 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    products,
    fetchProducts,
    fetchFarmerProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
}
