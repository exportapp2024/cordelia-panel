import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  medical_license?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Auth initialization error:', error);
        } else if (session?.user) {
          await loadUserProfile(session.user);
        }
        
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.email);

        // Handle auth state changes
        // Note: Email sync is now handled automatically by database trigger
        if (event === 'USER_UPDATED' && session?.user) {
          await loadUserProfile(session.user);
        } else if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        // Always set loading to false after handling auth change
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const loadUserProfile = async (authUser: User) => {
    
    // For now, just use auth user data to avoid RLS issues
    // TODO: Fix RLS policies later
    const userData = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    };
    
    setUser(userData);
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update user metadata in auth.users
      const { error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Also update public.users table to persist the name change
      if (updates.name) {
        const { error: usersError } = await supabase
          .from('users')
          .update({ name: updates.name })
          .eq('id', user.id);

        if (usersError) {
          console.error('Failed to update public.users:', usersError);
          // Don't throw - auth metadata update succeeded, this is secondary
        }
      }

      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        // Rate limiting ve diğer hataları handle et
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin ve tekrar deneyin.');
        }
        throw new Error(error.message);
      }

      // Güvenlik: Email kayıtlı olmasa bile başarı mesajı döndür (email enumeration koruması)
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // Token expiration kontrolü
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          throw new Error('Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.');
        }
        // Rate limiting
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.');
        }
        // Eski şifre ile aynı şifre
        if (error.message.includes('same') || error.message.includes('previous')) {
          throw new Error('Yeni şifre eski şifrenizden farklı olmalıdır.');
        }
        throw new Error(error.message);
      }

      // Şifre güncellendiğinde session invalidate edilir (Supabase otomatik yapar)
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update email in auth.users - Supabase will send confirmation emails to both old and new addresses
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        // Rate limiting
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.');
        }
        // Email already in use
        if (error.message.includes('already') || error.message.includes('exists')) {
          throw new Error('Bu email adresi zaten kullanımda.');
        }
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateEmail,
    resetPasswordForEmail,
    updatePassword,
  };
};
