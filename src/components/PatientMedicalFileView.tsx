import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  FileText, 
  Heart, 
  Stethoscope, 
  Activity, 
  Clipboard, 
  CheckCircle, 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchMedicalFile, updateMedicalFile } from '../lib/api';
import { 
  MedicalFileData, 
  MEDICAL_FILE_FIELDS, 
  MEDICAL_FILE_TABS, 
  createEmptyMedicalFile 
} from '../types/medicalFile';

const PatientMedicalFileView: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [medicalFileData, setMedicalFileData] = useState<MedicalFileData>(createEmptyMedicalFile());
  const [patientData, setPatientData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('patientInfo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [originalData, setOriginalData] = useState<MedicalFileData>(createEmptyMedicalFile());

  useEffect(() => {
    if (patientId && user?.id) {
      loadMedicalFile();
    }
  }, [patientId, user?.id]);

  const loadMedicalFile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMedicalFile(user!.id, patientId!);
      
      // Merge patient data with medical file data
      const { medicalFile } = response;
      if (medicalFile) {
        setPatientData(medicalFile);
        
        // Auto-populate common fields from patient.data
        const updatedMedicalFile = { ...medicalFile.medical_file || createEmptyMedicalFile() };
        
        // Auto-populate from patient.data if available
        if (medicalFile.data) {
          updatedMedicalFile.patientInfo = {
            ...updatedMedicalFile.patientInfo,
            patientNumber: medicalFile.patient_number ? medicalFile.patient_number.toString() : '',
            fullName: medicalFile.data.name || '',
            nationalId: medicalFile.data.national_id || '',
            phoneNumber: medicalFile.data.phone || '',
            address: medicalFile.data.address || '',
          };
        }
        
        setMedicalFileData(updatedMedicalFile);
        setOriginalData(updatedMedicalFile);
      } else {
        const emptyData = createEmptyMedicalFile();
        setMedicalFileData(emptyData);
        setOriginalData(emptyData);
      }
    } catch (err) {
      console.error('Error loading medical file:', err);
      setError('Hasta dosyası yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(medicalFileData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [medicalFileData, originalData]);

  const handleFieldChange = (section: keyof MedicalFileData, field: string, value: string) => {
    setMedicalFileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user?.id || !patientId) return;
    
    try {
      setSaving(true);
      await updateMedicalFile(user.id, patientId, medicalFileData);
      setOriginalData(medicalFileData); // Update original data after successful save
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving medical file:', err);
      setError('Hasta dosyası kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      navigate('/');
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitWarning(false);
    navigate('/');
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    setShowExitWarning(false);
    navigate('/');
  };

  const handleCancelExit = () => {
    setShowExitWarning(false);
  };

  const renderSectionContent = () => {
    const activeSection = MEDICAL_FILE_TABS.find(tab => tab.id === activeTab);
    
    switch (activeTab) {
      case 'patientInfo':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'User')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Hastanın temel bilgileri ve kimlik verileri</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MEDICAL_FILE_FIELDS.patientInfo.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={medicalFileData.patientInfo[field.key as keyof typeof medicalFileData.patientInfo] || ''}
                    onChange={(e) => handleFieldChange('patientInfo', field.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'admissionReason':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'FileText')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Hastanın şikâyeti ve talep edilen tedavi detayları</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Başvuru Nedeni
              </label>
              <textarea
                value={medicalFileData.admissionReason}
                onChange={(e) => setMedicalFileData(prev => ({ ...prev, admissionReason: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={16}
              />
            </div>
          </div>
        );

      case 'generalHealthHistory':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'Heart')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Hastanın genel sağlık durumu ve geçmiş tıbbi öyküsü</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MEDICAL_FILE_FIELDS.generalHealthHistory.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={medicalFileData.generalHealthHistory[field.key as keyof typeof medicalFileData.generalHealthHistory] || ''}
                    onChange={(e) => handleFieldChange('generalHealthHistory', field.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'preoperativeEvaluation':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'Stethoscope')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Ameliyat öncesi değerlendirme ve muayene bulguları</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MEDICAL_FILE_FIELDS.preoperativeEvaluation.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={medicalFileData.preoperativeEvaluation[field.key as keyof typeof medicalFileData.preoperativeEvaluation] || ''}
                    onChange={(e) => handleFieldChange('preoperativeEvaluation', field.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'procedureInfo':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'Activity')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Yapılan işlem ve tedavi detayları</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {MEDICAL_FILE_FIELDS.procedureInfo.slice(0, 3).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={medicalFileData.procedureInfo[field.key as keyof typeof medicalFileData.procedureInfo] || ''}
                      onChange={(e) => handleFieldChange('procedureInfo', field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Operatif / İşlem Notları
                </label>
                <textarea
                  value={medicalFileData.procedureInfo.operativeNotes}
                  onChange={(e) => handleFieldChange('procedureInfo', 'operativeNotes', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  rows={6}
                />
              </div>
            </div>
          </div>
        );

      case 'followUpNotes':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'Clipboard')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Hasta takip süreci ve gözlemler</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Takip Notları
              </label>
              <textarea
                value={medicalFileData.followUpNotes}
                onChange={(e) => setMedicalFileData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={16}
              />
            </div>
          </div>
        );

      case 'dischargeRecommendations':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                {getTabIcon(activeSection?.icon || 'CheckCircle')}
                <span className="ml-2">{activeSection?.label}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Taburculuk sonrası öneriler ve takip planı</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {MEDICAL_FILE_FIELDS.dischargeRecommendations.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={medicalFileData.dischargeRecommendations[field.key as keyof typeof medicalFileData.dischargeRecommendations] || ''}
                    onChange={(e) => handleFieldChange('dischargeRecommendations', field.key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTabIcon = (iconName: string) => {
    const iconMap = {
      User,
      FileText,
      Heart,
      Stethoscope,
      Activity,
      Clipboard,
      CheckCircle
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Hasta dosyası yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center px-4 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Hasta Listesi</span>
                <span className="sm:hidden">Geri</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Cordelia</h1>
                <p className="text-sm text-gray-600">Hasta Yönetim Sistemi</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className={`inline-flex items-center px-5 py-3 rounded-lg transition-colors shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {hasUnsavedChanges ? 'Kaydet' : 'Kaydedildi'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* Patient Info Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Hasta Dosyası</h1>
                {patientData?.patient_number && (
                  <div className="mb-3">
                    <span className="inline-block text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      Hasta No: {patientData.patient_number}
                    </span>
                  </div>
                )}
                {patientData?.data?.name && (
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-emerald-700">{patientData.data.name}</p>
                    {patientData.data.national_id && (
                      <p className="text-sm text-gray-600">TC: {patientData.data.national_id}</p>
                    )}
                    {patientData.data.phone && (
                      <p className="text-sm text-gray-600">Tel: {patientData.data.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Dosya Bölümleri</h2>
              </div>
              
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden">
                <nav className="flex overflow-x-auto p-2 space-x-2">
                  {MEDICAL_FILE_TABS.map((tab, index) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'text-gray-700 hover:bg-gray-50 border-gray-200'
                      } flex-shrink-0 px-4 py-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 min-w-[100px]`}
                    >
                      <div className={`${
                        activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        {getTabIcon(tab.icon)}
                      </div>
                      <div className="text-xs font-medium text-center leading-tight">
                        {tab.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Desktop: Vertical list */}
              <nav className="hidden lg:block p-2">
                {MEDICAL_FILE_TABS.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-50 border-transparent'
                    } w-full text-left px-4 py-3 rounded-lg border transition-colors mb-1 flex items-center space-x-3`}
                  >
                    <div className={`${
                      activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400'
                    } flex-shrink-0`}>
                      {getTabIcon(tab.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tab.label}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 lg:p-8">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Kaydedilmemiş Değişiklikler</h3>
            <p className="text-gray-600 mb-6">
              Hasta dosyasında kaydedilmemiş değişiklikleriniz var. Ne yapmak istiyorsunuz?
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSaveAndExit}
                disabled={saving}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet ve Çık
                  </>
                )}
              </button>
              
              <button
                onClick={handleExitWithoutSaving}
                disabled={saving}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Kaydetmeden Çık
              </button>
              
              <button
                onClick={handleCancelExit}
                disabled={saving}
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicalFileView;
