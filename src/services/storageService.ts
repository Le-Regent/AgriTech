import { supabase } from '@/lib/supabase';

export const storageService = {
  async uploadImage(file: File, bucket: string = 'products') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    // Attempt to prefix the path with the user ID to support restrictive folder policies
    let filePath = fileName;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        filePath = `${session.user.id}/${fileName}`;
      }
    } catch (e) {
      console.warn('Could not retrieve user session for storage upload prefix:', e);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
