'use client';

import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Export History</h1>
        <p className="text-sm text-slate-400">Generate, schedule, and download PDF, CSV, and Excel financial reports.</p>
      </div>

      <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">Report Generator & Download Table</p>
        <p className="text-xs text-slate-500">Placeholder for report type selection, date range pickers, and export downloads.</p>
      </div>
    </div>
  );
}
