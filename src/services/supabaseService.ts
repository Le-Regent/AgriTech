import { supabase } from '@/lib/supabase';
import { User, Product, CropDiagnosis, Order, OrderItem, ProductReview, Message, Payment, SensorData } from '@/types';

export const supabaseService = {
  // Profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  },

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
    // First get current stock
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

  // Orders
  async createOrder(order: Partial<Order>, items: Partial<OrderItem>[]) {
    console.log('Creating order with data:', order);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
    
    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    console.log('Order created successfully:', orderData);

    const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderData.id }));
    console.log('Inserting order items:', itemsWithOrderId);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);
    
    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      throw itemsError;
    }
    return orderData;
  },

  async getOrders(userId: string, role: 'farmer' | 'buyer' = 'buyer') {
    let query = supabase.from('orders').select(`
      *,
      order_items (
        *,
        products (*)
      )
    `);
    
    if (role === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else {
      // For farmers, we want to see orders containing their products
      // This is a bit more complex in Supabase without a direct join on the top level
      // but for now we'll filter by the products they own
      query = query.eq('order_items.products.farmer_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;
    return data;
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

  // Messages
  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url), receiver:profiles!receiver_id(full_name, avatar_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async sendMessage(message: Partial<Message>) {
    const { data, error } = await supabase
      .from('messages')
      .insert([message]);
    
    if (error) throw error;
    return data;
  },

  // Payments
  async createPayment(payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment]);
    
    if (error) throw error;
    return data;
  },

  async getPaymentsByOrderId(orderId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);
    
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
  },

  // Storage
  async uploadImage(file: File, bucket: string = 'products') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
