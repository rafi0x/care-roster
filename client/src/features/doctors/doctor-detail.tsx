'use client';

import { ArrowLeft, Building2, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog, FormDialog } from '@/components/app/dialogs';
import { ErrorState, Panel } from '@/components/app/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientForm } from '@/features/patients/patient-form';
import { PatientList } from '@/features/patients/patient-list';
import { api } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/format';
import { useCanWrite, useDoctor, useWrite } from '@/lib/queries';
import { DoctorForm } from './doctor-form';

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: doctor, error, refetch } = useDoctor(id);
  const [dialog, setDialog] = useState<'edit' | 'delete' | 'add-patient' | null>(null);
  const canWrite = useCanWrite();
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

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        {doctor ? (
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{doctor.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {doctor.specialization}, added {formatDate(doctor.createdAt)}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" aria-hidden />
                {doctor.hospital}
              </li>
              <li>
                <a href={`tel:${doctor.phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  {formatPhone(doctor.phone)}
                </a>
              </li>
              <li>
                <a href={`mailto:${doctor.email}`} className="flex items-center gap-2 break-all hover:text-primary">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  {doctor.email}
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-3" aria-busy>
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        {canWrite && <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialog('edit')} disabled={!doctor} className="bg-card">
            <Pencil aria-hidden />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setDialog('delete')} disabled={!doctor} className="bg-card hover:text-destructive">
            <Trash2 aria-hidden />
            Delete
          </Button>
        </div>}
      </header>

      <h2 className="mb-3 text-lg font-semibold">
        Patients{doctor ? <span className="ml-2 font-sans text-base font-normal tabular-nums text-muted-foreground">{doctor.patientCount}</span> : null}
      </h2>
      <PatientList
        doctorId={id}
        action={
          canWrite && (
            <Button onClick={() => setDialog('add-patient')}>
              <Plus aria-hidden />
              Add patient
            </Button>
          )
        }
      />

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
        description={`This also deletes their ${doctor?.patientCount ?? 0} patient records. It cannot be undone.`}
        confirmLabel="Delete doctor"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => router.replace('/doctors'), onError: close })}
      />
    </>
  );
}
