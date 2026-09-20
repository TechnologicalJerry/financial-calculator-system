'use client';

import React from 'react';

export function RecentActivityWidget() {
  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4">
      <h3 className="text-base font-bold text-white">Recent Calculations & Activity</h3>

      <div className="space-y-3">
        <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/40 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-200">SIP Calculation — Tech Growth Portfolio</p>
            <p className="text-slate-500">Target Value: $500,000 in 15 years</p>
          </div>
          <span className="text-[10px] text-slate-400">2 hours ago</span>
        </div>

        <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/40 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-200">Loan Amortization — Primary Mortgage</p>
            <p className="text-slate-500">Loan Amount: $350,000 @ 6.5%</p>
          </div>
          <span className="text-[10px] text-slate-400">Yesterday</span>
        </div>
      </div>
    </div>
  );
}
