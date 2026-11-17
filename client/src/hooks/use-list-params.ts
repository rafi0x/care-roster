'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * List state (search, filters, page) lives in the URL rather than in component state:
 * it survives reloads, works with back/forward and can be shared as a link.
 */
export function useListParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const setParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams);
      if (!('page' in patch)) next.delete('page'); // any filter change goes back to page 1
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const hasFilters = Object.keys(params).some((k) => k !== 'page');
  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { params, setParams, hasFilters, reset };
}
