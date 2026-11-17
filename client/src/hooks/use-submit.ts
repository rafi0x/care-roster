'use client';

import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';

/** Shared form plumbing: pending state, a form-level error and per-field server errors. */
export function useSubmit(submit: (values: Record<string, string>) => Promise<unknown>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      await submit(values);
    } catch (err) {
      const fields = err instanceof ApiError ? err.fieldErrors : {};
      setFieldErrors(fields);
      // Field errors are shown next to their inputs; only show the banner when there are none.
      if (!Object.keys(fields).length) setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return { onSubmit, pending, error, fieldErrors };
}
