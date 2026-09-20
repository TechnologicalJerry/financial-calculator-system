'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2 } from 'lucide-react';

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [emailToResend, setEmailToResend] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('No verification token provided in URL.');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        await authService.verifyEmail({ token: token! });
        if (isMounted) {
          setStatus('success');
          toast.success('Email verified successfully!');
        }
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        if (isMounted) {
          setStatus('error');
          setErrorMessage(errorObj?.message || 'Invalid or expired verification token.');
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToResend) return;

    setIsResending(true);
    try {
      await authService.resendVerification({ email: emailToResend });
      setResendSent(true);
      toast.success('Verification link resent to your email.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj?.message || 'Failed to resend verification link');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
        <Spinner className="w-8 h-8 text-indigo-500" />
        <p className="text-sm text-slate-300">Verifying your email address...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Email Verified!</h3>
          <p className="text-xs text-slate-300">
            Your email address has been verified successfully. You can now sign in to access your financial dashboard.
          </p>
        </div>
        <Link href="/login" className="w-full">
          <Button className="w-full">Sign In Now</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="error" title="Verification Failed">
        {errorMessage || 'The verification link is invalid or has expired.'}
      </Alert>

      {resendSent ? (
        <Alert variant="success" title="Link Sent">
          If your account is pending verification, a new link has been sent to {emailToResend}.
        </Alert>
      ) : (
        <form onSubmit={handleResend} className="space-y-3 pt-2">
          <p className="text-xs text-slate-400">Need a new verification link? Enter your email address below:</p>
          <Input
            type="email"
            placeholder="user@example.com"
            value={emailToResend}
            onChange={(e) => setEmailToResend(e.target.value)}
            required
          />
          <Button type="submit" variant="outline" className="w-full" isLoading={isResending}>
            Resend Verification Link
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link href="/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
