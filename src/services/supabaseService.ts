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
    
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(userId: string, profile: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId);
    
    if (error) throw new Error(error.message);
    return data;
  },

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
    // Crosses threshold check: was above or equal, now below
    const threshold = initialStock * 0.25;
    if (newStock < threshold && oldStock >= threshold && initialStock > 0) {
      try {
        await this.createNotification({
          user_id: data.farmer_id,
          title: 'Low Stock Alert ⚠️',
          message: `Your product "${data.name}" has dropped below 25% stock (${newStock} remaining). Consider restocking soon!`,
          type: 'system',
          link: '/listings'
        });
      } catch (notifyError) {
        console.error('Failed to send low stock notification:', notifyError);
      }
    }

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
      throw new Error(orderError.message);
    }

    console.log('Order created successfully:', orderData);

    const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderData.id }));
    console.log('Inserting order items:', itemsWithOrderId);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);
    
    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      throw new Error(itemsError.message);
    }

    // Notify sellers
    try {
      const productIds = items.map(item => item.product_id).filter(Boolean);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('farmer_id')
        .in('id', productIds);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        const uniqueFarmerIds = Array.from(new Set(products.map(p => p.farmer_id).filter(Boolean)));
        console.log('Notifying farmers:', uniqueFarmerIds);
        
        await Promise.all(uniqueFarmerIds.map(farmerId => 
          supabaseService.createNotification({
            user_id: farmerId,
            title: 'New Order Received',
            message: `You have a new order for your products. Order ID: ${orderData.id.slice(0, 8)}`,
            type: 'order',
            link: '/orders'
          })
        ));
      }
    } catch (notifyError: any) {
      console.error('Failed to notify sellers. Error details:', {
        message: notifyError?.message,
        details: notifyError?.details,
        hint: notifyError?.hint,
        code: notifyError?.code,
        fullError: notifyError
      });
    }

    return orderData;
  },

  async getOrders(userId: string, role: 'farmer' | 'buyer' = 'buyer') {
    if (role === 'buyer') {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*, profiles:farmer_id(*))
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    } else {
      // For farmers, we fetch order items for their products first
      // We use !inner to ensure we only get items where the products match the farmer_id
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (*, buyer:profiles!buyer_id(full_name, avatar_url, email)),
          products!inner (*)
        `)
        .eq('products.farmer_id', userId);
      
      if (itemsError) throw new Error(itemsError.message);

      // Group items by order
      const ordersMap = new Map();
      items.forEach((item: any) => {
        if (!item.orders) return;
        if (!ordersMap.has(item.order_id)) {
          ordersMap.set(item.order_id, {
            ...item.orders,
            profiles: item.orders.buyer, // Map buyer profile to profiles for consistency with dashboard UI
            order_items: []
          });
        }
        ordersMap.get(item.order_id).order_items.push({
          ...item,
          orders: undefined // Remove circular ref
        });
      });

      return Array.from(ordersMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw new Error(error.message);
    return data;
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

  async getProductSales(productId: string) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders(id, buyer_id, status, total_amount, created_at, profiles:buyer_id(full_name, email))')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  },

  // Messages
  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url), receiver:profiles!receiver_id(full_name, avatar_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async sendMessage(message: Partial<Message>) {
    const { data, error } = await supabase
      .from('messages')
      .insert([message]);
    
    if (error) throw new Error(error.message);
    return data;
  },

  // Payments
  async createPayment(payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment]);
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getPaymentsByOrderId(orderId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId);
    
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
  },

  // Storage
  async uploadImage(file: File, bucket: string = 'products') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Notifications
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.code === 'PGRST116' || error.message?.includes('notifications\' not found') || error.message?.includes('schema cache')) {
        console.warn('Notifications table not found in Supabase schema.');
        return [];
      }
      throw new Error(error.message);
    }
    return data;
  },

  async createNotification(notification: any) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification]);
    
    if (error) throw new Error(error.message);
    return data;
  },

  async markNotificationAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
};
