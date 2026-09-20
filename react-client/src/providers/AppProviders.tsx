'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { userService } from '@/services/user.service';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const logout = useAuthStore((state) => state.logout);

  // Initial Auth Check / Token Rehydration on Refresh
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!refreshRes.ok) {
          if (isMounted) setLoading(false);
          return;
        }

        const data = await refreshRes.json();
        if (data.success && data.data?.accessToken) {
          const accessToken = data.data.accessToken;
          useAuthStore.getState().setAccessToken(accessToken);

          // Fetch full profile
          const profile = await userService.getCurrentUser();
          if (isMounted) {
            setAuth(profile, accessToken);
          }
        } else {
          if (isMounted) logout();
        }
      } catch {
        if (isMounted) logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [setAuth, setLoading, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      {children}
    </QueryClientProvider>
  );
}
