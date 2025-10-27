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
        followUpNotes?: string;
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
  followUpNotes?: string;
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
