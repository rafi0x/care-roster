'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { PhoneLink } from '@/components/app/phone-link';
import { DataTable, type Column } from '@/components/app/data-table';
import { FormDialog } from '@/components/app/dialogs';
import { DateRange, FilterBar, FilterSelect } from '@/components/app/filters';
import { ListPagination } from '@/components/app/list-pagination';
import { ErrorState, PageHeader, Panel } from '@/components/app/page';
import { SearchInput } from '@/components/app/search-input';
import { Button } from '@/components/ui/button';
import { useListParams } from '@/hooks/use-list-params';
import { formatDate } from '@/lib/format';
import { useCanWrite, useDoctorFilters, useDoctors } from '@/lib/queries';
import type { Doctor } from '@/lib/types';
import { DoctorForm } from './doctor-form';

const rowKey = (d: Doctor) => d.id;
const toOptions = (values: string[] = []) => values.map((v) => ({ value: v, label: v }));

const columns: Column<Doctor>[] = [
  {
    header: 'Doctor',
    bare: true,
    cell: (d) => (
      <Link href={`/doctors/${d.id}`} className="text-base font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
        {d.name}
      </Link>
    ),
  },
  { header: 'Specialization', cell: (d) => d.specialization },
  { header: 'Hospital', cell: (d) => d.hospital },
  {
    header: 'Contact',
    cell: (d) => (
      <div className="space-y-0.5">
        <p className="break-all text-muted-foreground">{d.email}</p>
        <PhoneLink phone={d.phone} />
      </div>
    ),
  },
  { header: 'Patients', align: 'right', cell: (d) => <span className="font-medium tabular-nums">{d.patientCount}</span> },
  { header: 'Added', cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(d.createdAt)}</span> },
];

export function DoctorList() {
  const { params, setParams, hasFilters, reset } = useListParams();
  const { data, error, isPlaceholderData, refetch } = useDoctors(params);
  const { data: filters } = useDoctorFilters();
  const router = useRouter();
  const canWrite = useCanWrite();
  const [adding, setAdding] = useState(false);

  const onSearch = useCallback((search: string) => setParams({ search }), [setParams]);
  const specializations = useMemo(() => toOptions(filters?.specializations), [filters]);
  const hospitals = useMemo(() => toOptions(filters?.hospitals), [filters]);

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle="Click any doctor to see and manage their patients."
        action={
          canWrite && (
            <Button onClick={() => setAdding(true)}>
              <Plus aria-hidden />
              Add doctor
            </Button>
          )
        }
      />
      <Panel>
        <FilterBar onClear={hasFilters ? reset : undefined}>
          <SearchInput value={params.search ?? ''} onSearch={onSearch} placeholder="Search by name, specialization, hospital or email" />
          <FilterSelect label="Specialization" value={params.specialization} onChange={(specialization) => setParams({ specialization })} options={specializations} />
          <FilterSelect label="Hospital" value={params.hospital} onChange={(hospital) => setParams({ hospital })} options={hospitals} />
          <DateRange from={params.from} to={params.to} onChange={setParams} />
        </FilterBar>

        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.data}
              rowKey={rowKey}
              onRowClick={(d) => router.push(`/doctors/${d.id}`)}
              stale={isPlaceholderData}
              empty={hasFilters ? 'No doctors match these filters.' : 'No doctors yet. Add the first one to get started.'}
            />
            {data && <ListPagination meta={data.meta} onPageChange={(page) => setParams({ page })} />}
          </>
        )}
      </Panel>

      <FormDialog open={adding} onClose={() => setAdding(false)} title="Add doctor">
        <DoctorForm onDone={() => setAdding(false)} />
      </FormDialog>
    </>
  );
}
