'use client';

import React from 'react';

export function MetricCardsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-2">
        <p className="text-xs font-semibold text-slate-400">Total Net Worth</p>
        <p className="text-2xl font-extrabold text-white">$124,500.00</p>
        <p className="text-[11px] text-emerald-400">+12.4% vs last month</p>
      </div>

      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-2">
        <p className="text-xs font-semibold text-slate-400">Total Portfolios</p>
        <p className="text-2xl font-extrabold text-white">4 Active</p>
        <p className="text-[11px] text-indigo-400">Personal, Family, Retirement</p>
      </div>

      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-2">
        <p className="text-xs font-semibold text-slate-400">Calculations Saved</p>
        <p className="text-2xl font-extrabold text-white">18 Scenarios</p>
        <p className="text-[11px] text-slate-400">SIP & FIRE Models</p>
      </div>

      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-2">
        <p className="text-xs font-semibold text-slate-400">AI Health Score</p>
        <p className="text-2xl font-extrabold text-indigo-400">85 / 100</p>
        <p className="text-[11px] text-emerald-400">Excellent Standing</p>
      </div>
    </div>
  );
}
