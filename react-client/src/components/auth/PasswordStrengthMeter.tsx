import React from 'react';
import { Check, X } from 'lucide-react';

interface Rule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

const rules: Rule[] = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'At least one number (0-9)', test: (pw) => /\d/.test(pw) },
  { id: 'special', label: 'At least one special character (@$!%*?&)', test: (pw) => /[@$!%*?&]/.test(pw) },
];

export function PasswordStrengthMeter({ password = '' }: { password?: string }) {
  if (!password) return null;

  const passedCount = rules.filter((r) => r.test(password)).length;
  const strengthPercentage = (passedCount / rules.length) * 100;

  const getBarColor = () => {
    if (passedCount <= 2) return 'bg-red-500';
    if (passedCount <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-400 pt-1">
        {rules.map((rule) => {
          const isPassed = rule.test(password);
          return (
            <div key={rule.id} className="flex items-center gap-1.5">
              {isPassed ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className={isPassed ? 'text-slate-300 font-medium' : 'text-slate-500'}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
