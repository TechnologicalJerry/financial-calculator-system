'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Calculator,
  Sparkles,
  Bell,
  FileText,
  FileBarChart,
  ShieldAlert,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolios', href: '/portfolios', icon: Briefcase },
  { name: 'Net Worth & Assets', href: '/net-worth', icon: TrendingUp },
  { name: 'Calculators', href: '/calculators', icon: Calculator },
  { name: 'AI Advisor', href: '/ai-advisor', icon: Sparkles, badge: 'AI' },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Document Vault', href: '/documents', icon: FileText },
  { name: 'Reports & Exports', href: '/reports', icon: FileBarChart },
  { name: 'Admin Control', href: '/admin', icon: ShieldAlert, adminOnly: true },
  { name: 'Settings & Profile', href: '/settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isUserAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 transition-colors duration-200">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Workspace Context Badge */}
        <div className="px-3 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-600/10 dark:bg-indigo-600/30 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">Financial Workspace</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300/70 font-medium">Enterprise v1.0</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Main Application
          </p>
          {navItems.map((item) => {
            if (item.adminOnly && !isUserAdmin) return null;

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile Summary */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'authenticated'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
