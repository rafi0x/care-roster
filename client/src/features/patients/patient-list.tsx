'use client';

import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConditionBadge } from '@/components/app/condition-badge';
import { PhoneLink } from '@/components/app/phone-link';
import { ExportButton } from '@/components/app/export-button';
import { DataTable, type Column } from '@/components/app/data-table';
import { ConfirmDialog, FormDialog } from '@/components/app/dialogs';
import { DateRange, FilterBar, FilterSelect, SortSelect } from '@/components/app/filters';
import { ListPagination } from '@/components/app/list-pagination';
import { ErrorState, Panel } from '@/components/app/page';
import { SearchInput } from '@/components/app/search-input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useListParams, useSort } from '@/hooks/use-list-params';
import { api } from '@/lib/api';
import { CONDITIONS, conditionMeta, GENDERS } from '@/lib/conditions';
import { formatDate } from '@/lib/format';
import { useCanWrite, usePatients, useWrite } from '@/lib/queries';
import type { Patient } from '@/lib/types';
import { PatientForm } from './patient-form';

interface Props {
  /** Scope the list to one doctor (doctor page). Omit for the all-patients page. */
  doctorId?: string;
  /** Extra toolbar content, e.g. the "Add patient" button. */
  action?: ReactNode;
}

const SORT_OPTIONS = [
  { key: 'createdAt', order: 'desc', label: 'Newest first', short: 'Newest' },
  { key: 'createdAt', order: 'asc', label: 'Oldest first', short: 'Oldest' },
] as const;

/** The patient's doctor as a link, or a muted "Unassigned" when their doctor was deleted. */
const doctorLink = (p: Patient, extra = '') =>
  p.doctor ? (
    <Link href={`/doctors/${p.doctor.id}`} className={`${extra} text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary`}>
      {p.doctor.name}
    </Link>
  ) : (
    <span className="text-muted-foreground">Unassigned</span>
  );

const rowKey = (p: Patient) => p.id;
const rowAccent = (p: Patient) => conditionMeta(p.condition).color;

/** Searchable, filterable, paginated patient table with edit and delete. Used by both patient views. */
export function PatientList({ doctorId, action }: Props) {
  const { params, setParams, hasFilters, reset } = useListParams();
  const { sort, onSort, setSort } = useSort(params, setParams);
  const { data, error, isPlaceholderData, refetch } = usePatients(params, doctorId);
  const canWrite = useCanWrite();
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const remove = useWrite(
    (p: Patient) => api(doctorId ? `/doctors/${doctorId}/patients/${p.id}` : `/patients/${p.id}`, { method: 'DELETE' }),
    'Patient deleted',
  );

  // Stable identities so the table and search box do not re-render on unrelated state changes.
  const onSearch = useCallback((search: string) => setParams({ search }), [setParams]);
  const patientCard = (p: Patient) => (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold">{p.name}</p>
        <div className="-mr-2 -mt-1.5 flex items-center gap-1">
          <ConditionBadge condition={p.condition} />
          {canWrite && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${p.name}`}>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(p)}>
                  <Pencil aria-hidden />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}>
                  <Trash2 aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {p.age} yrs · {p.gender === 'other' ? 'Other' : p.gender === 'male' ? 'Male' : 'Female'}
      </p>
      {!doctorId && <p className="text-sm">{doctorLink(p, 'font-medium')}</p>}
      <div className="flex items-center justify-between pt-1 text-sm">
        <PhoneLink phone={p.phone} />
        <span className="text-xs text-muted-foreground">Added {formatDate(p.createdAt)}</span>
      </div>
    </div>
  );

  const columns = useMemo<Column<Patient>[]>(
    () => [
      {
        header: 'Patient',
        bare: true,
        cell: (p) => (
          <div className="text-left">
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-muted-foreground">
              {p.age} yrs, {p.gender}
            </p>
          </div>
        ),
      },
      { header: 'Condition', cell: (p) => <ConditionBadge condition={p.condition} /> },
      ...(doctorId
        ? []
        : [
            {
              header: 'Doctor',
              cell: (p: Patient) => doctorLink(p),
            },
          ]),
      { header: 'Phone', cell: (p) => <PhoneLink phone={p.phone} /> },
      { header: 'Added', sortKey: 'createdAt', cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.createdAt)}</span> },
      ...(!canWrite
        ? []
        : [
      {
        header: 'Actions',
        bare: true,
        align: 'right' as const,
        cell: (p: Patient) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)} className="hover:text-destructive">
              <Trash2 />
            </Button>
          </div>
        ),
      },
          ]),
    ],
    [doctorId, canWrite],
  );

  return (
    <Panel>
      <FilterBar onClear={hasFilters ? reset : undefined}>
        <SearchInput value={params.search ?? ''} onSearch={onSearch} placeholder="Search name, phone, email" />
        <FilterSelect label="Condition" value={params.condition} onChange={(condition) => setParams({ condition })} options={CONDITIONS} />
        <FilterSelect label="Gender" value={params.gender} onChange={(gender) => setParams({ gender })} options={GENDERS} />
        {!doctorId && <FilterSelect label="Doctor" value={params.doctor} onChange={(doctor) => setParams({ doctor })} options={[{ value: 'unassigned', label: 'Unassigned' }]} className="max-sm:hidden" />}
        <DateRange from={params.from} to={params.to} onChange={setParams} />
        <SortSelect value={`${sort.key}:${sort.order}`} onChange={setSort} options={SORT_OPTIONS} />
        <ExportButton<Patient>
          path={doctorId ? `/doctors/${doctorId}/patients` : '/patients'}
          params={params}
          filename="patients.csv"
          header={['Name', 'Age', 'Gender', 'Condition', 'Doctor', 'Phone', 'Email', 'Added']}
          row={(p) => [p.name, p.age, p.gender, conditionMeta(p.condition).label, p.doctor?.name ?? 'Unassigned', p.phone, p.email, p.createdAt.slice(0, 10)]}
        />
        {action && <div className="ml-auto max-sm:order-2 max-sm:w-full [&>button]:max-sm:w-full">{action}</div>}
      </FilterBar>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.data}
            rowKey={rowKey}
            card={patientCard}
            sort={sort}
            onSort={onSort}
            rowAccent={rowAccent}
            stale={isPlaceholderData}
            empty={
              hasFilters
                ? 'No patients match these filters.'
                : doctorId
                  ? 'This doctor has no patients yet. Add the first one.'
                  : 'No patients yet. Add patients from a doctor’s page.'
            }
          />
          {data && <ListPagination meta={data.meta} onPageChange={(page) => setParams({ page })} />}
        </>
      )}

      <FormDialog open={!!editing} onClose={() => setEditing(null)} title="Edit patient">
        {editing && <PatientForm patient={editing} onDone={() => setEditing(null)} />}
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'patient'}?`}
        description="This removes the patient record permanently."
        confirmLabel="Delete patient"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting, { onSettled: () => setDeleting(null) })}
      />
    </Panel>
  );
}
