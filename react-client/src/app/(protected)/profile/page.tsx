'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { ActiveSessionsList } from '@/components/profile/ActiveSessionsList';
import { User, Lock, Laptop, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile & Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your personal details, credentials, and active security sessions.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Active Sessions</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'profile' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 font-bold text-white text-xl flex items-center justify-center shadow-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Email Address</span>
                <p className="font-semibold text-slate-200">{user.email}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Phone Number</span>
                <p className="font-semibold text-slate-200">{user.phoneNumber || 'Not provided'}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Account Status</span>
                <p className="font-semibold text-emerald-400">{user.status}</p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500">Member Since</span>
                <p className="font-semibold text-slate-200">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Change Account Password</h3>
              <p className="text-xs text-slate-400">
                Ensure your password meets the complexity requirements set by the identity service.
              </p>
            </div>
            <ChangePasswordForm />
          </div>
        )}

        {activeTab === 'sessions' && <ActiveSessionsList />}
      </div>
    </div>
  );
}
