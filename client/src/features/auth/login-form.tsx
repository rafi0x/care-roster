'use client';

import { useRef } from 'react';
import { FormError, TextField } from '@/components/app/form-fields';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { useSubmit } from '@/hooks/use-submit';
import { api } from '@/lib/api';
import { DEMO_ACCOUNTS } from './demo-accounts';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { onSubmit, pending, error, fieldErrors } = useSubmit(async ({ email, password }) => {
    await api('/auth/login', { method: 'POST', body: { email, password } });
    onSuccess();
  });

  // Autofill the (uncontrolled) inputs, then submit through the normal path.
  function signInAs({ email, password }: { email: string; password: string }) {
    const form = formRef.current;
    if (!form) return;
    form.email.value = email;
    form.password.value = password;
    form.requestSubmit();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <FormError>{error}</FormError>
        <TextField label="Email" name="email" type="email" autoComplete="username" required autoFocus error={fieldErrors.email} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required error={fieldErrors.password} />
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>

        <FieldSeparator>or try a demo account</FieldSeparator>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Button key={a.role} type="button" variant="outline" disabled={pending} onClick={() => signInAs(a)} className="h-auto justify-between px-4 py-3 text-left">
              <span>
                <span className="block font-medium">{a.role}</span>
                <span className="block text-xs font-normal text-muted-foreground">{a.note}</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">Use</span>
            </Button>
          ))}
        </div>
      </FieldGroup>
    </form>
  );
}
