'use client';

import { FormFooter, SelectField, TextField } from '@/components/app/form-fields';
import { FieldGroup } from '@/components/ui/field';
import { useSubmit } from '@/hooks/use-submit';
import { api } from '@/lib/api';
import { CONDITIONS, GENDERS } from '@/lib/conditions';
import { useWrite } from '@/lib/queries';
import type { Patient } from '@/lib/types';

type Props = { onDone: () => void } & (
  | { patient: Patient; doctorId?: never } // edit
  | { doctorId: string; patient?: never } // add under a doctor
);

export function PatientForm({ patient, doctorId, onDone }: Props) {
  const save = useWrite(
    (body: Record<string, string>) =>
      patient ? api(`/patients/${patient.id}`, { method: 'PATCH', body }) : api(`/doctors/${doctorId}/patients`, { method: 'POST', body }),
    patient ? 'Patient updated' : 'Patient added',
  );
  const { onSubmit, pending, error, fieldErrors } = useSubmit(async (values) => {
    await save.mutateAsync(values);
    onDone();
  });

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <TextField label="Full name" name="name" defaultValue={patient?.name} required minLength={2} autoFocus error={fieldErrors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Age" name="age" type="number" min={0} max={130} defaultValue={patient?.age} required error={fieldErrors.age} />
          <SelectField label="Gender" name="gender" options={GENDERS} defaultValue={patient?.gender} placeholder="Select" required error={fieldErrors.gender} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={patient?.phone} placeholder="+880 1811 000000" required error={fieldErrors.phone} />
          <TextField label="Email (optional)" name="email" type="email" defaultValue={patient?.email} error={fieldErrors.email} />
        </div>
        <SelectField label="Condition" name="condition" options={CONDITIONS} defaultValue={patient?.condition ?? 'stable'} required error={fieldErrors.condition} />
        <FormFooter error={error} pending={pending} submitLabel={patient ? 'Save changes' : 'Add patient'} onCancel={onDone} />
      </FieldGroup>
    </form>
  );
}
