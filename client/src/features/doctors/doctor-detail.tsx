'use client';

import { ArrowLeft, Columns3, MoreVertical, Pencil, Plus, Table2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ConfirmDialog, FormDialog } from '@/components/app/dialogs';
import { ErrorState, Panel } from '@/components/app/page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientForm } from '@/features/patients/patient-form';
import { PatientBoard } from '@/features/patients/patient-board';
import { PatientList } from '@/features/patients/patient-list';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useListParams } from '@/hooks/use-list-params';
import { api } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/format';
import { useCanWrite, useDoctor, useWrite } from '@/lib/queries';
import { DoctorForm } from './doctor-form';

const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: doctor, error, refetch } = useDoctor(id);
  const [dialog, setDialog] = useState<'edit' | 'delete' | 'add-patient' | null>(null);
  const canWrite = useCanWrite();
  const { params, setParams } = useListParams();
  const view = params.view === 'board' ? 'board' : 'table';
  const close = () => setDialog(null);

  const remove = useWrite(() => api(`/doctors/${id}`, { method: 'DELETE' }), 'Doctor deleted');

  if (error) {
    return (
      <Panel>
        <ErrorState message={error.message} onRetry={refetch} />
      </Panel>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
        <Link href="/doctors">
          <ArrowLeft aria-hidden />
          All doctors
        </Link>
      </Button>

      <Card className="mb-8 gap-0 py-0">
        {doctor ? (
          <>
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">{initials(doctor.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{doctor.name}</h1>
                  <Badge variant="secondary" className="mt-1.5">
                    {doctor.specialization}
                  </Badge>
                </div>
              </div>
              {canWrite && (
                <>
                  <div className="hidden gap-2 sm:flex">
                    <Button variant="outline" onClick={() => setDialog('edit')}>
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setDialog('delete')} className="hover:text-destructive">
                      <Trash2 aria-hidden />
                      Delete
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Doctor actions" className="-mr-2 -mt-1 sm:hidden">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDialog('edit')}>
                        <Pencil aria-hidden />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
                        <Trash2 aria-hidden />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
            <Separator />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-3 lg:grid-cols-5">
              <Fact label="Hospital" className="col-span-2 sm:col-span-1">
                {doctor.hospital}
              </Fact>
              <Fact label="Phone">
                <a href={`tel:${doctor.phone}`} className="whitespace-nowrap tabular-nums hover:text-primary">
                  {formatPhone(doctor.phone)}
                </a>
              </Fact>
              <Fact label="Email" className="col-span-2 sm:col-span-1">
                <span className="break-all">{doctor.email}</span>
              </Fact>
              <Fact label="Patients">
                <span className="tabular-nums">{doctor.patientCount}</span>
              </Fact>
              <Fact label="Added">{formatDate(doctor.createdAt)}</Fact>
            </dl>
          </>
        ) : (
          <div className="space-y-4 p-5" aria-busy>
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        )}
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Patients</h2>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            aria-label="Patient view"
            value={view}
            onValueChange={(v) => v && setParams({ view: v === 'table' ? undefined : v, condition: undefined, search: undefined })}
            className="bg-card max-md:hidden"
          >
            <ToggleGroupItem value="table" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Table2 aria-hidden />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="board" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Columns3 aria-hidden />
              Board
            </ToggleGroupItem>
          </ToggleGroup>
          {canWrite && (
            <Button onClick={() => setDialog('add-patient')}>
              <Plus aria-hidden />
              Add patient
            </Button>
          )}
        </div>
      </div>
      {view === 'board' ? <PatientBoard doctorId={id} /> : <PatientList doctorId={id} />}

      <FormDialog open={dialog === 'add-patient'} onClose={close} title="Add patient" description={doctor ? `Under ${doctor.name}` : undefined}>
        <PatientForm doctorId={id} onDone={close} />
      </FormDialog>
      <FormDialog open={dialog === 'edit'} onClose={close} title="Edit doctor">
        {doctor && <DoctorForm doctor={doctor} onDone={close} />}
      </FormDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        onClose={close}
        title={`Delete ${doctor?.name ?? 'doctor'}?`}
        description={`Their ${doctor?.patientCount ?? 0} patients are kept and become unassigned. You can give them a new doctor from the Patients page.`}
        confirmLabel="Delete doctor"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.replace('/doctors'), onError: close })}
      />
    </>
  );
}
