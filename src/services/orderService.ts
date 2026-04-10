import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Payment } from '@/types';

export const orderService = {
  // Orders
  async createOrder(order: Partial<Order>, items: Partial<OrderItem>[]) {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
    
    if (orderError) throw orderError;

    const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderData.id }));
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);
    
    if (itemsError) throw itemsError;
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
  }
};
