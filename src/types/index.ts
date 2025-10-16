export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Meeting {
  id: string;
  date: string;
  time: string;
  patientName: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export type ViewType = 'meetings' | 'patients' | 'settings' | 'patient-file';

// Re-export medical file types
export * from './medicalFile';