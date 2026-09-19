import React, { Suspense } from 'react';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard';
import { Spinner } from '@/components/ui/spinner';

export default function VerifyEmailPage() {
  return (
    <AuthCardLayout
      title="Email Verification"
      subtitle="Validating your email address with the security server"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <VerifyEmailCard />
      </Suspense>
    </AuthCardLayout>
  );
}
