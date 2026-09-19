'use client';

import React from 'react';
import { MetricCardsGrid } from '@/components/dashboard/MetricCardsGrid';
import { NetWorthSummaryChart } from '@/components/dashboard/NetWorthSummaryChart';
import { AssetAllocationPieChart } from '@/components/dashboard/AssetAllocationPieChart';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview Dashboard</h1>
        <p className="text-sm text-slate-400">Welcome back. Summary metrics and real-time financial insights.</p>
      </div>

      {/* Summary Stat Cards Grid */}
      <MetricCardsGrid />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetWorthSummaryChart />
        </div>
        <div>
          <AssetAllocationPieChart />
        </div>
      </div>

      {/* Recent Activity Widget */}
      <RecentActivityWidget />
    </div>
  );
}
