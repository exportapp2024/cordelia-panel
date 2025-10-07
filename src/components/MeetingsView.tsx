import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, RefreshCw, Settings, ExternalLink, Plus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl } from '../lib/api';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export const MeetingsView: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });

  // Check calendar connection status
  const checkConnection = useCallback(async () => {
    if (!user?.id) return false;
    
    setCheckingConnection(true);
    try {
      const response = await fetch(buildApiUrl(`calendar/status/${user.id}`));
      const data = await response.json();
      setIsConnected(data.connected);
      return data.connected;
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      return false;
    } finally {
      setCheckingConnection(false);
    }
  }, [user?.id]);

  // Get calendar events
  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/events/${user.id}`));
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      } else {
        // Check if token expired
        if (data.error?.includes('invalid_grant') || data.error?.includes('expired') || data.error?.includes('revoked')) {
          setIsConnected(false);
          setError('Google Calendar bağlantınızın süresi dolmuş. Lütfen tekrar bağlayın.');
        } else {
          throw new Error(data.error || 'Failed to fetch events');
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching events:', error);
      const errorMsg = error instanceof Error ? error.message : 'Etkinlikler yüklenirken bir hata oluştu';
      if (errorMsg.includes('invalid_grant') || errorMsg.includes('expired') || errorMsg.includes('revoked')) {
        setIsConnected(false);
        setError('Google Calendar bağlantınızın süresi dolmuş. Lütfen tekrar bağlayın.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get Google Calendar auth URL
  const getAuthUrl = async () => {
    if (!user?.id) {
      setError('Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl(`calendar/auth-url/${user.id}`));
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      } else {
        throw new Error(data.error || 'Auth URL alınamadı');
      }
    } catch (error: unknown) {
      console.error('Error getting auth URL:', error);
      setError(error instanceof Error ? error.message : 'Yetkilendirme URL\'si alınırken bir hata oluştu');
    }
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      // Check URL parameters for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const connected = urlParams.get('connected');
      const error = urlParams.get('error');
      
      if (connected === 'true') {
        setError(null);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Force connection check
        const isConnected = await checkConnection();
        if (isConnected) {
          await fetchEvents();
        }
        return;
      }
      
      if (error) {
        setError('Google Calendar bağlantısı başarısız oldu. Lütfen tekrar deneyin.');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Normal initialization
      const isConnected = await checkConnection();
      if (isConnected) {
        await fetchEvents();
      }
    };
    
    initialize();
  }, [checkConnection, fetchEvents]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create new appointment
  const createAppointment = async () => {
    if (!user?.id || !formData.title || !formData.date || !formData.time) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`calendar/events/${user.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          time: formData.time,
          duration_minutes: parseInt(formData.duration),
          notes: formData.notes || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
        await fetchEvents();
      } else {
        throw new Error(data.error || 'Randevu oluşturulamadı');
      }
    } catch (error: unknown) {
      console.error('Error creating appointment:', error);
      setError(error instanceof Error ? error.message : 'Randevu oluşturulurken bir hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  if (checkingConnection) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Takvim bağlantısı kontrol ediliyor...</span>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
          <p className="text-gray-600">Takviminizi yönetmek için Google Calendar'ı bağlayın</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Google Calendar Bağlantısı
            </h2>
            <p className="text-gray-600 mb-6">
              Randevularınızı yönetmek için 
              Google Calendar hesabınızı bağlayın.
            </p>
            
            <button
              onClick={getAuthUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Google Calendar'ı Bağla</span>
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Google hesabınızla güvenli bir şekilde bağlanacaksınız
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
          <p className="text-gray-600">Randevularınızı görüntüleyin ve yönetin</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Randevu</span>
          </button>
          
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
          
          <button
            onClick={getAuthUrl}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mr-3" />
            <span className="text-gray-600">Etkinlikler yükleniyor...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz etkinlik yok
            </h3>
            <p className="text-gray-600 mb-4">
              Google Calendar'ınızda henüz etkinlik bulunmuyor.
            </p>
            <button
              onClick={fetchEvents}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Yenile
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.summary}
                  </h3>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-3">{event.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(event.start.dateTime || event.start.date || '')}
                      </span>
                    </div>
                    
                    {event.start.dateTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime || '')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Katılımcılar:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.map((attendee, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                          >
                            {attendee.displayName || attendee.email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Randevu Oluştur</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Toplantı: Ahmet Yılmaz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saat <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Süre (dakika)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
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
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', date: '', time: '', duration: '60', notes: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={createAppointment}
                disabled={creating || !formData.title || !formData.date || !formData.time}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
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
    </div>
  );
};