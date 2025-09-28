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

export interface AgentStatus {
  connected: boolean;
  lastSync: string;
  version: string;
}

export type ViewType = 'meetings' | 'agent' | 'settings';