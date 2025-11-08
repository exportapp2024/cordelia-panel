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
    national_id?: string | null;
    phone?: string | null;
    address?: string | null;
    reason?: string | null;
    notes?: string | null;
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
      await fetchPatients();
      return data.patient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (patientId: string, partialData: Record<string, any>) => {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(buildApiUrl(`users/${userId}/patients/${patientId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: partialData })
    });
    if (!response.ok) throw new Error('Failed to update patient');
    await fetchPatients();
  };

  const updateNotes = async (patientId: string, notes: string | null) => {
    return updatePatient(patientId, { notes });
  };

  const deletePatient = async (patientId: string) => {
    if (!userId) throw new Error('User ID is required');
    const response = await fetch(buildApiUrl(`users/${userId}/patients/${patientId}`), {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete patient');
    await fetchPatients();
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    updateNotes,
    deletePatient,
    refetch: fetchPatients,
  };
};
