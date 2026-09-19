import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Calculator, Cpu, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Spring Security & Microservices Integrated</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Next-Gen Financial Calculators & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Portfolio Engine</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          High-performance, multi-tenant financial application powered by Spring Boot Microservices, JWT Auth with Token Rotation, and Next.js 16.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/signup">
            <Button size="lg" className="gap-2 px-6">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-6">
              Sign In to Account
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5 backdrop-blur-sm">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-fit text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">OAuth2 & JWT Auth</h3>
            <p className="text-xs text-slate-400">
              Stateless security with HttpOnly refresh token rotation and active session management.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5 backdrop-blur-sm">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Financial Tools</h3>
            <p className="text-xs text-slate-400">
              Advanced calculators for loans, investments, retirement, and net-worth tracking.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5 backdrop-blur-sm">
            <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 rounded-xl w-fit text-pink-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">AI Insights Engine</h3>
            <p className="text-xs text-slate-400">
              Personalized financial health scoring, AI insights, and automated portfolio analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
