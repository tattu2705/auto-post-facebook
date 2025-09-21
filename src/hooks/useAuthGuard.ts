'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  allowedPaths?: string[];
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    redirectTo = '/login',
    allowedPaths = ['/login', '/signup']
  } = options;

  useEffect(() => {
    // Don't redirect while loading or if already on an allowed path
    if (loading || allowedPaths.includes(pathname)) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, pathname, router, redirectTo, allowedPaths]);

  return {
    isAuthenticated,
    loading,
    shouldRender: loading || isAuthenticated || allowedPaths.includes(pathname)
  };
}

export function useRequireAuth() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  return {
    isAuthenticated,
    loading,
    user,
    isReady: !loading && isAuthenticated
  };
}