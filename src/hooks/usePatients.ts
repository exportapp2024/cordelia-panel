import { useState, useEffect } from 'react';
import { Patient } from '../types';
import { buildApiUrl } from '../lib/api';

export const usePatients = (userId: string | null) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`users/${userId}/patients`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
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
      const response = await fetch(buildApiUrl(`users/${userId}/patients`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        throw new Error('Failed to add patient');
      }

      const data = await response.json();
      
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
