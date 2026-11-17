'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/login-form';

export function LoginRedirectForm() {
  const next = useSearchParams().get('next') ?? '/';
  // Only same-site paths: "//evil.com" and absolute URLs must not be followed.
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return <LoginForm onSuccess={() => window.location.assign(target)} />;
}
