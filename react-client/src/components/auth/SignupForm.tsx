'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { signupSchema, SignupSchemaType } from '@/lib/validators/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { ErrorResponse } from '@/types/api.types';

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: SignupSchemaType) => {
    setServerError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await authService.signup({
        email: values.email,
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        password: values.password,
      });

      toast.success('Registration successful! Please verify your email.');
      router.push('/login?registered=true');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: ErrorResponse }; message?: string };
      const errData = apiErr?.response?.data;

      if (errData?.fieldErrors && errData.fieldErrors.length > 0) {
        const errorMap: Record<string, string> = {};
        errData.fieldErrors.forEach((fe) => {
          errorMap[fe.field] = fe.message;
        });
        setFieldErrors(errorMap);
      }

      const msg = errData?.message || apiErr?.message || 'Registration failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="John"
          error={errors.firstName?.message || fieldErrors.firstName}
          {...register('firstName')}
        />
        <Input
          label="Last Name"
          placeholder="Doe"
          error={errors.lastName?.message || fieldErrors.lastName}
          {...register('lastName')}
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        error={errors.email?.message || fieldErrors.email}
        {...register('email')}
      />

      <Input
        label="Username"
        placeholder="johndoe"
        error={errors.username?.message || fieldErrors.username}
        {...register('username')}
      />

      <Input
        label="Phone Number (Optional)"
        type="tel"
        placeholder="+1 234 567 890"
        error={errors.phoneNumber?.message || fieldErrors.phoneNumber}
        {...register('phoneNumber')}
      />

      <div className="space-y-1">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message || fieldErrors.password}
          {...register('password')}
        />
        <PasswordStrengthMeter password={passwordValue} />
      </div>

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full mt-3" isLoading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Sign In
        </Link>
      </p>
    </form>
  );
}
