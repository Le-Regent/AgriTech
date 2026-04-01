import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { toast } from 'sonner';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'farmer' | 'buyer') => Promise<{ error: string | null }>;
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
        role: (metadata?.role as 'farmer' | 'buyer') || 'farmer',
        avatar_url: metadata?.avatar_url,
      };
      
      setUser(preliminaryUser);
      setIsAuthReady(true);
      clearTimeout(timeout);

      // 2. Fetch full profile in background
      try {
        const profile = await supabaseService.getProfile(sessionUser.id);
        setUser(profile);
      } catch (error: any) {
        if (error.code === 'PGRST116') { // Not found
          console.warn('Profile not found, attempting to create from metadata');
          if (metadata?.full_name && metadata?.role) {
            const newProfile = {
              id: sessionUser.id,
              full_name: metadata.full_name,
              email: sessionUser.email || '',
              role: metadata.role as 'farmer' | 'buyer',
            };
            try {
              await supabase.from('profiles').insert([newProfile]);
              setUser(newProfile as User);
            } catch (insertError) {
              console.error('Failed to manually create profile:', insertError);
            }
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

  const login = async (email: string, password: string) => {
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
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'farmer' | 'buyer') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
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
  };

  const resendConfirmation = async (email: string) => {
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
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Clear user state immediately for better UX
      currentUserIdRef.current = null;
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, we want to clear the local user state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);
    try {
      await supabaseService.updateProfile(user.id, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error: error.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
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
  };

  return (
    <UserContext.Provider value={{ user, login, signUp, resendConfirmation, logout, resetPassword, updateProfile, isAuthReady, loading }}>
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
