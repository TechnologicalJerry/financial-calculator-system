'use client';

import React from 'react';
import { AiChatInterface } from '@/components/ai/AiChatInterface';

export default function AiAdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Advisor & Financial Copilot</h1>
        <p className="text-sm text-slate-400">Interactive conversational assistant powered by financial domain intelligence.</p>
      </div>

      <AiChatInterface />
    </div>
  );
}
