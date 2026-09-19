'use client';

import React from 'react';

export function AiChatInterface() {
  return (
    <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/60 space-y-4 min-h-[500px] flex flex-col justify-between">
      <div className="border border-dashed border-slate-800 rounded-xl p-8 flex-1 flex items-center justify-center bg-slate-950/40">
        <p className="text-xs text-slate-500 font-medium">[ AI Advisor Chat Messages Stream & Insights Feed Placeholder ]</p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          placeholder="Ask AI Advisor about your tax optimization or FIRE target..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
          Send Prompt
        </button>
      </div>
    </div>
  );
}
