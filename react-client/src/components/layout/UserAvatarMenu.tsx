'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export function UserAvatarMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 font-bold text-white text-xs flex items-center justify-center shadow-md">
          {initials}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-semibold text-slate-100">{user.firstName} {user.lastName}</p>
          <p className="text-slate-400 font-mono text-[10px]">@{user.username}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-56 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 backdrop-blur-xl text-xs">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1 space-y-1">
              <p className="font-semibold text-white text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {user.roles?.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-md border border-indigo-500/30"
                  >
                    {role.replace('ROLE_', '')}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span>Profile & Security</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
