import React, { Suspense } from 'react';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  return (
    <AuthCardLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue managing your financial portfolio"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <LoginForm />
      </Suspense>
    </AuthCardLayout>
  );
}
