/**
 * Timezone utility functions for Turkish time (GMT+3)
 */

/**
 * Get current date and time in Turkish timezone
 * @returns Current date in Turkish timezone
 */
export const getTurkishTime = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for GMT+3
};

/**
 * Get today's date string in Turkish timezone (YYYY-MM-DD format)
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTurkishToday = (): string => {
  return getTurkishTime().toISOString().split('T')[0];
};

/**
 * Get tomorrow's date string in Turkish timezone (YYYY-MM-DD format)
 * @returns Tomorrow's date in YYYY-MM-DD format
 */
export const getTurkishTomorrow = (): string => {
  const tomorrow = new Date(getTurkishTime().getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Convert date and time to Turkish timezone ISO string
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @returns ISO string with Turkish timezone offset
 */
export const createTurkishDateTime = (date: string, time: string): string => {
  // Create date with Turkish timezone offset
  return new Date(`${date}T${time}:00+03:00`).toISOString();
};

/**
 * Format date for Turkish locale
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export const formatTurkishDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('tr-TR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time for Turkish locale
 * @param date - Date object or ISO string
 * @returns Formatted time string
 */
export const formatTurkishTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Check if a date is today in Turkish timezone
 * @param date - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export const isTurkishToday = (date: string): boolean => {
  return date === getTurkishToday();
};

/**
 * Check if a date is tomorrow in Turkish timezone
 * @param date - Date string in YYYY-MM-DD format
 * @returns True if the date is tomorrow
 */
export const isTurkishTomorrow = (date: string): boolean => {
  return date === getTurkishTomorrow();
};
