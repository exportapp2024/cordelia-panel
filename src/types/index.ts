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

export interface Patient {
  id: string;
  user_id: string;
  created_by_user_id: string | null;
  created_by_name?: string | null;
  patient_number: number;
  data: {
    name?: string;
    national_id?: string;
    phone?: string;
    address?: string;
    reason?: string;
    notes?: string;
  };
  medical_file?: any;
  created_at: string;
  updated_at?: string;
}

export type ViewType = 'meetings' | 'patients' | 'settings' | 'patient-file';

// Re-export medical file types
export * from './medicalFile';