import React, { useState } from 'react';
import { User, Calendar, FileEdit, Phone, Loader2, AlertCircle, RefreshCw, MoreHorizontal, Edit3, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '../hooks/useAuth';
import { Patient } from '../types';

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
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.data.name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.data.national_id || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.data.phone || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.data.address || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.data.reason || '—'}</td>
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
                              onClick={() => setOpenMenuId((prev) => (prev === patient.id ? null : patient.id))}
                              className="inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === patient.id}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {openMenuId === patient.id && (
                              <>
                                {/* Backdrop to close on outside click */}
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                                <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                  <div className="py-1 flex flex-col">
                                    <button
                                      onClick={() => {
                                        if (!canEditPatient(patient)) {
                                          alert('Bu hasta kaydını sadece oluşturan kişi düzenleyebilir');
                                          setOpenMenuId(null);
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
                                          return;
                                        }
                                        setOpenMenuId(null);
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
                        <h3 className="text-lg font-medium text-gray-900">{patient.data.name || '—'}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(patient.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId((prev) => (prev === patient.id ? null : patient.id))}
                        className="inline-flex items-center p-2 rounded-md hover:bg-gray-100"
                        aria-haspopup="true"
                        aria-expanded={openMenuId === patient.id}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openMenuId === patient.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1 flex flex-col">
                              <button
                                onClick={() => {
                                  if (!canEditPatient(patient)) {
                                    alert('Bu hasta kaydını sadece oluşturan kişi düzenleyebilir');
                                    setOpenMenuId(null);
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
                                    return;
                                  }
                                  setOpenMenuId(null);
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
                    {patient.data.national_id && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">TC / Pasaport:</span>
                        <span className="text-gray-900">{patient.data.national_id}</span>
                      </div>
                    )}
                    {patient.data.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{patient.data.phone}</span>
                      </div>
                    )}
                    {patient.data.address && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Adres:</span>
                        <span className="text-gray-900 break-words">{patient.data.address}</span>
                      </div>
                    )}
                    {patient.data.reason && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Başvuru nedeni:</span>
                        <span className="text-gray-900 break-words">{patient.data.reason}</span>
                      </div>
                    )}
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
                <input
                  type="text"
                  value={editFull.phone}
                  onChange={(e) => setEditFull({ ...editFull, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
