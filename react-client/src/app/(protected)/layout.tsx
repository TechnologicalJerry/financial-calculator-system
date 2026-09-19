'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Spinner } from '@/components/ui/spinner';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
        <Spinner className="w-10 h-10 text-indigo-500" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Page Workspace Content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
        {children}
      </main>
    </div>
  );
}
