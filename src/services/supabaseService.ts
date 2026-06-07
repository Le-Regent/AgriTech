import { supabase } from '@/lib/supabase';
import { User, Product, CropDiagnosis, Order, OrderItem, ProductReview, Message, Payment, SensorData, AppNotification, NotificationCategory } from '@/types';

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

  async createProfile(profile: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
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
      .insert([product])
      .select()
      .single();
    
    if (error) throw new Error(error.message);

    // Broadcast notification to buyers
    try {
      await this.broadcastNotification({
        title: 'New Produce Available! 🥦',
        message: `A new batch of ${data.name} has just been listed in ${data.location || 'your area'}.`,
        type: 'market',
        category: 'market',
        link: `/marketplace/${data.id}`
      }, 'buyer');
    } catch (notifyError) {
      console.error('Failed to broadcast new product notification:', notifyError);
    }

    return data;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    // Get existing product to compare price
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error(fetchError.message);

    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);

    // Price Trend Notification
    if (product.price && product.price < existing.price) {
      const dropPercentage = Math.round(((existing.price - product.price) / existing.price) * 100);
      if (dropPercentage >= 5) { // Only notify for 5% or more drop
        try {
          await this.broadcastNotification({
            title: '🔥 Price Drop Alert!',
            message: `The price of ${data.name} just dropped by ${dropPercentage}%! Now only ${data.price.toLocaleString()} CFA.`,
            type: 'market',
            category: 'market',
            link: `/marketplace/${data.id}`
          }, 'buyer');
        } catch (notifyError) {
          console.error('Failed to broadcast price drop notification:', notifyError);
        }
      }
    }

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

  async getOrders(userId: string, user_type: 'farmer' | 'buyer' = 'buyer') {
    if (user_type === 'buyer') {
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
    const updateData: any = { status };
    
    // Auto-populate tracking timestamps
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
      updateData.estimated_delivery_date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // +2 days
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data: orderData, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*, order_items(products(farmer_id, name))')
      .single();
    
    if (updateError) throw new Error(updateError.message);

    // Get the first farmer from the order items to act as a point of contact if needed
    // or just send as a system notification
    const farmerId = orderData.order_items?.[0]?.products?.farmer_id;
    const productName = orderData.order_items?.[0]?.products?.name || 'Produce';
    const shortId = orderId.slice(0, 8).toUpperCase();

    // 1. Create In-App Notification
    try {
      let title = 'Order Update';
      let message = `Order #${shortId} status changed to ${status}`;
      
      switch (status) {
        case 'processing':
          title = 'Order Processing 🚜';
          message = `Great news! Your order #${shortId} (${productName}) is now being processed at the farm.`;
          break;
        case 'shipped':
          title = 'Order Shipped 🚚';
          message = `Your order #${shortId} has been handed over to logistics and is on its way!`;
          break;
        case 'delivered':
          title = 'Order Delivered ✅';
          message = `Successfully delivered! Your order #${shortId} has reached its destination. Enjoy your fresh produce!`;
          break;
        case 'cancelled':
          title = 'Order Cancelled ❌';
          message = `Order #${shortId} has been cancelled.`;
          break;
      }

      // Notify the buyer if the status was updated by the farmer
      // Or notify the farmer if the status was updated by the buyer (cancellation)
      const isCancellation = status === 'cancelled';
      const notificationRecipient = isCancellation ? farmerId : orderData.buyer_id;

      if (notificationRecipient) {
        await this.createNotification({
          user_id: notificationRecipient,
          title,
          message,
          type: 'order',
          link: `/orders`,
          created_at: new Date().toISOString()
        });
      }

      // 2. Send Automated Message to Chat
      if (farmerId && orderData.buyer_id) {
        await this.sendMessage({
          sender_id: isCancellation ? orderData.buyer_id : farmerId,
          receiver_id: isCancellation ? farmerId : orderData.buyer_id,
          message: `[Order Status Update] ${message}`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (msgError) {
      console.error('Failed to send internal notifications:', msgError);
    }
    
    return orderData;
  },

  // Diagnoses
  async getShipments(userId: string, user_type: 'farmer' | 'buyer' = 'buyer') {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, buyer_id, status, shipping_address, created_at,
        order_items!inner(
          id, product_id,
          products!inner(farmer_id, name)
        )
      `)
      .eq(user_type === 'buyer' ? 'buyer_id' : 'order_items.products.farmer_id', userId)
      .in('status', ['processing', 'shipped', 'delivered'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return orders;
  },

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

  async markMessagesAsRead(userId: string, partnerId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
    
    if (error) console.error("Failed to mark messages as read:", error);
    return data;
  },

  async getUnreadMessagesCount(userId: string) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error("Failed to get unread messages count:", error);
      return 0;
    }
    return count || 0;
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url), receiver:profiles!receiver_id(full_name, avatar_url)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);

    // Group messages by conversation partner
    const conversations = new Map();
    data.forEach((msg: any) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          id: partnerId,
          full_name: partner?.full_name || 'User',
          avatar_url: partner?.avatar_url,
          last_message: msg.message,
          created_at: msg.created_at,
          unread_count: !msg.is_read && msg.receiver_id === userId ? 1 : 0
        });
      } else if (!msg.is_read && msg.receiver_id === userId) {
        conversations.get(partnerId).unread_count++;
      }
    });

    return Array.from(conversations.values());
  },

  // Payments
  async createPayment(paymentData: Partial<Payment>) {
    // Try to insert with the payload provided. 
    // We attempt a few variations to handle schema mismatches gracefully.
    const { campay_reference, ...rest } = paymentData;
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{ ...paymentData }])
        .select()
        .single();
      
      if (!error) return data;
      
      // If error is about missing column 'campay_reference', try the mapping
      if (error && (error.message.includes('campay_reference') || error.code === 'PGRST204')) {
        const fallbackPayload = {
          ...rest,
          stripe_payment_id: campay_reference
        };
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('payments')
          .insert([fallbackPayload])
          .select()
          .single();
        
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      
      throw error;
    } catch (error: any) {
      console.error('Payment insertion error:', error);
      throw new Error(error.message || 'Failed to create payment record');
    }
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
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('is_read', { ascending: true }) // unread first
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('notifications\' not found') || error.message?.includes('schema cache')) {
          return [];
        }
        console.warn('Notifications retrieval skipped:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Notifications retrieval skipped:', err);
      return [];
    }
  },

  async getUnreadNotificationsCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  },

  async calculateNotifications(userId: string) {
    const notifications = await this.getNotifications(userId);
    return notifications;
  },

  async createNotification(notification: Partial<AppNotification>) {
    try {
      // Default to primary if not specified
      const payload = {
        category: 'primary',
        is_read: false,
        created_at: new Date().toISOString(),
        ...notification
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([payload]);
      
      if (error) {
        console.warn('Notification creation skipped:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Notification creation skipped:', err);
      return null;
    }
  },

  async markNotificationAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) {
        console.warn('Mark notification as read warning:', error.message);
      }
    } catch (err) {
      console.warn('Mark notification as read warning:', err);
    }
  },

  // Escrow & Campay Logic
  async initiateCampayPayment(amount: number, phoneNumber: string, orderId: string) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    try {
      const response = await fetch('/api/payment/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phoneNumber, externalId: orderId }),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment initiation failed');
      }

      return response.json();
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') throw new Error('Payment initiation timed out. Please try again.');
      throw err;
    }
  },

  async checkCampayStatus(reference: string) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      const response = await fetch(`/api/payment/status?reference=${reference}`, {
        signal: controller.signal
      });
      clearTimeout(id);
      if (!response.ok) throw new Error('Status check failed');
      return response.json();
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') throw new Error('Status check timed out');
      throw err;
    }
  },

  async verifyOrderOTP(orderId: string, otp: string) {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('otp_code, status, buyer_id')
      .eq('id', orderId)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (order.otp_code !== otp) throw new Error('Invalid OTP code. Please verify with the buyer.');

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) throw new Error(updateError.message);

    // Notify buyer
    await this.createNotification({
      user_id: order.buyer_id,
      title: 'Handshake Success! ✅',
      message: 'The seller has verified your delivery code. Your payout to the farmer is now being prepared.',
      type: 'order',
      link: '/orders'
    });

    return true;
  },

  async uploadOrderEvidence(orderId: string, file: File) {
    const url = await this.uploadImage(file, 'evidence');
    const { error } = await supabase
      .from('orders')
      .update({ 
        evidence_url: url, 
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        estimated_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', orderId);

    if (error) throw new Error(error.message);
    return url;
  },

  async approveEscrowPayout(orderId: string) {
    // This is typically called by an admin
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(products(profiles(phone_number, full_name)))')
      .eq('id', orderId)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    
    // In a real app, you'd calculate commissions here
    const payoutAmount = order.total_amount * 0.95; // 5% platform fee
    const farmerPhone = order.order_items?.[0]?.products?.profiles?.phone_number;

    if (!farmerPhone) throw new Error('Farmer phone number not found for payout');

    // Call Withdrawal API (server-side for security)
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    try {
      const response = await fetch('/api/payment/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: payoutAmount, 
          phoneNumber: farmerPhone, 
          externalId: orderId 
        }),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payout failed. Please check platform balance.');
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'COMPLETED' })
        .eq('id', orderId);

      if (updateError) throw new Error(updateError.message);

      return true;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') throw new Error('Payout request timed out.');
      throw err;
    }
  },

  /**
   * Broadcasts a notification to multiple users.
   * Useful for market trends or new product propositions.
   */
  async broadcastNotification(notification: Partial<AppNotification>, targetUserType?: 'buyer' | 'farmer') {
    // For a real app, you'd fetch user IDs based on preferences or roles
    // Here we'll simulate by getting a few relevant users to notify
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq(targetUserType ? 'user_type' : 'id', targetUserType || 'dummy') // Filter by user_type if provided
      .limit(20);

    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(p => ({
        ...notification,
        user_id: p.id,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(notifications);
    }
  },

  /**
   * Generates smart climate and market insights for a farmer.
   */
  async generateInsights(userId: string) {
    const insights = [
      {
        title: 'Favorable Weather Pattern ☀️',
        message: 'A stable dry spell is expected next week in your region. Ideal for harvest activities.',
        category: 'insight' as NotificationCategory
      },
      {
        title: 'Market Trend: Rice 📈',
        message: 'Rice prices have increased by 12% in nearby Douala markets. Consider listing your stock now.',
        category: 'insight' as NotificationCategory
      }
    ];

    // Pick one randomly to avoid spamming
    const insight = insights[Math.floor(Math.random() * insights.length)];
    
    await this.createNotification({
      user_id: userId,
      ...insight,
      type: 'insight',
      link: '/insights',
      created_at: new Date().toISOString()
    });
  },

  // Admin Methods
  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!buyer_id(id, full_name, email, avatar_url),
        order_items(
          *,
          products(id, name, farmer:profiles!farmer_id(id, full_name))
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getAdminStats() {
    const [usersCount, ordersCount, productsCount, totalRevenue] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').in('status', ['delivered', 'COMPLETED', 'ESCROW_HELD'])
    ]);

    const revenue = totalRevenue.data?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

    return {
      users: usersCount.count || 0,
      orders: ordersCount.count || 0,
      products: productsCount.count || 0,
      revenue
    };
  },

  async toggleUserAdminStatus(userId: string, currentStatus: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getWasteLogs(farmerId: string) {
    const { data, error } = await supabase
      .from('waste_analytics')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async createWasteLog(waste: any) {
    const { data, error } = await supabase
      .from('waste_analytics')
      .insert([waste])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async getAdminPassword(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('admin_password_v2')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data.admin_password_v2;
  },

  // System Config
  async getSystemConfig(key: string) {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('config_key', key)
        .single();
      
      if (error) return null;
      return data.value;
    } catch (e) {
      return null;
    }
  },

  async updateSystemConfig(key: string, value: string) {
    const { data, error } = await supabase
      .from('system_config')
      .upsert({ config_key: key, value, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  // Audit Logs
  async getAuditLogs(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('not found')) return [];
        throw error;
      }
      return data;
    } catch (e) {
      console.warn('Audit logs table might not exist yet.');
      return [];
    }
  },

  async logAdminAction(userId: string, action: string, details: string, resourceId?: string) {
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action,
          details,
          resource_id: resourceId,
          created_at: new Date().toISOString()
        }]);
    } catch (e) {
      console.error('Failed to log admin action:', e);
    }
  },

  // Dispute Management
  async getDisputedOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, buyer:profiles!buyer_id(full_name, email), order_items(products(name, farmer:profiles!farmer_id(full_name, phone_number)))')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return (data || []).map(o => ({
      ...o,
      is_disputed: true // For UI logic
    }));
  },

  async reportOrderIssue(orderId: string, issueDetails: string) {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('buyer_id, order_items(products(farmer_id))')
      .eq('id', orderId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const farmerId = (order as any).order_items?.[0]?.products?.farmer_id;

    // Update order status if needed, or just log the issue
    // For now, let's keep status as 'delivered' but add metadata or just notify
    // In a more robust system, we'd have a 'disputes' table.
    // For this implementation, we will use notifications to support and the farmer.

    await Promise.all([
      // Notify support (admin simulation)
      this.createNotification({
        user_id: 'SYSTEM_SUPPORT', // Logic would handle admin broadcast
        title: 'New Dispute Reported! 🚨',
        message: `Order #${orderId.slice(0, 8)} has been disputed: ${issueDetails}`,
        type: 'system',
        link: `/admin/orders`
      }),
      // Notify Farmer
      farmerId ? this.createNotification({
        user_id: farmerId,
        title: 'Order Issue Reported ⚠️',
        message: `The buyer of order #${orderId.slice(0, 8)} reported an issue: ${issueDetails}. Please contact them to resolve.`,
        type: 'order',
        link: '/orders'
      }) : Promise.resolve()
    ]);

    // Send a message into the chat as well
    if (farmerId && order.buyer_id) {
      await this.sendMessage({
        sender_id: order.buyer_id,
        receiver_id: farmerId,
        message: `[ISSUE REPORTED] I've reported an issue with order #${orderId.slice(0, 8)}: ${issueDetails}`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return true;
  }
};
