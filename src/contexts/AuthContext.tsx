'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notification } from 'antd';
import authService from '../services/auth-service';
import { type User, type SignUpData, type SignInData } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user is stored in localStorage
      const storedUser = authService.getCurrentUser();
      if (storedUser && authService.isAuthenticated()) {
        // Verify token by fetching fresh user data
        try {
          const freshUser = await authService.getProfile();
          setUser(freshUser);
        } catch (error) {
          // Token might be expired, clear storage
          authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true);
      console.log(data);
      const response = await authService.signUp(data);
      setUser(response.user);
      console.log(response)
      notification.success({
        message: 'Account Created Successfully!',
        description: `Welcome ${response.user.name}! Your account has been created.`,
        duration: 5,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      notification.error({
        message: 'Sign Up Failed',
        description: errorMessage,
        duration: 5,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      setLoading(true);
      const response = await authService.signIn(data);
      setUser(response.user);
      
      notification.success({
        message: 'Welcome Back!',
        description: `Successfully signed in as ${response.user.name}`,
        duration: 3,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      notification.error({
        message: 'Sign In Failed',
        description: errorMessage,
        duration: 5,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      
      notification.info({
        message: 'Signed Out',
        description: 'You have been successfully signed out.',
        duration: 3,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear user state even if API call fails
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      
      notification.success({
        message: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        duration: 3,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      notification.error({
        message: 'Update Failed',
        description: errorMessage,
        duration: 5,
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to re-authenticate
      authService.logout();
      setUser(null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;