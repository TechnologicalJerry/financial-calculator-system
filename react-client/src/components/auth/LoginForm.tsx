'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { loginSchema, LoginSchemaType } from '@/lib/validators/auth.schema';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => searchParams.get('token') !== null);
  const setAuth = useAuthStore((state) => state.setAuth);

  React.useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      useAuthStore.getState().setAccessToken(tokenParam);
      userService
        .getCurrentUser()
        .then((profile) => {
          setAuth(profile, tokenParam);
          toast.success('Authenticated via token!');
          router.push('/dashboard');
        })
        .catch(() => {
          toast.error('Token authentication failed or expired');
          setIsLoading(false);
        });
    }
  }, [searchParams, router, setAuth]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginSchemaType) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({
        usernameOrEmail: values.usernameOrEmail,
        password: values.password,
        rememberMe: values.rememberMe,
        deviceFingerprint: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        deviceName: typeof window !== 'undefined' ? window.navigator.platform : undefined,
      });

      const { accessToken } = response.data;
      useAuthStore.getState().setAccessToken(accessToken);

      // Fetch full profile
      const profile = await userService.getCurrentUser();
      setAuth(profile, accessToken);

      toast.success('Welcome back! Login successful.');
      router.push('/dashboard');

    } catch (err: unknown) {
      const errorResponse = err as { message?: string; errorName?: string };
      const msg = errorResponse?.message || 'Invalid username or password';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isExpired && (
        <Alert variant="warning" title="Session Expired">
          Your session has expired. Please sign in again.
        </Alert>
      )}

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="Email or Username"
        type="text"
        placeholder="user@example.com"
        error={errors.usernameOrEmail?.message}
        {...register('usernameOrEmail')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            {...register('rememberMe')}
          />
          <span>Remember me</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
        Sign In
      </Button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Create one now
        </Link>
      </p>
    </form>
  );
}
