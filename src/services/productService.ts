import { supabase } from '@/lib/supabase';
import { Product, CropDiagnosis, ProductReview, SensorData } from '@/types';

export const productService = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)');
    
    if (error) throw error;
    return data;
  },

  async getProductsByFarmerId(farmerId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)')
      .eq('farmer_id', farmerId);
    
    if (error) throw error;
    return data;
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProduct(product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product]);
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateProductStock(id: string, quantity: number) {
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStock = Math.max(0, data.stock_quantity - quantity);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', id);
    
    if (updateError) throw updateError;
    return newStock;
  },

  // Diagnoses
  async getDiagnoses(farmerId: string) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createDiagnosis(diagnosis: Partial<CropDiagnosis>) {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert([diagnosis]);
    
    if (error) throw error;
    return data;
  },

  // Reviews
  async getProductReviews(productId: string) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createReview(review: Partial<ProductReview>) {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([review]);
    
    if (error) throw error;
    return data;
  },

  // Sensor Data
  async getSensorData(farmerId: string, limit = 50) {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  subscribeToSensorData(farmerId: string, callback: (payload: any) => void) {
    return supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `farmer_id=eq.${farmerId}`,
        },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
