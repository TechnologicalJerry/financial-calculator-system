import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface AuthCardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCardLayout({ title, subtitle, children }: AuthCardLayoutProps) {
  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="flex flex-col items-center text-center mb-6 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 font-bold text-lg hover:text-indigo-300 transition-colors">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
          </div>
          <span>FinCalc Engine</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-400">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}
