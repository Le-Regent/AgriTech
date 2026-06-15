import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export const profileService = {
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
      .upsert({ 
        id: userId, 
        ...profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      if (error.message?.includes('updated_at') || error.message?.includes('schema cache')) {
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId, 
            ...profile
          }, { onConflict: 'id' })
          .select()
          .single();
        
        if (retryError) throw new Error(retryError.message);
        return retryData;
      }
      throw new Error(error.message);
    }
    return data;
  }
};
