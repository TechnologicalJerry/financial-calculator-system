import React from 'react';
import { AuthCardLayout } from '@/components/auth/AuthCardLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthCardLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >
      <ForgotPasswordForm />
    </AuthCardLayout>
  );
}
