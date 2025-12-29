// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export interface ChatMessageResponse {
  thread_id: string;
  message: string;
  documentData?: {
    documentType: string;
    patientId: string;
    patientName: string;
    language: 'tr' | 'en';
    patientData: {
      patient_number?: number;
      data?: {
        name?: string;
        national_id?: string;
        phone?: string;
        address?: string;
      };
      medical_file?: {
        patientInfo?: Record<string, string>;
        admissionReason?: string;
        generalHealthHistory?: Record<string, string>;
        preoperativeEvaluation?: Record<string, string>;
        procedureInfo?: Record<string, string>;
        dischargeRecommendations?: Record<string, string>;
      };
    };
  };
}

export async function sendChatMessage(params: { userId: string; threadId?: string; message: string }): Promise<ChatMessageResponse> {
  const res = await fetch(buildApiUrl('/chat/message'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: params.userId, thread_id: params.threadId, message: params.message })
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function fetchChatHistory(params: { userId: string; threadId: string }) {
  const url = buildApiUrl(`/chat/history/${params.threadId}?user_id=${encodeURIComponent(params.userId)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch history failed');
  return res.json() as Promise<{ messages: Array<{ id: string; role: 'user'|'assistant'|'system'|'tool'; content: string; created_at: string }> }>;
}

// Medical file API functions
export async function fetchMedicalFile(userId: string, patientId: string) {
  const url = buildApiUrl(`/users/${userId}/patients/${patientId}/medical-file`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch medical file');
  return res.json() as Promise<{ medicalFile: {
    patient_number?: number;
    created_by_user_id?: string;
    created_by_name?: string | null;
    data?: {
      name?: string;
      national_id?: string;
      phone?: string;
      address?: string;
    };
    medical_file?: {
      patientInfo?: Record<string, string>;
      admissionReason?: string;
      generalHealthHistory?: Record<string, string>;
      preoperativeEvaluation?: Record<string, string>;
      procedureInfo?: Record<string, string>;
      followUpNotes?: string;
      dischargeRecommendations?: Record<string, string>;
    };
  } }>;
}

export async function updateMedicalFile(userId: string, patientId: string, medicalData: {
  patientInfo?: Record<string, string>;
  admissionReason?: string;
  generalHealthHistory?: Record<string, string>;
  preoperativeEvaluation?: Record<string, string>;
  procedureInfo?: Record<string, string>;
  dischargeRecommendations?: Record<string, string>;
}) {
  const url = buildApiUrl(`/users/${userId}/patients/${patientId}/medical-file`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medicalData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to update medical file' }));
    throw new Error(errorData.error || 'Failed to update medical file');
  }
  return res.json();
}

// Appointment API functions
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_by?: string;
  status?: 'attended' | 'no_show' | 'cancelled' | 'confirmed' | null;
  patient_id: string;
  patients?: {
    id: string;
    patient_number: number;
    data: {
      name?: string;
      national_id?: string;
      phone?: string;
      address?: string;
    };
  };
}

export async function fetchPatientAppointments(userId: string, patientId: string, timeMin?: string, timeMax?: string) {
  let url = buildApiUrl(`calendar/events/${userId}/patient/${patientId}`);
  const params = new URLSearchParams();
  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);
  if (params.toString()) url += `?${params.toString()}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch appointments' }));
    throw new Error(errorData.error || 'Failed to fetch appointments');
  }
  return res.json() as Promise<{ success: true; events: Appointment[]; count: number }>;
}

export async function createPatientAppointment(userId: string, appointmentData: {
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  notes?: string;
  patient_id: string;
}) {
  const url = buildApiUrl(`calendar/events/${userId}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to create appointment' }));
    throw new Error(errorData.error || 'Failed to create appointment');
  }
  return res.json() as Promise<{ success: true; event: Appointment; message: string }>;
}
