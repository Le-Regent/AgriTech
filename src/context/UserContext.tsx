import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profileService';
import { toast } from 'sonner';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, user_type: 'farmer' | 'buyer') => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>;
  isAuthReady: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(false); // Start as false, only true for explicit actions
  const isAuthReadyRef = React.useRef(false);
  const currentUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Sync ref with state
    isAuthReadyRef.current = isAuthReady;
  }, [isAuthReady]);

  useEffect(() => {
    // Safety timeout to ensure isAuthReady is set even if Supabase hangs
    const timeout = setTimeout(() => {
      if (!isAuthReadyRef.current) {
        console.warn('Auth initialization timed out, forcing ready state');
        setIsAuthReady(true);
      }
    }, 3000);

    const fetchAndSetProfile = async (sessionUser: any) => {
      // Avoid redundant fetches if user is already set and ID matches
      if (currentUserIdRef.current === sessionUser.id) return;
      currentUserIdRef.current = sessionUser.id;

      // 1. Set preliminary user from metadata immediately for instant UI response
      const metadata = sessionUser.user_metadata;
      const preliminaryUser: User = {
        id: sessionUser.id,
        full_name: metadata?.full_name || 'User',
        email: sessionUser.email || '',
        user_type: (metadata?.user_type as 'farmer' | 'buyer') || 'farmer',
        is_admin: metadata?.is_admin || false,
        avatar_url: metadata?.avatar_url,
      };
      
      setUser(preliminaryUser);
      setIsAuthReady(true);
      clearTimeout(timeout);

      // 2. Fetch full profile in background
      try {
        const profile = await profileService.getProfile(sessionUser.id);
        if (profile) {
          setUser(profile);
          // Cache full profile for offline access
          try {
            localStorage.setItem(`agritech_profile_${sessionUser.id}`, JSON.stringify(profile));
          } catch (e) {
            console.warn('Failed to cache profile:', e);
          }
        }
      } catch (error: any) {
        if (error.code === 'PGRST116') { // Not found
          console.warn('Profile not found, attempting to create from metadata');
          if (metadata?.full_name && metadata?.user_type) {
            const newProfile = {
              id: sessionUser.id,
              full_name: metadata.full_name,
              email: sessionUser.email || '',
              user_type: metadata.user_type as 'farmer' | 'buyer',
            };
            try {
              await supabase.from('profiles').insert([newProfile]);
              setUser(newProfile as User);
            } catch (insertError) {
              console.error('Failed to manually create profile:', insertError);
            }
          }
        } else if (error.message?.includes('fetch') || (typeof window !== 'undefined' && !window.navigator.onLine)) {
          // Network error - try to load from local cache
          console.warn('Network error fetching profile, checking local cache');
          try {
            const cached = localStorage.getItem(`agritech_profile_${sessionUser.id}`);
            if (cached) {
              setUser(JSON.parse(cached));
            }
          } catch (e) {
            console.error('Failed to load profile from cache:', e);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      }
    };

    // Listen for changes on auth state (logged in, signed out, etc.)
    // In Supabase v2, onAuthStateChange triggers INITIAL_SESSION on load,
    // so we don't need a separate getSession() call which can cause lock contention.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Handle session presence (initial, sign in, or refresh)
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          await fetchAndSetProfile(session.user);
        }
      } else {
        // Handle no session (initial empty or sign out)
        currentUserIdRef.current = null;
        setUser(null);
        setIsAuthReady(true);
        clearTimeout(timeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, user_type: 'farmer' | 'buyer') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: user_type,
          }
        }
      });

      if (error) return { error: error.message };
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Clear all agritech related local storage to prevent session leakage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agritech_') || key.startsWith('shipments_') || key.startsWith('last_insight_')) {
          localStorage.removeItem(key);
        }
      });
      
      currentUserIdRef.current = null;
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);
    try {
      // 1. Update the profiles table
      await profileService.updateProfile(user.id, updates);
      
      // 2. Sync with Auth Metadata if critical fields changed
      if (updates.full_name || updates.avatar_url) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { 
            full_name: updates.full_name || user.full_name,
            avatar_url: updates.avatar_url || user.avatar_url 
          }
        });
        if (authError) console.warn('Auth metadata sync failed:', authError.message);
      }

      // 3. Update local state and cache
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        try {
          localStorage.setItem(`agritech_profile_${user.id}`, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to update profile cache:', e);
        }
        return updated;
      });
      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error: error.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    signUp,
    signInWithGoogle,
    resendConfirmation,
    logout,
    resetPassword,
    updateProfile,
    isAuthReady,
    loading
  }), [user, login, signUp, resendConfirmation, logout, resetPassword, updateProfile, isAuthReady, loading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
