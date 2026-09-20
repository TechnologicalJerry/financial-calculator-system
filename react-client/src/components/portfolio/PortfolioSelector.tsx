'use client';

import React from 'react';

export function PortfolioSelector() {
  return (
    <div className="p-4 border border-slate-800 rounded-2xl bg-slate-900/60 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-400">Active Portfolio:</label>
        <select className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-indigo-500">
          <option value="all">All Portfolios Summary</option>
          <option value="personal">Personal Investment Portfolio</option>
          <option value="retirement">Retirement FIRE Fund</option>
          <option value="family">Family Savings Trust</option>
        </select>
      </div>

      <button className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
        + Create Portfolio
      </button>
    </div>
  );
}
