'use client';

import React from 'react';

export function AssetAllocationPieChart() {
  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white">Asset Allocation</h3>
        <p className="text-xs text-slate-400">Distribution across asset classes</p>
      </div>

      <div className="h-64 border border-dashed border-slate-800 rounded-xl flex items-center justify-center bg-slate-950/40">
        <p className="text-xs text-slate-500 font-medium">[ Donut Pie Chart Component Placeholder ]</p>
      </div>
    </div>
  );
}
