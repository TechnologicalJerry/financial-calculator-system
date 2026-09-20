'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { changePasswordSchema, ChangePasswordSchemaType } from '@/lib/validators/auth.schema';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (values: ChangePasswordSchemaType) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success('Password updated successfully!');
      reset();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      const msg = errorObj?.message || 'Failed to change password';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="Current Password"
        type="password"
        placeholder="••••••••"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />

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

      <Button type="submit" isLoading={isLoading} className="mt-2">
        Update Password
      </Button>
    </form>
  );
}
