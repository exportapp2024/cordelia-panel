import { ProcedureItem } from '../types/medicalFile';

const STORAGE_KEY = 'cordelia_appointment_procedures';

interface StoredProcedures {
  [appointmentId: string]: ProcedureItem;
}

const getStoredProcedures = (): StoredProcedures => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading procedures from localStorage:', error);
    return {};
  }
};

const setStoredProcedures = (procedures: StoredProcedures) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(procedures));
  } catch (error) {
    console.error('Error saving procedures to localStorage:', error);
  }
};

export const getAppointmentProcedure = (appointmentId: string): ProcedureItem | null => {
  const procedures = getStoredProcedures();
  return procedures[appointmentId] || null;
};

export const saveAppointmentProcedure = (appointmentId: string, procedure: ProcedureItem): void => {
  const procedures = getStoredProcedures();
  // Ensure the procedure has the appointment_id set
  const procedureToSave = {
    ...procedure,
    appointment_id: appointmentId
  };
  
  procedures[appointmentId] = procedureToSave;
  setStoredProcedures(procedures);
};

export const removeAppointmentProcedure = (appointmentId: string): void => {
  const procedures = getStoredProcedures();
  if (procedures[appointmentId]) {
    delete procedures[appointmentId];
    setStoredProcedures(procedures);
  }
};

