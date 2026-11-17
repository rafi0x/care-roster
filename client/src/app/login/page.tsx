import { Stethoscope } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginRedirectForm } from './login-redirect-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
            <Stethoscope className="size-5" />
          </span>
          <CardTitle className="text-xl">CareRoster</CardTitle>
          <CardDescription>Sign in to manage doctors and patients.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginRedirectForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
