import React from 'react';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthCardLayout
      title="Create an Account"
      subtitle="Join FinCalc Engine to access advanced calculators, portfolio management, and AI analytics"
    >
      <SignupForm />
    </AuthCardLayout>
  );
}
