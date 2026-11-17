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

  const hasFilters = Object.keys(params).some((k) => !['page', 'sort', 'order'].includes(k)); // sorting is not a filter
  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { params, setParams, hasFilters, reset };
}

export interface Sort {
  key: string;
  order: 'asc' | 'desc';
}

/** Current sort from the URL (default: newest first) and a toggle: new column -> descending, same column -> flip. */
export function useSort(params: Record<string, string | undefined>, setParams: (patch: Record<string, string | undefined>) => void, defaultKey = 'createdAt') {
  const sort: Sort = { key: params.sort ?? defaultKey, order: params.order === 'asc' ? 'asc' : 'desc' };
  const setSort = (key: string, order: Sort['order']) =>
    setParams({ sort: key === defaultKey ? undefined : key, order: order === 'asc' ? 'asc' : undefined });
  const onSort = (key: string) => setSort(key, key === sort.key && sort.order === 'desc' ? 'asc' : 'desc');
  return { sort, onSort, setSort };
}
