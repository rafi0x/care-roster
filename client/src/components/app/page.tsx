import { TriangleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** A Card without its default padding, for panels whose content (tables, toolbars) runs edge to edge. */
export function Panel({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={cn('gap-0 py-0', className)} {...props} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="max-sm:w-full [&>*]:max-sm:w-full">{action}</div>}
    </header>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Could not load this</AlertTitle>
        <AlertDescription>
          {message}
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-foreground">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
