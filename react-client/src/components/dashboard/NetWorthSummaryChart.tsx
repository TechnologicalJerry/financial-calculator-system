'use client';

import React from 'react';

export function NetWorthSummaryChart() {
  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Net Worth Progression</h3>
          <p className="text-xs text-slate-400">Historical asset accumulation curve</p>
        </div>
      </div>

      <div className="h-64 border border-dashed border-slate-800 rounded-xl flex items-center justify-center bg-slate-950/40">
        <p className="text-xs text-slate-500 font-medium">[ Recharts Area Chart Component Placeholder ]</p>
      </div>
    </div>
  );
}
