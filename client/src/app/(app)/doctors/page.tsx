import type { Metadata } from 'next';
import { DoctorList } from '@/features/doctors/doctor-list';

export const metadata: Metadata = { title: 'Doctors' };

export default function DoctorsPage() {
  return <DoctorList />;
}
