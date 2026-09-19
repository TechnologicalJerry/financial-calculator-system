'use client';

import React from 'react';
import { PortfolioSelector } from '@/components/portfolio/PortfolioSelector';

export default function PortfoliosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Portfolios Management</h1>
        <p className="text-sm text-slate-400">Manage multi-entity portfolios, investment accounts, and asset classes.</p>
      </div>

      <PortfolioSelector />

      <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">Portfolio Data Grid Component</p>
        <p className="text-xs text-slate-500">Placeholder for portfolio holdings table, performance tracking, and account linking.</p>
      </div>
    </div>
  );
}
