// API Configuration
export const API_CONFIG = {
  // Backend API Base URL - Railway'deki backend URL'inizi buraya yazın
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    MEETINGS: '/meetings',
    PATIENTS: '/patients',
    AGENT: '/agent',
  }
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
