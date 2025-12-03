import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Download,
  Calendar,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchMedicalFile, updateMedicalFile, fetchPatientAppointments, createPatientAppointment, type Appointment } from '../lib/api';
import { 
  MedicalFileData, 
  MEDICAL_FILE_FIELDS, 
  MEDICAL_FILE_TABS, 
  createEmptyMedicalFile 
} from '../types/medicalFile';
import DocumentGenerationModal from './DocumentGenerationModal';
import { EnhancedChatWidget } from './EnhancedChatWidget';
import { PhoneInputField } from './PhoneInputField';

const PatientMedicalFileView: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [medicalFileData, setMedicalFileData] = useState<MedicalFileData>(createEmptyMedicalFile());
  const [patientData, setPatientData] = useState<{
    patient_number?: number;
    created_by_user_id?: string;
    created_by_name?: string | null;
    data?: {
      name?: string;
      national_id?: string;
      phone?: string;
      address?: string;
    };
    medical_file?: MedicalFileData;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('patientInfo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [originalData, setOriginalData] = useState<MedicalFileData>(createEmptyMedicalFile());
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Appointment states
  const [showAppointments, setShowAppointments] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [appointmentFormData, setAppointmentFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });

  const loadMedicalFile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMedicalFile(user!.id, patientId!);
      
      // Merge patient data with medical file data
      const { medicalFile } = response;
      if (medicalFile) {
        setPatientData({
          patient_number: medicalFile.patient_number,
          created_by_user_id: medicalFile.created_by_user_id,
          created_by_name: medicalFile.created_by_name,
          data: medicalFile.data,
          medical_file: medicalFile.medical_file as unknown as MedicalFileData
        });
        
        // Check if current user is the creator
        // If created_by_user_id is null (legacy records), allow editing since user_id already matches
        // Otherwise, only the creator can edit
        const canEdit = !medicalFile.created_by_user_id || medicalFile.created_by_user_id === user!.id;
        setIsReadOnly(!canEdit);
        
        // Auto-populate common fields from patient.data
        const updatedMedicalFile = { ...medicalFile.medical_file || createEmptyMedicalFile() } as MedicalFileData;
        
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
        
        setMedicalFileData(updatedMedicalFile as MedicalFileData);
        setOriginalData(updatedMedicalFile as MedicalFileData);
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
  }, [user, patientId]);

  useEffect(() => {
    if (patientId && user?.id) {
      loadMedicalFile();
    }
  }, [patientId, user?.id, loadMedicalFile]);

  // Load appointments when showing appointments view
  const loadAppointments = useCallback(async () => {
    if (!user?.id || !patientId) return;
    
    try {
      setLoadingAppointments(true);
      setError(null);
      const response = await fetchPatientAppointments(user.id, patientId);
      // Sort by start_time (ascending - upcoming first)
      const sorted = response.events.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setAppointments(sorted);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Randevular yüklenirken hata oluştu');
    } finally {
      setLoadingAppointments(false);
    }
  }, [user?.id, patientId]);

  useEffect(() => {
    if (showAppointments && user?.id && patientId) {
      loadAppointments();
    }
  }, [showAppointments, user?.id, patientId, loadAppointments]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(medicalFileData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [medicalFileData, originalData]);

  const handleFieldChange = (section: keyof MedicalFileData, field: string, value: string) => {
    setMedicalFileData(prev => {
      const currentSection = prev[section];
      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  const handleSave = async () => {
    if (!user?.id || !patientId || isReadOnly) return;
    
    try {
      setSaving(true);
      await updateMedicalFile(user.id, patientId, medicalFileData as unknown as Record<string, unknown>);
      setOriginalData(medicalFileData); // Update original data after successful save
      setHasUnsavedChanges(false);
    } catch (err: unknown) {
      console.error('Error saving medical file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hasta dosyası kaydedilirken hata oluştu';
      if (errorMessage.includes('sadece oluşturan kişi')) {
        setError('Bu hasta kaydını sadece oluşturan kişi düzenleyebilir');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      navigate('/dashboard?view=patients');
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitWarning(false);
    navigate('/dashboard?view=patients');
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    setShowExitWarning(false);
    navigate('/dashboard?view=patients');
  };

  const handleCancelExit = () => {
    setShowExitWarning(false);
  };

  // Appointment handlers
  const handleCreateAppointment = async () => {
    if (!user?.id || !patientId || !appointmentFormData.title || !appointmentFormData.date || !appointmentFormData.time) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setCreatingAppointment(true);
    setError(null);

    try {
      await createPatientAppointment(user.id, {
        title: appointmentFormData.title,
        date: appointmentFormData.date,
        time: appointmentFormData.time,
        duration_minutes: parseInt(appointmentFormData.duration),
        notes: appointmentFormData.notes || undefined,
        patient_id: patientId
      });
      
      setShowCreateAppointmentModal(false);
      setAppointmentFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
      await loadAppointments();
    } catch (err: unknown) {
      console.error('Error creating appointment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Randevu oluşturulurken hata oluştu';
      setError(errorMessage);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  {field.key === 'phoneNumber' ? (
                    <PhoneInputField
                      value={medicalFileData.patientInfo.phoneNumber || ''}
                      onChange={(phone) => handleFieldChange('patientInfo', 'phoneNumber', phone)}
                      disabled={isReadOnly}
                      className="w-full group"
                      inputClassName="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 group-focus:ring-2 group-focus:ring-emerald-500 group-focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  ) : (
                    <input
                      type="text"
                      value={medicalFileData.patientInfo[field.key as keyof typeof medicalFileData.patientInfo] || ''}
                      onChange={(e) => handleFieldChange('patientInfo', field.key, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isReadOnly}
                    />
                  )}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={16}
                disabled={isReadOnly}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isReadOnly}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isReadOnly}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isReadOnly}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={6}
                  disabled={isReadOnly}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={16}
                disabled={isReadOnly}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isReadOnly}
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
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDocumentModal(true)}
                className="inline-flex items-center px-4 py-3 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Belge Oluştur</span>
                <span className="sm:hidden">Belge</span>
              </button>
              
              {!isReadOnly && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700">
              Bu hasta kaydını sadece oluşturan kişi düzenleyebilir.
              {patientData?.created_by_name && ` Kayıt sahibi: ${patientData.created_by_name}`}
            </span>
          </div>
        </div>
      )}

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

            {/* Appointments Button */}
            <button
              onClick={() => setShowAppointments(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mb-4"
            >
              <Calendar className="w-5 h-5" />
              <span>Randevular</span>
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Dosya Bölümleri</h2>
              </div>
              
              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden">
              <nav className="flex overflow-x-auto p-2 space-x-2">
                {MEDICAL_FILE_TABS.map((tab) => (
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
                {MEDICAL_FILE_TABS.map((tab) => (
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
                {showAppointments ? (
                  <div className="space-y-6">
                    {/* Appointments Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Randevular
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Bu hastaya ait randevular</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowAppointments(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Dosyaya Dön
                        </button>
                        <button
                          onClick={() => setShowCreateAppointmentModal(true)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Yeni Randevu</span>
                        </button>
                      </div>
                    </div>

                    {/* Appointments List */}
                    {loadingAppointments ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
                        <span className="text-gray-600">Randevular yükleniyor...</span>
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Bu hastaya ait randevu bulunmamaktadır.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {appointment.title}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatAppointmentDate(appointment.start_time)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatAppointmentTime(appointment.start_time)} - {formatAppointmentTime(appointment.end_time)}
                                    </span>
                                  </div>
                                </div>
                                {appointment.description && (
                                  <p className="text-sm text-gray-600 mt-2">{appointment.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  renderSectionContent()
                )}
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

      {/* Document Generation Modal */}
      <DocumentGenerationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        medicalFileData={medicalFileData}
        patientData={patientData as Record<string, unknown> | null}
        userId={user?.id}
        patientId={patientId}
      />

      {/* Create Appointment Modal */}
      {showCreateAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Randevu Oluştur</h2>
              <button
                onClick={() => {
                  setShowCreateAppointmentModal(false);
                  setAppointmentFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="text"
                  value={patientData?.data?.name || 'Hasta seçili'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={appointmentFormData.title}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, title: e.target.value })}
                  placeholder="Örn: Kontrol: Ahmet Yılmaz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={appointmentFormData.date}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saat <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={appointmentFormData.time}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Süre (dakika)
                </label>
                <input
                  type="number"
                  value={appointmentFormData.duration}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, duration: e.target.value })}
                  min="15"
                  step="15"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={appointmentFormData.notes}
                  onChange={(e) => setAppointmentFormData({ ...appointmentFormData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateAppointmentModal(false);
                  setAppointmentFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={creatingAppointment || !appointmentFormData.title || !appointmentFormData.date || !appointmentFormData.time}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {creatingAppointment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Oluşturuluyor...</span>
                  </>
                ) : (
                  <span>Oluştur</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Chat Widget with Document Generation */}
      <EnhancedChatWidget
        medicalFileData={medicalFileData}
        patientData={patientData as Record<string, unknown> | undefined}
        patientId={patientId}
      />
    </div>
  );
};

export default PatientMedicalFileView;

