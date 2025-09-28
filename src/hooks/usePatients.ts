import { useState, useEffect } from 'react';
import { Patient } from '../types';
import { ApiClient } from '../lib/api';

export const usePatients = (userId: string | null) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await ApiClient.get<{ patients: Patient[] }>(`/api/users/${userId}/patients`);
      setPatients(data.patients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: {
    name: string;
    age?: number | null;
    condition?: string | null;
    notes?: string | null;
    contact?: string | null;
  }) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ApiClient.post<{ patient: Patient }>(`/api/users/${userId}/patients`, patientData);
      
      // Refresh the patients list
      await fetchPatients();
      
      return data.patient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  return {
    patients,
    loading,
    error,
    addPatient,
    refetch: fetchPatients,
  };
};
