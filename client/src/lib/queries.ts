'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { api } from './api';
import { toQueryString, type QueryParams } from './query-string';
import type { DashboardStats, Doctor, Paginated, Patient, User } from './types';

/*
 * Server state lives in TanStack Query, keyed by resource + URL params.
 * `keepPreviousData` keeps the current page on screen while the next one loads (no layout jump).
 */

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: ({ signal }) => api<{ data: User }>('/auth/me', { signal }), staleTime: Infinity, select: (r) => r.data });

export const useDoctors = (params: QueryParams) =>
  useQuery({
    queryKey: ['doctors', 'list', params],
    queryFn: ({ signal }) => api<Paginated<Doctor>>(`/doctors${toQueryString(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });

export const useDoctorFilters = () =>
  useQuery({
    queryKey: ['doctors', 'filters'],
    queryFn: ({ signal }) => api<{ data: { specializations: string[]; hospitals: string[] } }>('/doctors/filters', { signal }),
    staleTime: 5 * 60_000,
    select: (r) => r.data,
  });

export const useDoctor = (id: string) =>
  useQuery({ queryKey: ['doctors', 'detail', id], queryFn: ({ signal }) => api<{ data: Doctor }>(`/doctors/${id}`, { signal }), select: (r) => r.data });

/** All patients, or one doctor's list when `doctorId` is given. */
export const usePatients = (params: QueryParams, doctorId?: string) =>
  useQuery({
    queryKey: ['patients', 'list', doctorId ?? 'all', params],
    queryFn: ({ signal }) =>
      api<Paginated<Patient>>(`${doctorId ? `/doctors/${doctorId}/patients` : '/patients'}${toQueryString(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });

export const useDashboard = (days: number) =>
  useQuery({
    queryKey: ['dashboard', days],
    queryFn: ({ signal }) => api<{ data: DashboardStats }>(`/dashboard/stats?days=${days}`, { signal }),
    placeholderData: keepPreviousData,
    select: (r) => r.data,
  });

/**
 * Every write changes counts shown elsewhere (lists, doctor headers, dashboard),
 * so a successful mutation marks all three resources stale; only mounted queries refetch.
 */
export function useWrite<TInput>(write: (input: TInput) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => {
      toast.success(successMessage);
      for (const key of ['doctors', 'patients', 'dashboard']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/**
 * Only admins can change data; staff accounts are read-only (enforced by the API too).
 * False until after mount, so server HTML and the first client render agree (no hydration mismatch).
 */
export function useCanWrite() {
  const role = useMe().data?.role;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted && role === 'admin';
}
