import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Edit2,
  Trash2,
  Check,
  Syringe,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchMedicalFile, updateMedicalFile, fetchPatientAppointments, createPatientAppointment, type Appointment } from '../lib/api';
import { 
  MedicalFileData, 
  MEDICAL_FILE_FIELDS, 
  MEDICAL_FILE_TABS, 
  createEmptyMedicalFile,
  ProcedureItem
} from '../types/medicalFile';
import DocumentGenerationModal from './DocumentGenerationModal';
import { EnhancedChatWidget } from './EnhancedChatWidget';
import { PhoneInputField } from './PhoneInputField';

interface NotesDisplayProps {
  notes: string;
  procedureId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

const NotesDisplay: React.FC<NotesDisplayProps> = ({ notes, procedureId, isExpanded, onToggleExpand }) => {
  const notesRef = useRef<HTMLParagraphElement>(null);
  const [showExpandButton, setShowExpandButton] = useState(false);
  
  useEffect(() => {
    if (notesRef.current && !isExpanded) {
      // Check if content exceeds 2 lines
      const lineHeight = 20; // text-sm line height in pixels
      const maxHeight = lineHeight * 2; // 2 lines
      if (notesRef.current.scrollHeight > maxHeight) {
        setShowExpandButton(true);
      } else {
        setShowExpandButton(false);
      }
    } else {
      setShowExpandButton(false);
    }
  }, [notes, isExpanded]);
  
  return (
    <div className="mt-1">
      <p 
        ref={notesRef}
        className={`text-sm text-gray-600 break-words ${
          !isExpanded && showExpandButton ? 'line-clamp-2' : ''
        }`}
      >
        <span className="font-medium">Not:</span> {notes}
      </p>
      {showExpandButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(procedureId);
          }}
          className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
        >
          <span>{isExpanded ? 'Daha az göster' : 'Daha fazla göster'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};

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
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [appointmentFormData, setAppointmentFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });
  
  // Procedure editing state
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmProcedureId, setDeleteConfirmProcedureId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

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
        
        // Ensure procedures array exists for backward compatibility
        if (!updatedMedicalFile.procedureInfo.procedures) {
          updatedMedicalFile.procedureInfo.procedures = [];
        }
        
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
      // Sort by start_time: most recent (closest to today) first, oldest last
      // This means: future appointments ascending (closest first), past appointments descending (most recent past first)
      const now = new Date().getTime();
      const sorted = response.events.sort((a, b) => {
        const timeA = new Date(a.start_time).getTime();
        const timeB = new Date(b.start_time).getTime();
        // If both are future or both are past, sort by time (ascending for future, descending for past)
        if (timeA >= now && timeB >= now) {
          // Both future: ascending (closest first)
          return timeA - timeB;
        } else if (timeA < now && timeB < now) {
          // Both past: descending (most recent past first)
          return timeB - timeA;
        } else {
          // One future, one past: future comes first
          return timeA >= now ? -1 : 1;
        }
      });
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

  // Procedure handlers
  const handleAddProcedure = () => {
    if (isReadOnly) return;
    
    // Validate required fields
    if (!medicalFileData.procedureInfo.plannedProcedures || 
        !medicalFileData.procedureInfo.duration || 
        !medicalFileData.procedureInfo.operativeNotes) {
      return;
    }
    
    const newProcedureId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newProcedure: ProcedureItem = {
      id: newProcedureId,
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      description: medicalFileData.procedureInfo.plannedProcedures || '',
      anesthesiaType: medicalFileData.procedureInfo.anesthesiaType || '',
      duration: medicalFileData.procedureInfo.duration || '',
      notes: medicalFileData.procedureInfo.operativeNotes || ''
    };
    
    setMedicalFileData(prev => ({
      ...prev,
      procedureInfo: {
        ...prev.procedureInfo,
        procedures: [newProcedure, ...(prev.procedureInfo.procedures || [])],
        // Clear the form fields
        plannedProcedures: '',
        anesthesiaType: '',
        duration: '',
        operativeNotes: ''
      }
    }));
  };

  const handleUpdateProcedure = (procedureId: string, field: keyof ProcedureItem, value: string) => {
    if (isReadOnly) return;
    
    setMedicalFileData(prev => ({
      ...prev,
      procedureInfo: {
        ...prev.procedureInfo,
        procedures: (prev.procedureInfo.procedures || []).map(proc =>
          proc.id === procedureId ? { ...proc, [field]: value } : proc
        )
      }
    }));
  };

  const handleDeleteProcedure = (procedureId: string) => {
    if (isReadOnly) return;
    setDeleteConfirmProcedureId(procedureId);
  };

  const confirmDeleteProcedure = () => {
    if (!deleteConfirmProcedureId) return;
    
    setMedicalFileData(prev => ({
      ...prev,
      procedureInfo: {
        ...prev.procedureInfo,
        procedures: (prev.procedureInfo.procedures || []).filter(proc => proc.id !== deleteConfirmProcedureId)
      }
    }));
    setDeleteConfirmProcedureId(null);
  };

  const cancelDeleteProcedure = () => {
    setDeleteConfirmProcedureId(null);
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

      case 'procedureInfo': {
        const sortedProcedures = [...(medicalFileData.procedureInfo.procedures || [])].sort((a, b) => {
          // Sort by date descending (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  {getTabIcon(activeSection?.icon || 'Activity')}
                  <span className="ml-2">{activeSection?.label}</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">Yapılan işlem ve tedavi detayları</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={handleAddProcedure}
                  disabled={
                    !medicalFileData.procedureInfo.plannedProcedures ||
                    !medicalFileData.procedureInfo.duration ||
                    !medicalFileData.procedureInfo.operativeNotes
                  }
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    !medicalFileData.procedureInfo.plannedProcedures ||
                    !medicalFileData.procedureInfo.duration ||
                    !medicalFileData.procedureInfo.operativeNotes
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </button>
              )}
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {MEDICAL_FILE_FIELDS.procedureInfo.slice(0, 3).map((field) => {
                  const rawValue = medicalFileData.procedureInfo[field.key as keyof typeof medicalFileData.procedureInfo];
                  const value = typeof rawValue === 'string' ? rawValue : '';
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange('procedureInfo', field.key, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={isReadOnly}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Operatif / İşlem Notları
                </label>
                <div className="relative">
                  <textarea
                    value={medicalFileData.procedureInfo.operativeNotes}
                    onChange={(e) => handleFieldChange('procedureInfo', 'operativeNotes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={6}
                    disabled={isReadOnly}
                    maxLength={400}
                  />
                  {!isReadOnly && (
                    <div className="absolute top-2 right-2 text-xs text-gray-400 opacity-60 pointer-events-none">
                      {400 - (medicalFileData.procedureInfo.operativeNotes?.length || 0)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Yapılan İşlemler Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                
                {sortedProcedures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz işlem eklenmemiş.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedProcedures.map((procedure) => {
                      const isEditing = editingProcedureId === procedure.id;
                      const formattedDate = procedure.date 
                        ? new Date(procedure.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Tarih belirtilmemiş';
                      
                      return (
                        <div
                          key={procedure.id}
                          className={`border rounded-lg transition-all ${
                            isEditing 
                              ? 'border-emerald-300 bg-emerald-50/30 shadow-md' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {isEditing ? (
                            // Edit Mode
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-emerald-700 flex items-center">
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  İşlem Düzenleniyor
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingProcedureId(null)}
                                    className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                                    title="Kaydet"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Tamam
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProcedure(procedure.id)}
                                    className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Sil
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Tarih
                                  </label>
                                  <input
                                    type="date"
                                    value={procedure.date}
                                    onChange={(e) => handleUpdateProcedure(procedure.id, 'date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Anestezi Tipi
                                  </label>
                                  <input
                                    type="text"
                                    value={procedure.anesthesiaType}
                                    onChange={(e) => handleUpdateProcedure(procedure.id, 'anesthesiaType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="Örn: Genel, Lokal, Sedasyon"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Süre
                                  </label>
                                  <input
                                    type="text"
                                    value={procedure.duration}
                                    onChange={(e) => handleUpdateProcedure(procedure.id, 'duration', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    placeholder="Örn: 2 saat"
                                  />
                                </div>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  İşlem Açıklaması
                                </label>
                                <textarea
                                  value={procedure.description}
                                  onChange={(e) => handleUpdateProcedure(procedure.id, 'description', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                  rows={3}
                                  placeholder="Yapılan işlemin detaylı açıklaması..."
                                />
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Notlar
                                </label>
                                <div className="relative">
                                  <textarea
                                    value={procedure.notes}
                                    onChange={(e) => handleUpdateProcedure(procedure.id, 'notes', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                    rows={2}
                                    placeholder="Ek notlar..."
                                    maxLength={400}
                                  />
                                  <div className="absolute top-2 right-2 text-xs text-gray-400 opacity-60 pointer-events-none">
                                    {400 - (procedure.notes?.length || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // View Mode - Compact
                            <div className="p-4 relative">
                              {!isReadOnly && (
                                <div className="absolute top-4 right-4 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === procedure.id ? null : procedure.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                  
                                  {openMenuId === procedure.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setOpenMenuId(null)}
                                      />
                                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                        <button
                                          onClick={() => {
                                            setEditingProcedureId(procedure.id);
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                        >
                                          <Edit2 className="w-4 h-4 mr-2" />
                                          Düzenle
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDeleteProcedure(procedure.id);
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Sil
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              <div className="pr-12 mb-3">
                                {procedure.description ? (
                                  <p className="text-gray-900 font-medium mb-1 break-words">{procedure.description}</p>
                                ) : (
                                  <p className="text-gray-400 italic mb-1">İşlem açıklaması girilmemiş</p>
                                )}
                                
                                {procedure.notes && (
                                  <NotesDisplay
                                    notes={procedure.notes}
                                    procedureId={procedure.id}
                                    isExpanded={expandedNotes.has(procedure.id)}
                                    onToggleExpand={(id) => {
                                      setExpandedNotes(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(id)) {
                                          newSet.delete(id);
                                        } else {
                                          newSet.add(id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  />
                                )}
                              </div>

                              <div className="flex justify-end items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                  <Calendar className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="truncate">{formattedDate}</span>
                                </span>
                                {procedure.anesthesiaType && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                    <Syringe className="w-3 h-3 mr-1 shrink-0" />
                                    <span className="truncate">{procedure.anesthesiaType}</span>
                                  </span>
                                )}
                                {procedure.duration && (
                                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    <Clock className="w-3 h-3 mr-1 shrink-0" />
                                    <span className="truncate">{procedure.duration}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

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
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 0.6;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
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
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mb-4 border ${
                showAppointments
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
              }`}
            >
              <Calendar className={`w-4 h-4 ${showAppointments ? 'text-emerald-600' : 'text-white'}`} />
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
                      onClick={() => {
                        if (showAppointments) {
                          setShowAppointments(false);
                        }
                        setActiveTab(tab.id);
                      }}
                      className={`${
                        activeTab === tab.id && !showAppointments
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'text-gray-700 hover:bg-gray-50 border-gray-200'
                      } flex-shrink-0 px-4 py-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 min-w-[100px]`}
                    >
                      <div className={`${
                        activeTab === tab.id && !showAppointments ? 'text-emerald-600' : 'text-gray-400'
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
                    onClick={() => {
                      if (showAppointments) {
                        setShowAppointments(false);
                      }
                      setActiveTab(tab.id);
                    }}
                    className={`${
                      activeTab === tab.id && !showAppointments
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-50 border-transparent'
                    } w-full text-left px-4 py-3 rounded-lg border transition-colors mb-1 flex items-center space-x-3`}
                  >
                    <div className={`${
                      activeTab === tab.id && !showAppointments ? 'text-emerald-600' : 'text-gray-400'
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Randevular
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Bu hastaya ait randevular</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Show Past Appointments Toggle */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 whitespace-nowrap">Geçmiş</span>
                          <button
                            type="button"
                            onClick={() => setShowPastAppointments(!showPastAppointments)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              showPastAppointments ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                            role="switch"
                            aria-checked={showPastAppointments}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                showPastAppointments ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowCreateAppointmentModal(true)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
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
                    ) : (() => {
                      const now = new Date();
                      const filteredAppointments = showPastAppointments 
                        ? appointments 
                        : appointments.filter(apt => new Date(apt.start_time) >= now);
                      
                      return filteredAppointments.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            {showPastAppointments 
                              ? 'Bu hastaya ait randevu bulunmamaktadır.'
                              : 'Yaklaşan randevu bulunmamaktadır.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredAppointments.map((appointment, index) => {
                            const isPast = new Date(appointment.start_time) < new Date();
                            const shouldAnimate = isPast && showPastAppointments;
                            return (
                            <div
                              key={appointment.id}
                              onClick={() => setSelectedAppointment(appointment)}
                              className={`border rounded-lg p-4 transition-all duration-300 ease-in-out cursor-pointer ${
                                isPast 
                                  ? 'border-gray-200 bg-gray-50' 
                                  : 'border-gray-200 hover:shadow-md hover:border-emerald-300'
                              } ${shouldAnimate ? 'animate-fadeInUp' : isPast ? 'opacity-60' : ''}`}
                              style={shouldAnimate ? {
                                animationDelay: `${index * 0.05}s`,
                                animationFillMode: 'both'
                              } : {}}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className={`text-lg font-semibold mb-2 ${
                                    isPast ? 'text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {appointment.title}
                                  </h3>
                                  <div className={`flex items-center space-x-4 text-sm ${
                                    isPast ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
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
                                    <p className={`text-sm mt-2 ${
                                      isPast ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {appointment.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Randevu Detayları</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedAppointment.title}
                </h3>
                {selectedAppointment.description && (
                  <p className="text-gray-600">{selectedAppointment.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatAppointmentDate(selectedAppointment.start_time)}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatAppointmentTime(selectedAppointment.start_time)} - {formatAppointmentTime(selectedAppointment.end_time)}
                  </span>
                </div>
              </div>

              {selectedAppointment.patients && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Hasta:</span>
                    <span className="text-sm text-gray-600">
                      {selectedAppointment.patients.data?.name || 'İsimsiz Hasta'}
                      {selectedAppointment.patients.patient_number && ` (#${selectedAppointment.patients.patient_number})`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Yeni Randevu Oluştur</h2>
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

            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
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

            <div className="flex items-center justify-end space-x-2 sm:space-x-3 p-3 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
              <button
                onClick={() => {
                  setShowCreateAppointmentModal(false);
                  setAppointmentFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
                }}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={creatingAppointment || !appointmentFormData.title || !appointmentFormData.date || !appointmentFormData.time}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmProcedureId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                İşlemi Sil
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cancelDeleteProcedure}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDeleteProcedure}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sil</span>
                </button>
              </div>
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
    </>
  );
};

export default PatientMedicalFileView;

