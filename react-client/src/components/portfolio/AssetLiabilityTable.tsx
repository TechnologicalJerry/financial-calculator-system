'use client';

import React from 'react';

export function AssetLiabilityTable() {
  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Assets vs Liabilities Data Grid</h3>
        <button className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
          + Add Asset / Liability
        </button>
      </div>

      <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/40">
        <p className="text-xs text-slate-500 font-medium">[ Interactive Assets & Liabilities Data Table Placeholder ]</p>
      </div>
    </div>
  );
}
