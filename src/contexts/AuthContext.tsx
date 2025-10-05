import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { auth, supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  sessionTimeRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(30 * 60);

  const handleUserSession = async (authUser: any) => {
    try {
      // Get user details from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (error) {
        // If we get a 403 or session error, sign out to clear invalid session
        console.error('Error fetching user data:', error);
        await auth.signOut();
        setUser(null);
        return null;
      }
      
      // If user doesn't exist in users table, create them
      if (!userData) {
        const role = authUser.email?.includes('admin') ? 'admin' : 'cashier';
        const name = authUser.email?.includes('admin') ? 'System Administrator' : 'Cashier';
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            name: name,
            email: authUser.email,
            role: role
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating user:', insertError);
          await auth.signOut();
          setUser(null);
          return null;
        }
        
        return newUser;
      }
      
      return userData;
    } catch (error) {
      console.error('Session handling error:', error);
      await auth.signOut();
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const userData = await handleUserSession(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Get session error:', error);
        await supabase.auth.signOut();
        setUser(null);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userData = await handleUserSession(session.user);
          setUser(userData);
          return;
        }

        if (session?.user) {
          const userData = await handleUserSession(session.user);
          setUser(userData);
        }
      })();
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const TIMEOUT_DURATION = 30 * 60 * 1000;

    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = Math.max(0, Math.floor((TIMEOUT_DURATION - elapsed) / 1000));

      setSessionTimeRemaining(remaining);

      if (remaining === 0) {
        signOut();
      }
    };

    const updateActivity = () => {
      setLastActivity(Date.now());
      setSessionTimeRemaining(30 * 60);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    const interval = setInterval(checkInactivity, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user, lastActivity]);

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await auth.resetPassword(email);
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
    sessionTimeRemaining,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};