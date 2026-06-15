import { supabase } from '@/lib/supabase';
import { Product, CropDiagnosis, ProductReview, SensorData } from '@/types';

export const productService = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)');
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getProductsByFarmerId(farmerId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)')
      .eq('farmer_id', farmerId);
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(full_name, avatar_url, is_verified)')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async createProduct(product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product]);
    
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  async updateProductStock(id: string, quantity: number) {
    // First get current stock and other info
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity, initial_stock_quantity, farmer_id, name')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error(fetchError.message);
    
    const oldStock = data.stock_quantity;
    const initialStock = data.initial_stock_quantity || oldStock;
    const newStock = Math.max(0, oldStock - quantity);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', id);
    
    if (updateError) throw new Error(updateError.message);

    // Check for low stock threshold (25%)
    const threshold = initialStock * 0.25;
    if (newStock < threshold && oldStock >= threshold && initialStock > 0) {
      try {
        // Since productService doesn't have createNotification directly, 
        // in a real app these services would be merged or one would call the other.
        // For consistency in this specific applet environment, we'll implement it here too
        // but ideally we should consolidate these services.
        await supabase
          .from('notifications')
          .insert([{
            user_id: data.farmer_id,
            title: 'Low Stock Alert ⚠️',
            message: `Your product "${data.name}" has dropped below 25% stock (${newStock} remaining). Consider restocking soon!`,
            type: 'system',
            link: '/listings',
            is_read: false,
            created_at: new Date().toISOString()
          }]);
      } catch (notifyError) {
        console.error('Failed to send low stock notification in productService:', notifyError);
      }
    }

    return newStock;
  },

  // Diagnoses
  async getDiagnoses(farmerId: string) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async createDiagnosis(diagnosis: Partial<CropDiagnosis>) {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert([diagnosis]);
    
    if (error) throw new Error(error.message);
    return data;
  },

  // Reviews
  async getProductReviews(productId: string) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async createReview(review: Partial<ProductReview>) {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([review]);
    
    if (error) throw new Error(error.message);
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
    
    if (error) throw new Error(error.message);
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
