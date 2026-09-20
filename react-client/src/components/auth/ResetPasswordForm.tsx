'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { resetPasswordSchema, ResetPasswordSchemaType } from '@/lib/validators/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (values: ResetPasswordSchemaType) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await authService.resetPassword({
        token: values.token,
        newPassword: values.newPassword,
      });

      toast.success('Password reset successfully! Please sign in with your new password.');
      router.push('/login?reset=success');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const msg = errorObj?.message || 'Invalid or expired password reset token';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="Invalid Request">
          Password reset token is missing from the URL. Please request a new reset link.
        </Alert>

        <Link href="/forgot-password" className="inline-block w-full">
          <Button className="w-full">Request Reset Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <input type="hidden" {...register('token')} />

      <div className="space-y-1">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordStrengthMeter password={newPasswordValue} />
      </div>

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
        Reset Password
      </Button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Remembered password?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Sign In
        </Link>
      </p>
    </form>
  );
}
