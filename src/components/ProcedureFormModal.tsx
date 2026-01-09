import React, { useState, useEffect } from 'react';
import { X, Clock, Activity, FileText, Syringe, Save, Loader2 } from 'lucide-react';
import { ProcedureItem } from '../types/medicalFile';

interface ProcedureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedure: ProcedureItem) => Promise<void>;
  initialData?: ProcedureItem | null;
  appointmentDate?: string; // To default the date
  isSaving?: boolean;
}

export const ProcedureFormModal: React.FC<ProcedureFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  appointmentDate,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<ProcedureItem>({
    id: '',
    date: '',
    description: '', // Planned procedures
    anesthesiaType: '',
    duration: '',
    notes: '',
    appointment_id: ''
  });
  const [modalHeight, setModalHeight] = useState<string>('auto');
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Reset form for new entry
        setFormData({
          id: Date.now().toString(),
          date: appointmentDate ? appointmentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          description: '',
          anesthesiaType: '',
          duration: '',
          notes: '',
          appointment_id: ''
        });
      }
    }
  }, [isOpen, initialData, appointmentDate]);

  // Match height with AppointmentDetailsModal
  useEffect(() => {
    if (isOpen) {
      const updateHeight = () => {
        // Find the AppointmentDetailsModal element by looking for z-50 modal with "Randevu Detayları" text
        const allModals = document.querySelectorAll('[class*="bg-white rounded-xl shadow-2xl"]');
        let appointmentModal: HTMLElement | null = null;
        
        for (const modal of allModals) {
          const modalElement = modal as HTMLElement;
          // Check if this modal contains "Randevu Detayları" text and is not the ProcedureFormModal (which has xl:absolute)
          if (modalElement.textContent?.includes('Randevu Detayları') && 
              !modalElement.classList.contains('xl:absolute') &&
              modalElement.closest('[class*="z-50"]')) {
            appointmentModal = modalElement;
            break;
          }
        }
        
        if (appointmentModal && modalRef.current) {
          const height = appointmentModal.offsetHeight;
          setModalHeight(`${height}px`);
        }
      };

      // Update height after a short delay to ensure AppointmentDetailsModal is rendered
      const timeoutId = setTimeout(updateHeight, 100);
      
      // Also update on window resize and use MutationObserver to catch dynamic changes
      window.addEventListener('resize', updateHeight);
      
      const observer = new MutationObserver(updateHeight);
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      }

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateHeight);
        observer.disconnect();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <>
      {/* Backdrop - z-[52] (above appointment details modal z-50) */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[52] p-4"
        onClick={onClose}
      >
        {/* Modal - z-[53] (above backdrop) */}
        <div 
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden w-full max-w-md max-h-[90vh] sm:max-h-[calc(100vh-2rem)] xl:fixed xl:left-[calc(50%+240px)] xl:right-auto xl:top-1/2 xl:-translate-y-1/2 xl:w-[400px] xl:max-h-none z-[53]"
          style={{
            ...(typeof window !== 'undefined' && window.innerWidth >= 1280 && modalHeight !== 'auto' ? { height: modalHeight } : {})
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-emerald-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-emerald-600" />
            {initialData ? 'İşlemi Düzenle' : 'Yapılan İşlem Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Description (Planned Procedures) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-gray-400" />
              Yapılan İşlem(ler)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
              rows={3}
              placeholder="Örn: Rinoplasti, Botoks enjeksiyonu..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Anesthesia */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Syringe className="w-4 h-4 mr-1.5 text-gray-400" />
                Anestezi
              </label>
              <input
                type="text"
                value={formData.anesthesiaType}
                onChange={(e) => setFormData({ ...formData, anesthesiaType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                placeholder="Örn: Lokal"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                Süre
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                placeholder="Örn: 45 dk"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
              Operatif / İşlem Notları
            </label>
            <div className="relative">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                rows={4}
                maxLength={400}
                placeholder="İşlem ile ilgili notlar..."
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none bg-white/80 px-1 rounded">
                {400 - (formData.notes?.length || 0)}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !formData.description || !formData.date}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

