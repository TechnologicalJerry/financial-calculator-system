'use client';

import React from 'react';
import { SipCalculatorWidget } from '@/components/calculator/SipCalculatorWidget';
import { LoanAmortizationWidget } from '@/components/calculator/LoanAmortizationWidget';

export default function CalculatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Financial Calculators Suite</h1>
        <p className="text-sm text-slate-400">Interactive financial modeling engines: SIP, Loan Amortization, FIRE Number, and TVM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SipCalculatorWidget />
        <LoanAmortizationWidget />
      </div>
    </div>
  );
}
