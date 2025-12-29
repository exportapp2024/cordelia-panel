import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Calendar, Phone, Loader2, AlertCircle, RefreshCw, Plus, X, Search, Edit3, ChevronDown, Trash2 } from 'lucide-react';
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

interface AddPatientAccordionProps {
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

const AddPatientAccordion: React.FC<AddPatientAccordionProps> = ({ isOpen, onClose, onAdd, loading }) => {
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
    
    if (!formData.name.trim() || !formData.phone.trim()) return;

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

  return (
    <>
      {/* Mobile Modal View */}
      <div 
        className={`lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ChevronDown className="w-5 h-5 mr-2 text-gray-500" />
                Yeni Hasta Ekle
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
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
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="[&_.react-international-phone-input-container]:h-[42px] [&_.react-international-phone-input]:h-[42px] [&_.react-international-phone-country-selector-button]:h-[42px]">
              <PhoneInputField
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                disabled={loading}
                className="w-full group"
                inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
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
          
          <div className="flex space-x-3 pt-2">
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
              disabled={loading || !formData.name.trim() || !formData.phone.trim()}
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
      </div>

      {/* Desktop Accordion View */}
      <div 
        className={`hidden lg:block absolute top-full right-0 mt-2 w-96 sm:w-[500px] bg-white rounded-lg shadow-lg border border-gray-200 z-40 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <ChevronDown className="w-5 h-5 mr-2 text-gray-500" />
              Yeni Hasta Ekle
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
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
                Telefon <span className="text-red-500">*</span>
              </label>
              <div className="[&_.react-international-phone-input-container]:h-[42px] [&_.react-international-phone-input]:h-[42px] [&_.react-international-phone-country-selector-button]:h-[42px]">
                <PhoneInputField
                  value={formData.phone}
                  onChange={(phone) => setFormData({ ...formData, phone })}
                  disabled={loading}
                  className="w-full group"
                  inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
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
            
            <div className="flex space-x-3 pt-2">
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
                disabled={loading || !formData.name.trim() || !formData.phone.trim()}
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
    </>
  );
};

export const PatientsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients, loading, error, addPatient, updatePatient, deletePatient, refetch } = usePatients(user?.id || null);
  const [editFull, setEditFull] = useState<{
    id: string;
    name: string;
    national_id: string;
    phone: string;
    address: string;
    reason: string;
    notes: string;
  } | null>(null);
  const [deleteConfirmPatientId, setDeleteConfirmPatientId] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to normalize Turkish characters for search
  const normalizeForSearch = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  };

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients;
    }
    const normalizedSearch = normalizeForSearch(searchTerm);
    return patients.filter(patient => {
      const patientName = patient.data.name || '';
      return normalizeForSearch(patientName).includes(normalizedSearch);
    });
  }, [patients, searchTerm]);

  // Helper function to check if current user can edit a patient
  // If created_by_user_id is null/undefined (legacy records), allow editing if it's the user's patient
  // Otherwise, only the creator can edit
  const canEditPatient = (patient: Patient) => {
    if (!patient.created_by_user_id) return true; // Legacy support
    return patient.created_by_user_id === user?.id;
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

  const confirmDeletePatient = async () => {
    if (!deleteConfirmPatientId) return;
    
    try {
      await deletePatient(deleteConfirmPatientId);
      setDeleteConfirmPatientId(null);
    } catch (err) {
      console.error('Error deleting patient:', err);
      // Error will be shown via the error state from the hook
    }
  };

  const cancelDeletePatient = () => {
    setDeleteConfirmPatientId(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hastalar</h1>
            <p className="text-gray-600 mt-1">Hasta kayıtlarınızı yönetin</p>
          </div>
          <div className="relative flex items-center space-x-2">
            <button
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="inline-flex items-center justify-center sm:justify-start px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              title="Yeni Hasta"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Yeni Hasta</span>
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center justify-center sm:justify-start px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <AddPatientAccordion
              isOpen={isAccordionOpen}
              onClose={() => setIsAccordionOpen(false)}
              onAdd={handleAddPatient}
              loading={isAdding}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Search Input */}
        {!loading && patients.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="İsme göre ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Hastalar yükleniyor...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
                <p className="text-gray-600">
                  "{searchTerm}" için hasta bulunamadı.
                </p>
              </>
            ) : (
              <>
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hasta yok</h3>
                <p className="text-gray-600">
                  Telegram üzerinden hasta kayıtları ekleyebilirsiniz.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Hasta No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sahip</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma Tarihi</th>
                      <th className="px-12 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap w-20">
                          <div className="text-sm font-bold text-emerald-600 text-center whitespace-nowrap overflow-hidden text-ellipsis">
                            {patient.patient_number || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="ml-4 flex-1">
                              <div
                                onClick={() => navigate(`/patient-file/${patient.id}`)}
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-emerald-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                                title="Hasta dosyasını açmak için tıklayın"
                              >
                                {patient.data.name || '—'}
                              </div>
                            </div>
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {patient.created_by_user_id === user?.id ? (
                            <span className="text-emerald-600 font-medium">Siz</span>
                          ) : (
                            <span className="text-gray-600">
                              {patient.created_by_name || 'Bilinmiyor'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(patient.created_at)}
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmPatientId(patient.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-gray-100 rounded transition-colors"
                            title="Hastayı sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 flex items-center">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded whitespace-nowrap">
                        {patient.patient_number || '—'}
                      </span>
                      <div
                        onClick={() => navigate(`/patient-file/${patient.id}`)}
                        className="text-lg font-medium text-gray-900 cursor-pointer hover:text-emerald-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                        title="Hasta dosyasını açmak için tıklayın"
                      >
                        {patient.data.name || '—'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmPatientId(patient.id);
                      }}
                      className="p-2 text-red-600 hover:bg-gray-100 rounded transition-colors"
                      title="Hastayı sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    <div className="flex items-center text-gray-500">
                      <EditableCell
                        value={patient.data.phone}
                        patientId={patient.id}
                        field="phone"
                        onSave={handleFieldSave}
                        canEdit={canEditPatient(patient)}
                        isPhone={true}
                        className="flex-1 -ml-2"
                      />
                    </div>
                    <div className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="text-xs text-gray-500 mr-2">Sahip:</span>
                      {patient.created_by_user_id === user?.id ? (
                        <span className="text-emerald-600 font-medium">Siz</span>
                      ) : (
                        <span className="text-gray-600">
                          {patient.created_by_name || 'Bilinmiyor'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{formatDate(patient.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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

      {/* Delete Confirmation Modal */}
      {deleteConfirmPatientId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={cancelDeletePatient}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Hastayı Sil
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bu hastayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={cancelDeletePatient}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDeletePatient}
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
    </>
  );
};
