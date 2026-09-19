'use client';

import React from 'react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Notification Center</h1>
        <p className="text-sm text-slate-400">System alerts, security events, and threshold triggers.</p>
      </div>

      <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">Notification Feed Component</p>
        <p className="text-xs text-slate-500">Placeholder for notification items list, mark-as-read toggles, and filter tabs.</p>
      </div>
    </div>
  );
}
