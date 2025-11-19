import React, { useState, useRef, useEffect } from 'react';
import { User, Calendar, FileEdit, Phone, Loader2, AlertCircle, RefreshCw, MoreHorizontal, Edit3, Trash2, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '../hooks/useAuth';
import { Patient } from '../types';
import { PhoneInputField } from './PhoneInputField';

// Helper function to format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Remove all non-digit characters (+, spaces, dashes, etc.)
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If no digits found, return null
  if (!digitsOnly) return null;
  
  // Return WhatsApp URL
  return `https://wa.me/${digitsOnly}`;
};

interface EditableCellProps {
  value: string | null | undefined;
  patientId: string;
  field: 'name' | 'national_id' | 'phone' | 'address' | 'reason';
  onSave: (patientId: string, field: string, value: string | null) => Promise<void>;
  canEdit: boolean;
  className?: string;
  displayValue?: string | React.ReactNode;
  isPhone?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  patientId,
  field,
  onSave,
  canEdit,
  className = '',
  displayValue,
  isPhone = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneMenu, setShowPhoneMenu] = useState(false);
  const [phoneMenuPosition, setPhoneMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const phoneMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const phoneInputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Fix dropdown position when inside table
  useEffect(() => {
    if (!isPhone || !isEditing) return;

    const fixDropdownPosition = () => {
      const dropdown = document.querySelector('.react-international-phone-country-selector-dropdown') as HTMLElement;
      const button = phoneInputContainerRef.current?.querySelector('.react-international-phone-country-selector-button') as HTMLElement;
      
      if (dropdown && button) {
        const buttonRect = button.getBoundingClientRect();
        // For fixed position, use viewport coordinates (no scroll offset needed)
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${buttonRect.bottom}px`;
        dropdown.style.left = `${buttonRect.left}px`;
        dropdown.style.zIndex = '9999';
      }
    };

    // Fix position when dropdown opens
    const observer = new MutationObserver(() => {
      fixDropdownPosition();
    });

    if (phoneInputContainerRef.current) {
      observer.observe(phoneInputContainerRef.current, {
        childList: true,
        subtree: true
      });
      
      // Also fix on scroll/resize
      window.addEventListener('scroll', fixDropdownPosition, true);
      window.addEventListener('resize', fixDropdownPosition);
      
      // Initial fix
      setTimeout(fixDropdownPosition, 100);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', fixDropdownPosition, true);
      window.removeEventListener('resize', fixDropdownPosition);
    };
  }, [isPhone, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneMenuRef.current && !phoneMenuRef.current.contains(event.target as Node)) {
        setShowPhoneMenu(false);
        setPhoneMenuPosition(null);
      }
    };

    if (showPhoneMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPhoneMenu]);

  const handleDoubleClick = () => {
    if (canEdit && !isSaving) {
      setIsEditing(true);
      setDraftValue(value || '');
      setError(null);
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!value) {
      // If no phone value, just start editing
      if (canEdit && !isSaving) {
        setIsEditing(true);
        setDraftValue('');
        setError(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setPhoneMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
    setShowPhoneMenu(true);
  };

  const handleEditPhone = () => {
    setShowPhoneMenu(false);
    setPhoneMenuPosition(null);
    if (canEdit && !isSaving) {
      setIsEditing(true);
      setDraftValue(value || '');
      setError(null);
    }
  };

  const handleGoToWhatsApp = () => {
    const whatsappUrl = formatPhoneForWhatsApp(value);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
    setShowPhoneMenu(false);
    setPhoneMenuPosition(null);
  };

  const handleSave = async () => {
    if (!canEdit) return;

    const trimmedValue = draftValue.trim() || null;
    const hasChanged = trimmedValue !== (value || null);

    if (!hasChanged) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(patientId, field, trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydetme hatası');
      setDraftValue(value || '');
      // Keep editing mode open on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftValue(value || '');
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    // Use PhoneInputField for phone field
    if (isPhone) {
      return (
        <span ref={phoneInputContainerRef} className="relative inline-block" style={{ margin: '0', padding: '0', minWidth: '200px' }}>
          <PhoneInputField
            value={draftValue}
            onChange={(phone) => setDraftValue(phone)}
            variant="inline"
            onBlur={handleSave}
            disabled={isSaving}
            inputProps={{
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                }
              }
            }}
          />
          {isSaving && (
            <span className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ lineHeight: '1.25rem' }}>
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
            </span>
          )}
          {error && (
            <div className="absolute left-0 top-full mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded shadow z-10 whitespace-nowrap">
              {error}
            </div>
          )}
        </span>
      );
    }

    // Regular input for other fields
    return (
      <span className="relative inline-block" style={{ margin: '0', padding: '0' }}>
        <input
          ref={inputRef}
          type="text"
          value={draftValue}
          onChange={(e) => {
            setDraftValue(e.target.value);
            // Auto-resize input based on content
            if (inputRef.current) {
              inputRef.current.style.width = `${Math.max(50, Math.min(e.target.value.length * 8 + 16, 300))}px`;
            }
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={`px-1 border-0 border-b border-emerald-500 rounded-none focus:outline-none focus:ring-0 focus:border-emerald-500 text-sm bg-transparent ${
            error ? 'border-red-500' : ''
          } ${isSaving ? 'opacity-50' : ''} ${className}`}
          style={{ 
            height: '1.25rem',
            lineHeight: '1.25rem',
            margin: '0',
            paddingTop: '0',
            paddingBottom: '0',
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            boxSizing: 'border-box',
            verticalAlign: 'baseline',
            width: `${Math.max(50, Math.min((draftValue.length || 1) * 8 + 16, 300))}px`,
            display: 'inline-block'
          }}
        />
        {isSaving && (
          <span className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ lineHeight: '1.25rem' }}>
            <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
          </span>
        )}
        {error && (
          <div className="absolute left-0 top-full mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded shadow z-10 whitespace-nowrap">
            {error}
          </div>
        )}
      </span>
    );
  }

  const display = displayValue !== undefined ? displayValue : (value || '—');
  const isClickable = canEdit && !isSaving;

  if (isPhone && !isEditing) {
    const whatsappUrl = value ? formatPhoneForWhatsApp(value) : null;
    return (
      <div className="relative">
        <div
          onClick={handlePhoneClick}
          className={`${isClickable || value ? 'cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors' : ''} ${className}`}
          title={value ? 'Tıklayın: Düzenle veya WhatsApp\'a git' : isClickable ? 'Düzenlemek için tıklayın' : ''}
        >
          {value ? (
            <span className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1">
              <Phone className="w-4 h-4" />
              <span>{value}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>—</span>
            </span>
          )}
        </div>
        {showPhoneMenu && phoneMenuPosition && value && (
          <div
            ref={phoneMenuRef}
            className="fixed z-50 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
            style={{ top: `${phoneMenuPosition.top}px`, left: `${phoneMenuPosition.left}px` }}
          >
            <div className="py-1">
              {canEdit && (
                <button
                  onClick={handleEditPhone}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Düzenle
                </button>
              )}
              {whatsappUrl && (
                <button
                  onClick={handleGoToWhatsApp}
                  className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-gray-50 flex items-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Git
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`${isClickable ? 'cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors' : ''} ${className}`}
      title={isClickable ? 'Düzenlemek için çift tıklayın' : canEdit ? '' : 'Bu kaydı sadece oluşturan kişi düzenleyebilir'}
    >
      {display}
    </div>
  );
};

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (patientData: {
    name: string;
    national_id?: string | null;
    phone?: string | null;
    address?: string | null;
    reason?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  loading: boolean;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onAdd, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    notes: '',
    national_id: '',
    phone: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      await onAdd({
        name: formData.name.trim(),
        national_id: formData.national_id.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        reason: formData.reason.trim() || null,
        notes: formData.notes.trim() || null,
      });
      
      // Reset form
      setFormData({
        name: '',
        reason: '',
        notes: '',
        national_id: '',
        phone: '',
        address: '',
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Yeni Hasta Ekle</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İsim *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TC / Pasaport No
            </label>
            <input
              type="text"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <PhoneInputField
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başvuru Nedeni
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="örn. Migren, Yüksek Tansiyon"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Ek notlar..."
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ekleniyor...
                </>
              ) : (
                'Hasta Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PatientsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, loading, error, addPatient, updateNotes, updatePatient, deletePatient, refetch } = usePatients(user?.id || null);
  const [editingPatient, setEditingPatient] = useState<{ id: string; current: string } | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [editFull, setEditFull] = useState<{
    id: string;
    name: string;
    national_id: string;
    phone: string;
    address: string;
    reason: string;
    notes: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Helper function to check if current user can edit a patient
  // If created_by_user_id is null/undefined (legacy records), allow editing since user_id already matches
  // Otherwise, only the creator can edit
  const canEditPatient = (patient: Patient) => {
    return !patient.created_by_user_id || patient.created_by_user_id === user?.id;
  };

  const handleFieldSave = async (patientId: string, field: string, value: string | null) => {
    await updatePatient(patientId, { [field]: value });
  };

  const handleAddPatient = async (patientData: {
    name: string;
    national_id?: string | null;
    phone?: string | null;
    address?: string | null;
    reason?: string | null;
    notes?: string | null;
  }) => {
    setIsAdding(true);
    try {
      await addPatient(patientData);
    } finally {
      setIsAdding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hastalar</h1>
            <p className="text-gray-600 mt-1">Hasta kayıtlarınızı yönetin</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              title="Yeni Hasta"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Yeni Hasta</span>
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Hastalar yükleniyor...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hasta yok</h3>
            <p className="text-gray-600">
              Telegram üzerinden hasta kayıtları ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasta No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TC / Pasaport No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adres</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başvuru Nedeni</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt Sahibi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notlar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasta Dosyası</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-600 text-center">
                            {patient.patient_number || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="ml-4 flex-1">
                              <EditableCell
                                value={patient.data.name}
                                patientId={patient.id}
                                field="name"
                                onSave={handleFieldSave}
                                canEdit={canEditPatient(patient)}
                                className="text-sm font-medium text-gray-900"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <EditableCell
                            value={patient.data.national_id}
                            patientId={patient.id}
                            field="national_id"
                            onSave={handleFieldSave}
                            canEdit={canEditPatient(patient)}
                            className="text-gray-900"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <EditableCell
                            value={patient.data.phone}
                            patientId={patient.id}
                            field="phone"
                            onSave={handleFieldSave}
                            canEdit={canEditPatient(patient)}
                            isPhone={true}
                            className=""
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <EditableCell
                            value={patient.data.address}
                            patientId={patient.id}
                            field="address"
                            onSave={handleFieldSave}
                            canEdit={canEditPatient(patient)}
                            className="text-gray-900"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <EditableCell
                            value={patient.data.reason}
                            patientId={patient.id}
                            field="reason"
                            onSave={handleFieldSave}
                            canEdit={canEditPatient(patient)}
                            className="text-gray-900 max-w-[130px] truncate"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {canEditPatient(patient) ? (
                            <span className="text-emerald-600 font-medium">(Siz)</span>
                          ) : (
                            <span className="text-gray-600">{patient.created_by_name || 'Bilinmiyor'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => { setEditingPatient({ id: patient.id, current: patient.data.notes || '' }); setNotesDraft(patient.data.notes || ''); }}
                            className="inline-flex items-center p-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={canEditPatient(patient) ? "Notu Gör/Düzenle" : "Bu kaydı sadece oluşturan kişi düzenleyebilir"}
                            aria-label="Notu Gör/Düzenle"
                            disabled={!canEditPatient(patient)}
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/patient-file/${patient.id}`)}
                            className="inline-flex items-center p-2 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            title="Hasta Dosyası"
                            aria-label="Hasta Dosyası"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(patient.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                const button = e.currentTarget;
                                const isOpening = openMenuId !== patient.id;
                                if (isOpening) {
                                  const rect = button.getBoundingClientRect();
                                  setMenuPosition({
                                    top: rect.bottom + 8,
                                    right: window.innerWidth - rect.right,
                                  });
                                  setOpenMenuId(patient.id);
                                } else {
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                }
                              }}
                              className="inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === patient.id}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {openMenuId === patient.id && menuPosition && (
                              <>
                                {/* Backdrop to close on outside click */}
                                <div className="fixed inset-0 z-10" onClick={() => { setOpenMenuId(null); setMenuPosition(null); }}></div>
                                <div 
                                  className="fixed w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                                  style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                                >
                                  <div className="py-1 flex flex-col">
                                    <button
                                      onClick={() => {
                                        if (!canEditPatient(patient)) {
                                          alert('Bu hasta kaydını sadece oluşturan kişi düzenleyebilir');
                                          setOpenMenuId(null);
                                          setMenuPosition(null);
                                          return;
                                        }
                                        setEditFull({
                                          id: patient.id,
                                          name: patient.data.name || '',
                                          national_id: patient.data.national_id || '',
                                          phone: patient.data.phone || '',
                                          address: patient.data.address || '',
                                          reason: patient.data.reason || '',
                                          notes: patient.data.notes || '',
                                        });
                                        setOpenMenuId(null);
                                        setMenuPosition(null);
                                      }}
                                      className={`w-full px-4 py-2 text-left text-sm flex items-center ${
                                        canEditPatient(patient) 
                                          ? 'text-gray-700 hover:bg-gray-50' 
                                          : 'text-gray-400 cursor-not-allowed'
                                      }`}
                                      disabled={!canEditPatient(patient)}
                                    >
                                      <Edit3 className="w-4 h-4 mr-2" /> Düzenle
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!canEditPatient(patient)) {
                                          alert('Bu hasta kaydını sadece oluşturan kişi silebilir');
                                          setOpenMenuId(null);
                                          setMenuPosition(null);
                                          return;
                                        }
                                        setOpenMenuId(null);
                                        setMenuPosition(null);
                                        if (confirm('Bu hastayı silmek istediğinize emin misiniz?')) {
                                          await deletePatient(patient.id);
                                        }
                                      }}
                                      className={`w-full px-4 py-2 text-left text-sm flex items-center ${
                                        canEditPatient(patient) 
                                          ? 'text-red-700 hover:bg-gray-50' 
                                          : 'text-gray-400 cursor-not-allowed'
                                      }`}
                                      disabled={!canEditPatient(patient)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Sil
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {patient.patient_number || '—'}
                          </span>
                        </div>
                        <EditableCell
                          value={patient.data.name}
                          patientId={patient.id}
                          field="name"
                          onSave={handleFieldSave}
                          canEdit={canEditPatient(patient)}
                          className="text-lg font-medium text-gray-900"
                        />
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(patient.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const button = e.currentTarget;
                          const isOpening = openMenuId !== patient.id;
                          if (isOpening) {
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 8,
                              right: window.innerWidth - rect.right,
                            });
                            setOpenMenuId(patient.id);
                          } else {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          }
                        }}
                        className="inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === patient.id}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openMenuId === patient.id && menuPosition && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => { setOpenMenuId(null); setMenuPosition(null); }}></div>
                          <div 
                            className="fixed w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20"
                            style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                          >
                            <div className="py-1 flex flex-col">
                              <button
                                onClick={() => {
                                  if (!canEditPatient(patient)) {
                                    alert('Bu hasta kaydını sadece oluşturan kişi düzenleyebilir');
                                    setOpenMenuId(null);
                                    setMenuPosition(null);
                                    return;
                                  }
                                  setEditFull({
                                    id: patient.id,
                                    name: patient.data.name || '',
                                    national_id: patient.data.national_id || '',
                                    phone: patient.data.phone || '',
                                    address: patient.data.address || '',
                                    reason: patient.data.reason || '',
                                    notes: patient.data.notes || '',
                                  });
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center ${
                                  canEditPatient(patient) 
                                    ? 'text-gray-700 hover:bg-gray-50' 
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                                disabled={!canEditPatient(patient)}
                              >
                                <Edit3 className="w-4 h-4 mr-2" /> Düzenle
                              </button>
                              <button
                                onClick={async () => {
                                  if (!canEditPatient(patient)) {
                                    alert('Bu hasta kaydını sadece oluşturan kişi silebilir');
                                    setOpenMenuId(null);
                                    setMenuPosition(null);
                                    return;
                                  }
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                  if (confirm('Bu hastayı silmek istediğinize emin misiniz?')) {
                                    await deletePatient(patient.id);
                                  }
                                }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center ${
                                  canEditPatient(patient) 
                                    ? 'text-red-700 hover:bg-gray-50' 
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                                disabled={!canEditPatient(patient)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Sil
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Kayıt Sahibi:</span>
                      {canEditPatient(patient) ? (
                        <span className="text-emerald-600 font-medium">(Siz)</span>
                      ) : (
                        <span className="text-gray-600">{patient.created_by_name || 'Bilinmiyor'}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">TC / Pasaport:</span>
                      <EditableCell
                        value={patient.data.national_id}
                        patientId={patient.id}
                        field="national_id"
                        onSave={handleFieldSave}
                        canEdit={canEditPatient(patient)}
                        className="text-gray-900 flex-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <EditableCell
                        value={patient.data.phone}
                        patientId={patient.id}
                        field="phone"
                        onSave={handleFieldSave}
                        canEdit={canEditPatient(patient)}
                        isPhone={true}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Adres:</span>
                      <EditableCell
                        value={patient.data.address}
                        patientId={patient.id}
                        field="address"
                        onSave={handleFieldSave}
                        canEdit={canEditPatient(patient)}
                        className="text-gray-900 break-words flex-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Başvuru nedeni:</span>
                      <EditableCell
                        value={patient.data.reason}
                        patientId={patient.id}
                        field="reason"
                        onSave={handleFieldSave}
                        canEdit={canEditPatient(patient)}
                        className="text-gray-900 flex-1 truncate"
                      />
                    </div>
                    {patient.data.notes && (
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700">Notlar:</span>
                        <span className="text-gray-900 break-words">{patient.data.notes}</span>
                      </div>
                    )}
                    <div className="pt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => { setEditingPatient({ id: patient.id, current: patient.data.notes || '' }); setNotesDraft(patient.data.notes || ''); }}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canEditPatient(patient) ? "Notu Gör/Düzenle" : "Bu kaydı sadece oluşturan kişi düzenleyebilir"}
                        aria-label="Notu Gör/Düzenle"
                        disabled={!canEditPatient(patient)}
                      >
                        <FileEdit className="w-4 h-4 mr-2" />
                        Notları Düzenle
                      </button>
                      <button
                        onClick={() => navigate(`/patient-file/${patient.id}`)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-medium transition-colors"
                        title="Hasta Dosyası"
                        aria-label="Hasta Dosyası"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Hasta Dosyası
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <AddPatientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddPatient}
          loading={isAdding}
        />

      {/* Notes Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Notları Düzenle</h3>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={6}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingPatient(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (editingPatient) {
                    await updateNotes(editingPatient.id, notesDraft.trim() || null);
                    setEditingPatient(null);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      {editFull && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">Hasta Bilgilerini Düzenle</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={editFull.name}
                  onChange={(e) => setEditFull({ ...editFull, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TC / Pasaport No</label>
                <input
                  type="text"
                  value={editFull.national_id}
                  onChange={(e) => setEditFull({ ...editFull, national_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <PhoneInputField
                  value={editFull.phone}
                  onChange={(phone) => setEditFull({ ...editFull, phone })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={editFull.address}
                  onChange={(e) => setEditFull({ ...editFull, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başvuru Nedeni</label>
                <input
                  type="text"
                  value={editFull.reason}
                  onChange={(e) => setEditFull({ ...editFull, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  rows={4}
                  value={editFull.notes}
                  onChange={(e) => setEditFull({ ...editFull, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setEditFull(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  await updatePatient(editFull.id, {
                    name: editFull.name || null,
                    national_id: editFull.national_id || null,
                    phone: editFull.phone || null,
                    address: editFull.address || null,
                    reason: editFull.reason || null,
                    notes: editFull.notes || null,
                  });
                  setEditFull(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
