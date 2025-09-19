import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { auth, supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { user: authUser } = await auth.getCurrentUser();
      
      if (authUser) {
        // Get user details from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        setUser(userData);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (authUser) => {
      if (authUser) {
        let { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
        
        // If user doesn't exist in users table, create them
        if (!userData) {
          const role = authUser.email?.includes('admin') ? 'admin' : 'cashier';
          const name = authUser.email?.includes('admin') ? 'System Administrator' : 'Cashier';
          
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              name: name,
              email: authUser.email,
              role: role
            })
            .select()
            .single();
          
          userData = newUser;
        }
        
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};