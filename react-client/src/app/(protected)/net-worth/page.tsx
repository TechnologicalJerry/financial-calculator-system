'use client';

import React from 'react';
import { AssetLiabilityTable } from '@/components/portfolio/AssetLiabilityTable';

export default function NetWorthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Net Worth & Assets</h1>
        <p className="text-sm text-slate-400">Track total assets vs total liabilities, debt-to-asset ratios, and net worth progress.</p>
      </div>

      <AssetLiabilityTable />
    </div>
  );
}
