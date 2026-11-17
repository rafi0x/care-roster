'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Base {
  label: string;
  /** Server-side validation message for this field. */
  error?: string;
}

/** shadcn Field + Input with the label and error wired up for assistive tech. */
export function TextField({ label, error, ...props }: Base & ComponentProps<typeof Input>) {
  const id = useId();
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

interface SelectFieldProps extends Base {
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

/** shadcn Field + Select. `name` makes Radix render a hidden native select, so it submits with the form. */
export function SelectField({ label, error, options, placeholder, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select {...props}>
        <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

interface FooterProps {
  error: string | null;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function FormFooter({ error, pending, submitLabel, onCancel }: FooterProps) {
  return (
    <>
      <FormError>{error}</FormError>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </>
  );
}
