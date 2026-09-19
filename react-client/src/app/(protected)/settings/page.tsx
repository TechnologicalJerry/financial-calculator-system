'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Profile</h1>
        <p className="text-sm text-slate-400">Manage profile details, security preferences, and notification settings.</p>
      </div>

      <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">User Settings & Profile Form</p>
        <p className="text-xs text-slate-500">Placeholder for profile avatar update, theme selector, and active sessions list.</p>
      </div>
    </div>
  );
}
