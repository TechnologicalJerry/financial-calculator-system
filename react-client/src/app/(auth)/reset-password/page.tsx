import React, { Suspense } from 'react';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Spinner } from '@/components/ui/spinner';

export default function ResetPasswordPage() {
  return (
    <AuthCardLayout
      title="Reset Password"
      subtitle="Enter a new strong password for your FinCalc account"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCardLayout>
  );
}
