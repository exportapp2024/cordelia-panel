import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, Clock, User, RefreshCw, Trash2, Activity, Edit2, Plus, Syringe, FileText } from 'lucide-react';
import { Appointment } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProcedureItem } from '../types/medicalFile';
import { getAppointmentProcedure, saveAppointmentProcedure } from '../utils/appointmentProcedureStorage';
import { ProcedureFormModal } from './ProcedureFormModal';

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (eventId: string, status: 'attended' | 'no_show' | 'cancelled') => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  canModify: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onStatusUpdate,
  onDelete,
  canModify,
  isUpdating = false,
  isDeleting = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmPopupRef = useRef<HTMLDivElement>(null);
  
  // Procedure state
  const [linkedProcedure, setLinkedProcedure] = useState<ProcedureItem | null>(null);
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [isSavingProcedure, setIsSavingProcedure] = useState(false);

  // Load linked procedure when appointment changes
  useEffect(() => {
    if (appointment?.id) {
      const procedure = getAppointmentProcedure(appointment.id);
      setLinkedProcedure(procedure);
    } else {
      setLinkedProcedure(null);
    }
    // Ensure procedure form is closed when modal opens
    setShowProcedureForm(false);
  }, [appointment?.id, isOpen]); // Reload when isOpen changes too

  // Calculate popup position when it should be shown
  useEffect(() => {
    if (showCancelConfirm && cancelButtonRef.current) {
      const buttonRect = cancelButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: buttonRect.top,
        left: buttonRect.right + 8 // 8px margin
      });
    } else {
      setPopupPosition(null);
    }
  }, [showCancelConfirm]);

  // Close confirm popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        confirmPopupRef.current &&
        !confirmPopupRef.current.contains(event.target as Node) &&
        cancelButtonRef.current &&
        !cancelButtonRef.current.contains(event.target as Node)
      ) {
        setShowCancelConfirm(false);
      }
    };

    if (showCancelConfirm) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCancelConfirm]);

  if (!isOpen || !appointment) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayPatientName = (): string => {
    if (!appointment.patients) return 'İsimsiz Hasta';
    
    // Check if patient is deleted
    if (appointment.patients.deleted_at) {
      return appointment.patients.patient_number 
        ? `Silinen Hasta (#${appointment.patients.patient_number})`
        : 'Silinen Hasta';
    }
    
    // Normal patient name display
    if (appointment.patients.data?.name) {
      return appointment.patients.patient_number 
        ? `#${appointment.patients.patient_number} - ${appointment.patients.data.name}`
        : appointment.patients.data.name;
    }
    return 'İsimsiz Hasta';
  };

  const handleSaveProcedure = async (procedure: ProcedureItem) => {
    if (!appointment) return;
    
    setIsSavingProcedure(true);
    try {
      // Add appointment_id if missing (though form should handle it)
      const procedureToSave = {
        ...procedure,
        appointment_id: appointment.id
      };
      
      saveAppointmentProcedure(appointment.id, procedureToSave);
      setLinkedProcedure(procedureToSave);
      setShowProcedureForm(false);
    } catch (error) {
      console.error('Failed to save procedure:', error);
      // Optional: show error toast
    } finally {
      setIsSavingProcedure(false);
    }
  };

  const handleStatusClick = async (status: 'attended' | 'no_show' | 'cancelled') => {
    if (appointment.status === status) return; // Already selected
    
    // For cancelled status, show confirmation popup
    if (status === 'cancelled') {
      setShowCancelConfirm(true);
      return;
    }
    
    await onStatusUpdate(appointment.id, status);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    await onStatusUpdate(appointment.id, 'cancelled');
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      await onDelete(appointment.id);
      onClose();
    }
  };

  const handlePatientClick = () => {
    if (appointment.patients?.id) {
      navigate(`/patient-file/${appointment.patients.id}`);
      onClose();
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => {
          // Don't close modal if confirmation popup is open
          if (!showCancelConfirm) {
            onClose();
          }
        }}
      >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Randevu Detayları</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Title and Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1.5">
              {appointment.title}
            </h3>
            {appointment.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{appointment.description}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Tarih</p>
                <p className="text-sm text-gray-600">{formatDate(appointment.start_time)}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Saat</p>
                <p className="text-sm text-gray-600">
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Randevu Sahibi</p>
                <p className="text-sm text-gray-600">
                  {appointment.created_by_name || 
                   (appointment.created_by === user?.id ? user?.name || 'Siz' : 'Bilinmiyor')}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          {appointment.patients && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 mb-1">Hasta</p>
                  {appointment.patients.deleted_at ? (
                    <span className="text-sm text-gray-500 italic">
                      {displayPatientName()}
                    </span>
                  ) : (
                    <button
                      onClick={handlePatientClick}
                      className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors"
                    >
                      {displayPatientName()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Procedure Info */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Yapılan İşlem/Tedavi Bilgileri</p>
              {canModify && linkedProcedure && (
                <button
                  onClick={() => setShowProcedureForm(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Düzenle
                </button>
              )}
            </div>

            {linkedProcedure ? (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Activity className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 break-words flex-1">
                        {linkedProcedure.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0 items-end sm:items-center">
                        {linkedProcedure.anesthesiaType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                            <Syringe className="w-3 h-3 mr-1" />
                            {linkedProcedure.anesthesiaType}
                          </span>
                        )}
                        {linkedProcedure.duration && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1" />
                            {linkedProcedure.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {linkedProcedure.notes && (
                      <div className="flex items-start text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                        <FileText className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" />
                        <p className="break-words line-clamp-3">{linkedProcedure.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              canModify && (
                <button
                  onClick={() => setShowProcedureForm(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Yapılan İşlem Ekle</span>
                </button>
              )
            )}
          </div>

          {/* Status Selection */}
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Durum</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleStatusClick('attended')}
                disabled={isUpdating}
                className={`flex-1 px-4 h-10 text-sm font-medium rounded-lg border-2 ${
                  appointment.status === 'attended'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
              >
                <span>Geldi</span>
              </button>
              
              <button
                onClick={() => handleStatusClick('no_show')}
                disabled={isUpdating}
                className={`flex-1 px-4 h-10 text-sm font-medium rounded-lg border-2 ${
                  appointment.status === 'no_show'
                    ? 'bg-yellow-600 border-yellow-600 text-white'
                    : 'bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
              >
                <span>Gelmedi</span>
              </button>
              
              <div className="relative flex-1">
                <button
                  ref={cancelButtonRef}
                  onClick={() => handleStatusClick('cancelled')}
                  disabled={isUpdating}
                  className={`w-full px-4 h-10 text-sm font-medium rounded-lg border-2 whitespace-nowrap ${
                    appointment.status === 'cancelled'
                      ? 'bg-red-600 border-red-700 text-white'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                >
                  <span>Randevu İptal</span>
                </button>
                
                {/* Confirmation Popup */}
                {showCancelConfirm && popupPosition && (
                  <div
                    ref={confirmPopupRef}
                    className="fixed bg-white border-2 border-red-200 rounded-lg shadow-lg p-3 z-[60] min-w-[180px]"
                    style={{
                      top: `${popupPosition.top}px`,
                      left: `${popupPosition.left}px`,
                      animation: 'slideInFromLeft 0.2s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Emin misiniz?
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmCancel();
                        }}
                        disabled={isUpdating}
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Evet
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelConfirm(false);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {canModify && onDelete && (
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm sm:text-base border border-red-300 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Siliniyor...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Sil</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      </div>

      <ProcedureFormModal
        isOpen={showProcedureForm}
        onClose={() => setShowProcedureForm(false)}
        onSave={handleSaveProcedure}
        initialData={linkedProcedure}
        appointmentDate={appointment.start_time}
        isSaving={isSavingProcedure}
      />
    </>
  );
};

