'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { UserAvatarMenu } from './UserAvatarMenu';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-lg hover:text-indigo-500 transition-colors">
            <div className="p-1.5 bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
            </div>
            <span className="text-slate-900 dark:text-white tracking-tight font-extrabold">FinCalc Engine</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Dashboard</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / Light Theme Toggle Button */}
          <ThemeToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : isAuthenticated ? (
            <UserAvatarMenu />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
