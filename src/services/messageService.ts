import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export const messageService = {
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
  }
};
