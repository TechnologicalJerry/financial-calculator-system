'use client';

import React from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-slate-400">System governance, RBAC roles, feature flag management, and audit logs.</p>
      </div>

      <UserManagementTable />
    </div>
  );
}
