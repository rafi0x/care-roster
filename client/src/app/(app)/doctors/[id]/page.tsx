import type { Metadata } from 'next';
import { DoctorDetail } from '@/features/doctors/doctor-detail';

export const metadata: Metadata = { title: 'Doctor' };

export default function DoctorPage() {
  return <DoctorDetail />;
}
