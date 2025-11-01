import React, { useState } from 'react';
import { X, FileText, Plane, Bed, Download, Loader2 } from 'lucide-react';
import { MedicalFileData } from '../types/medicalFile';
import { generateEpicrisisDocument, generateFitToFlightDocument, generateRestReportDocument } from '../utils/documentGenerator';
import { buildApiUrl } from '../lib/api';

interface DocumentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicalFileData: MedicalFileData;
  patientData: any;
  userId?: string;
  patientId?: string;
}

type DocumentType = 'epicrisis' | 'fitToFlight' | 'restReport';
type Language = 'tr' | 'en';

const DocumentGenerationModal: React.FC<DocumentGenerationModalProps> = ({
  isOpen,
  onClose,
  medicalFileData,
  patientData,
  userId,
  patientId
}) => {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('tr');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const documentTypes = [
    {
      id: 'epicrisis' as DocumentType,
      title: 'Epicrisis Belgesi',
      titleEn: 'Epicrisis Document',
      description: 'Hasta dosyası özet belgesi',
      descriptionEn: 'Patient file summary document',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      id: 'fitToFlight' as DocumentType,
      title: 'Uçuşa Uygunluk Belgesi',
      titleEn: 'Fit to Flight Certificate',
      description: 'Uçuş için tıbbi uygunluk belgesi',
      descriptionEn: 'Medical fitness certificate for flight',
      icon: Plane,
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'restReport' as DocumentType,
      title: 'İstirahat Raporu',
      titleEn: 'Rest Report',
      description: 'Tıbbi istirahat raporu',
      descriptionEn: 'Medical rest report',
      icon: Bed,
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    }
  ];

  const handleGenerateDocument = async () => {
    if (!selectedDocumentType) return;

    setIsGenerating(true);
    try {
      // If English is selected, translate the medical file data first
      let finalMedicalFileData = medicalFileData;
      
      if (selectedLanguage === 'en' && userId && patientId) {
        try {
          const response = await fetch(
            buildApiUrl(`users/${userId}/patients/${patientId}/medical-file/translate`),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                medicalFileData: medicalFileData,
                targetLanguage: 'en'
              })
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            finalMedicalFileData = result.translatedMedicalFileData;
          } else {
            console.warn('Translation failed, using original data');
            // Fallback to original data
            finalMedicalFileData = medicalFileData;
          }
        } catch (translationError) {
          console.error('Translation error:', translationError);
          // Fallback to original data
          finalMedicalFileData = medicalFileData;
        }
      }
      
      let generatedDocument;
      
      switch (selectedDocumentType) {
        case 'epicrisis':
          generatedDocument = await generateEpicrisisDocument(finalMedicalFileData, patientData, selectedLanguage);
          break;
        case 'fitToFlight':
          generatedDocument = await generateFitToFlightDocument(finalMedicalFileData, patientData, selectedLanguage);
          break;
        case 'restReport':
          generatedDocument = await generateRestReportDocument(finalMedicalFileData, patientData, selectedLanguage);
          break;
        default:
          throw new Error('Geçersiz belge türü');
      }

      // Download the generated PDF
      const link = document.createElement('a');
      link.href = generatedDocument.url;
      link.download = generatedDocument.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onClose();
    } catch (error) {
      console.error('Belge oluşturma hatası:', error);
      alert('Belge oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Belge Oluştur</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Dil Seçimi</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedLanguage('tr')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  selectedLanguage === 'tr'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🇹🇷</span>
                <span className="font-medium">Türkçe</span>
              </button>
              
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  selectedLanguage === 'en'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium">English</span>
              </button>
            </div>
          </div>

          {/* Document Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Belge Türü</h3>
            <div className="space-y-3">
              {documentTypes.map((docType) => {
                const Icon = docType.icon;
                return (
                  <button
                    key={docType.id}
                    onClick={() => setSelectedDocumentType(docType.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedDocumentType === docType.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${docType.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {selectedLanguage === 'tr' ? docType.title : docType.titleEn}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedLanguage === 'tr' ? docType.description : docType.descriptionEn}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleGenerateDocument}
            disabled={!selectedDocumentType || isGenerating}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Belge Oluştur</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerationModal;
