'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { forgotPasswordSchema, ForgotPasswordSchemaType } from '@/lib/validators/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordSchemaType) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email: values.email });
      setIsSuccess(true);
      toast.success('Reset link requested!');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setServerError(errorObj?.message || 'Failed to process request');
      toast.error('Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <Alert variant="success" title="Check your email">
          If an account exists for that email address, we have sent instructions to reset your password.
        </Alert>

        <Link href="/login" className="inline-block">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="Email Address"
        type="email"
        placeholder="user@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
        Send Reset Link
      </Button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Remember your password?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Sign In
        </Link>
      </p>
    </form>
  );
}
