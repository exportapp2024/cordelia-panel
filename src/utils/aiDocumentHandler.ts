import { MedicalFileData } from '../types/medicalFile';
import { generateEpicrisisDocument, generateFitToFlightDocument, generateRestReportDocument } from './documentGenerator';

export interface AIDocumentRequest {
  type: 'epicrisis' | 'fitToFlight' | 'restReport';
  language: 'tr' | 'en';
  patientId: string;
}

export const parseDocumentRequest = (message: string): AIDocumentRequest | null => {
  const lowerMessage = message.toLowerCase();
  
  // Check for document type keywords
  let type: 'epicrisis' | 'fitToFlight' | 'restReport' | null = null;
  
  if (lowerMessage.includes('epicrisis') || lowerMessage.includes('epikriz') || lowerMessage.includes('hasta dosyası')) {
    type = 'epicrisis';
  } else if (lowerMessage.includes('uçuş') || lowerMessage.includes('flight') || lowerMessage.includes('uçuşa uygun')) {
    type = 'fitToFlight';
  } else if (lowerMessage.includes('istirahat') || lowerMessage.includes('rest') || lowerMessage.includes('rapor')) {
    type = 'restReport';
  }
  
  if (!type) return null;
  
  // Check for language preference
  let language: 'tr' | 'en' = 'tr'; // Default to Turkish
  if (lowerMessage.includes('english') || lowerMessage.includes('ingilizce')) {
    language = 'en';
  }
  
  return { type, language, patientId: '' }; // patientId will be set by the caller
};

export const generateAIRequestedDocument = async (
  request: AIDocumentRequest,
  medicalFileData: MedicalFileData,
  patientData: any
): Promise<{ url: string; filename: string; type: string }> => {
  let result;
  
  switch (request.type) {
    case 'epicrisis':
      result = await generateEpicrisisDocument(medicalFileData, patientData, request.language);
      return { ...result, type: 'Epicrisis Belgesi' };
    case 'fitToFlight':
      result = await generateFitToFlightDocument(medicalFileData, patientData, request.language);
      return { ...result, type: 'Uçuşa Uygunluk Belgesi' };
    case 'restReport':
      result = await generateRestReportDocument(medicalFileData, patientData, request.language);
      return { ...result, type: 'İstirahat Raporu' };
    default:
      throw new Error('Geçersiz belge türü');
  }
};

export const createDocumentDownloadLink = (
  documentInfo: { url: string; filename: string; type: string }
): string => {
  // Create a unique ID for this download link
  const linkId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store the document info in sessionStorage for retrieval
  sessionStorage.setItem(linkId, JSON.stringify(documentInfo));
  
  return `<a href="#" onclick="window.downloadAIDocument('${linkId}')" class="inline-flex items-center text-blue-600 hover:text-blue-800 underline font-medium">
    📄 ${documentInfo.type} - Buradan indirebilirsiniz
  </a>`;
};

// Global function to handle AI document downloads
declare global {
  interface Window {
    downloadAIDocument: (linkId: string) => void;
  }
}

// Initialize the global download function
if (typeof window !== 'undefined') {
  window.downloadAIDocument = (linkId: string) => {
    const documentInfo = sessionStorage.getItem(linkId);
    if (documentInfo) {
      const { url, filename } = JSON.parse(documentInfo);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      sessionStorage.removeItem(linkId);
      URL.revokeObjectURL(url);
    }
  };
}
