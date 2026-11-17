'use client';

import { FormFooter, TextField } from '@/components/app/form-fields';
import { FieldGroup } from '@/components/ui/field';
import { useSubmit } from '@/hooks/use-submit';
import { api } from '@/lib/api';
import { useWrite } from '@/lib/queries';
import type { Doctor } from '@/lib/types';

interface Props {
  /** Present when editing. */
  doctor?: Doctor;
  onDone: () => void;
}

export function DoctorForm({ doctor, onDone }: Props) {
  const save = useWrite(
    (body: Record<string, string>) =>
      doctor ? api(`/doctors/${doctor.id}`, { method: 'PATCH', body }) : api('/doctors', { method: 'POST', body }),
    doctor ? 'Doctor updated' : 'Doctor added',
  );
  const { onSubmit, pending, error, fieldErrors } = useSubmit(async (values) => {
    await save.mutateAsync(values);
    onDone();
  });

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <TextField label="Full name" name="name" defaultValue={doctor?.name} placeholder="Dr. Ayesha Rahman" required minLength={2} autoFocus error={fieldErrors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Specialization" name="specialization" defaultValue={doctor?.specialization} placeholder="Cardiology" required minLength={2} error={fieldErrors.specialization} />
          <TextField label="Hospital" name="hospital" defaultValue={doctor?.hospital} placeholder="Square Hospital" required minLength={2} error={fieldErrors.hospital} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={doctor?.phone} placeholder="+880 1711 000000" required error={fieldErrors.phone} />
          <TextField label="Email" name="email" type="email" defaultValue={doctor?.email} placeholder="name@hospital.com" required error={fieldErrors.email} />
        </div>
        <FormFooter error={error} pending={pending} submitLabel={doctor ? 'Save changes' : 'Add doctor'} onCancel={onDone} />
      </FieldGroup>
    </form>
  );
}
