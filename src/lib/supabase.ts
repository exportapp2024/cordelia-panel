import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          medical_license: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          medical_license?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          medical_license?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          time: string;
          patient_name: string;
          type: string;
          status: 'upcoming' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          time: string;
          patient_name: string;
          type?: string;
          status?: 'upcoming' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          time?: string;
          patient_name?: string;
          type?: string;
          status?: 'upcoming' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_settings: {
        Row: {
          id: string;
          user_id: string;
          connected: boolean;
          version: string;
          last_sync: string;
          calendar_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connected?: boolean;
          version?: string;
          last_sync?: string;
          calendar_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connected?: boolean;
          version?: string;
          last_sync?: string;
          calendar_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          user_id: string;
          data: {
            name: string;
            age?: number | null;
            condition?: string | null;
            notes?: string | null;
            contact?: string | null;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: {
            name: string;
            age?: number | null;
            condition?: string | null;
            notes?: string | null;
            contact?: string | null;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: {
            name?: string;
            age?: number | null;
            condition?: string | null;
            notes?: string | null;
            contact?: string | null;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}