import type { Metadata } from 'next';
import { PageHeader } from '@/components/app/page';
import { PatientList } from '@/features/patients/patient-list';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <>
      <PageHeader title="Patients" subtitle="Everyone under care, across all doctors." />
      <PatientList />
    </>
  );
}
