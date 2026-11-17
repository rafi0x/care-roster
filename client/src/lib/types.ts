export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
}

export type Condition = 'stable' | 'recovering' | 'under_observation' | 'critical' | 'discharged';
export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: Condition;
  doctor: { id: string; name: string; specialization: string };
  createdAt: string;
}

export interface DashboardStats {
  totals: { doctors: number; patients: number; newDoctors: number; newPatients: number; criticalPatients: number };
  patientsPerDoctor: { doctorId: string; name: string; specialization: string; count: number }[];
  patientsByCondition: { condition: Condition; count: number }[];
  doctorsBySpecialization: { specialization: string; count: number }[];
  timeline: { date: string; patients: number; doctors: number }[];
}
