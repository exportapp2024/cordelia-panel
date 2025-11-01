import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, Settings, ExternalLink, Plus, X, CheckCircle, XCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl } from '../lib/api';
import { useTeam } from '../hooks/useTeam';
import { Calendar, momentLocalizer, SlotInfo, Event as RBCEvent, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Configure moment to use Turkish locale
moment.locale('tr');

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

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
  creator?: {
    email: string;
    displayName?: string;
  };
  createdBy?: string; // User ID who created the event
}

// Extended event type for react-big-calendar
interface CalendarEventRBC extends RBCEvent {
  resource: CalendarEvent;
}

export const MeetingsView: React.FC = () => {
  const { user } = useAuth();
  const { pendingInvitations, acceptInvitation, rejectInvitation } = useTeam(user?.id || null);
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
  // const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);

  // Convert CalendarEvent to react-big-calendar Event format
  const convertToRBCEvent = (event: CalendarEvent): CalendarEventRBC => {
    const startDate = event.start.dateTime 
      ? new Date(event.start.dateTime) 
      : new Date(event.start.date || '');
    const endDate = event.end.dateTime 
      ? new Date(event.end.dateTime) 
      : new Date(event.end.date || '');

    return {
      title: event.summary,
      start: startDate,
      end: endDate,
      resource: event
    };
  };

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const newDate = moment(currentDate).subtract(1, 'week').toDate();
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newDate = moment(currentDate).add(1, 'week').toDate();
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle slot selection (clicking on empty time slot)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = moment(slotInfo.start);
    const formattedDate = start.format('YYYY-MM-DD');
    const formattedTime = start.format('HH:mm');
    
    setFormData({
      title: '',
      date: formattedDate,
      time: formattedTime,
      duration: '60',
      notes: ''
    });
    setShowCreateModal(true);
  };

  // Handle event selection (clicking on an event)
  const handleSelectEvent = (event: CalendarEventRBC) => {
    setSelectedEvent(event.resource);
  };

  // Event style getter for custom colors
  const eventStyleGetter = (_event: CalendarEventRBC) => {
    void _event;
    const backgroundColor = '#10b981'; // emerald-500
    const style = {
      backgroundColor,
      borderRadius: '4px',
      color: 'white',
      border: 'none',
      borderLeft: '3px solid #059669',
      display: 'block',
      padding: '2px 5px',
      fontSize: '12px',
      fontWeight: 500
    };
    return { style };
  };

  // DnD: move event (drag & drop)
  const handleEventDrop = async ({ event, start, end }: { event: CalendarEventRBC; start: Date; end: Date }) => {
    if (!user?.id) return;
    const original = event.resource;
    if (!original) return;
    if (!canModifyEvent(original)) {
      setError('Bu etkinliği sadece oluşturan kişi taşıyabilir.');
      return;
    }

    // Optimistic update
    const prevEvents = events;
    const updated: CalendarEvent = {
      ...original,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() }
    };
    setSyncingEventId(original.id);
    setEvents(prevEvents.map(e => (e.id === original.id ? updated : e)));

    try {
      const res = await fetch(buildApiUrl(`calendar/events/${user.id}/${original.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: original.summary,
          description: original.description || '',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          timeZone: 'Europe/Istanbul'
        })
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
    } catch (e) {
      // revert on failure
      setEvents(prevEvents);
      setError('Etkinlik taşınamadı');
      console.error(e);
    } finally {
      setSyncingEventId(null);
    }
  };

  // DnD: resize event (drag edge)
  const handleEventResize = async ({ event, start, end }: { event: CalendarEventRBC; start: Date; end: Date }) => {
    if (!user?.id) return;
    const original = event.resource;
    if (!original) return;
    if (!canModifyEvent(original)) {
      setError('Bu etkinliği sadece oluşturan kişi yeniden boyutlandırabilir.');
      return;
    }

    const prevEvents = events;
    const updated: CalendarEvent = {
      ...original,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() }
    };
    setSyncingEventId(original.id);
    setEvents(prevEvents.map(e => (e.id === original.id ? updated : e)));

    try {
      const res = await fetch(buildApiUrl(`calendar/events/${user.id}/${original.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: original.summary,
          description: original.description || '',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          timeZone: 'Europe/Istanbul'
        })
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
    } catch (e) {
      setEvents(prevEvents);
      setError('Etkinlik güncellenemedi');
      console.error(e);
    } finally {
      setSyncingEventId(null);
    }
  };

  // Format week range for display (force Turkish via Intl)
  const getWeekRange = () => {
    const start = moment(currentDate).startOf('week').toDate();
    const end = moment(currentDate).endOf('week').toDate();

    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      d.toLocaleDateString('tr-TR', opts);

    if (start.getMonth() === end.getMonth()) {
      return `${fmt(start, { day: 'numeric' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `${fmt(start, { day: 'numeric', month: 'long' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  // Check calendar connection status
  const checkConnection = useCallback(async () => {
    if (!user?.id) return false;
    
    setCheckingConnection(true);
    try {
      const response = await fetch(buildApiUrl(`calendar/status/${user.id}`));
      const data = await response.json();
      
      // For team system, we need to check if user has any calendar access
      // (either as owner or team member)
      if (data.connected) {
        setIsConnected(true);
        return true;
      }
      
      // If not directly connected, check if user is a team member
      const teamResponse = await fetch(buildApiUrl(`calendar/team/info/${user.id}`));
      const teamData = await teamResponse.json();
      
      if (teamData.success && teamData.teamInfo) {
        // User is a team member, so they have calendar access
        setIsConnected(true);
        return true;
      }
      
      setIsConnected(false);
      return false;
    } catch (error) {
      setIsConnected(false);
      console.error(error);
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
      // Get events for 3 months before and 3 months after current date
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      const timeMin = threeMonthsAgo.toISOString();
      const timeMax = threeMonthsLater.toISOString();
      
      const url = buildApiUrl(`calendar/events/${user.id}?timeMin=${timeMin}&timeMax=${timeMax}`);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events || []);
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
      setError(error instanceof Error ? error.message : 'Yetkilendirme URL\'si alınırken bir hata oluştu');
    }
  };

  // Handle invitation acceptance
  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      // Refresh connection status after accepting invitation
      const isConnected = await checkConnection();
      if (isConnected) {
        await fetchEvents();
      }
    } catch (error) {
      console.error(error);
      setError('Davet kabul edilirken bir hata oluştu');
    }
  };

  // Handle invitation rejection
  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
    } catch (error) {
      console.error(error);
      setError('Davet reddedilirken bir hata oluştu');
    }
  };

  // Check if user can modify an event
  const canModifyEvent = (event: CalendarEvent) => {
    if (!user?.id) return false;
    // If event has createdBy field, check if it matches current user
    if (event.createdBy) {
      return event.createdBy === user.id;
    }
    // If no createdBy field, assume user can modify (for backward compatibility)
    return true;
  };

  // Handle event edit (not used currently)
  // const handleEditEvent = (event: CalendarEvent) => {
  //   if (!canModifyEvent(event)) {
  //     setError('Bu etkinliği düzenleyemezsiniz. Sadece kendi oluşturduğunuz etkinlikleri düzenleyebilirsiniz.');
  //     return;
  //   }
  // };

  // Handle event delete
  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.id) return;
    
    setDeletingEvent(eventId);
    try {
      const response = await fetch(buildApiUrl(`calendar/events/${user.id}/${eventId}`), {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to delete event');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Etkinlik silinirken bir hata oluştu');
    } finally {
      setDeletingEvent(null);
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
          <p className="text-gray-600">Takviminizi yönetmek için Google Calendar'ı bağlayın veya bir takıma katılın</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Bekleyen Takım Davetleri</h2>
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{invitation.users?.name || 'Unknown'}</h3>
                      <p className="text-sm text_gray-500">{invitation.users?.email || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">
                        Davet edildi: {new Date(invitation.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRejectInvitation(invitation.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Daveti reddet"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      title="Daveti kabul et"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connect Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify_between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
          <p className="text-gray-600">Randevularınızı görüntüleyin ve yönetin</p>
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
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          {/* Custom Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium transition-colors"
              >
                Bugün
              </button>
              <div className="flex items_center">
                <button
                  onClick={handlePreviousWeek}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Önceki hafta"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Sonraki hafta"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                    </div>
              <h2 className="text-xl font-normal text-gray-900">
                {getWeekRange()}
              </h2>
                  </div>
                  
            {/* Actions on the right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                disabled={!!syncingEventId}
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Randevu</span>
              </button>
                      <button
                onClick={fetchEvents}
                disabled={loading || !!syncingEventId}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`${loading ? 'animate-spin' : ''} w-4 h-4`} />
                <span>Yenile</span>
                      </button>
                      <button
                onClick={getAuthUrl}
                disabled={!!syncingEventId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
                      </button>
            {syncingEventId && (
              <span className="text-xs text-gray-500 ml-2">Kaydediliyor...</span>
            )}
          </div>
          </div>
                  
          {/* Calendar Container with comfortable height + scroll inside grid */}
          <div style={{ height: 900 }}>
            <DnDCalendar
              localizer={localizer}
              events={events.map(convertToRBCEvent)}
              startAccessor={(e) => (e as CalendarEventRBC).start as Date}
              endAccessor={(e) => (e as CalendarEventRBC).end as Date}
              defaultView={Views.WEEK}
              views={[Views.WEEK]}
              culture="tr"
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(ev) => handleSelectEvent(ev as CalendarEventRBC)}
              onEventDrop={(args) => handleEventDrop({
                event: args.event as CalendarEventRBC,
                start: args.start instanceof Date ? args.start : new Date(args.start as string),
                end: args.end instanceof Date ? args.end : new Date(args.end as string)
              })}
              onEventResize={(args) => handleEventResize({
                event: args.event as CalendarEventRBC,
                start: args.start instanceof Date ? args.start : new Date(args.start as string),
                end: args.end instanceof Date ? args.end : new Date(args.end as string)
              })}
              resizable
              selectable
              popup
              eventPropGetter={(ev) => {
                const base = eventStyleGetter(ev as CalendarEventRBC);
                const resourceId = (ev as CalendarEventRBC).resource?.id;
                if (syncingEventId && resourceId === syncingEventId) {
                  return { style: { ...base.style, opacity: 0.6, filter: 'grayscale(0.2)' } };
                }
                return base;
              }}
              step={60}
              timeslots={1}
              min={new Date(1970, 0, 1, 0, 0, 0)}
              max={new Date(1970, 0, 1, 23, 59, 59)}
              formats={{
                dayFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
                timeGutterFormat: (date) =>
                  date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                dateFormat: (date) => date.toLocaleDateString('tr-TR', { day: 'numeric' }),
                weekdayFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                monthHeaderFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                dayHeaderFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
                dayRangeHeaderFormat: ({ start, end }) => {
                  const s = start instanceof Date ? start : new Date(start as string);
                  const e = end instanceof Date ? end : new Date(end as string);
                  return `${s.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${e.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                },
                agendaHeaderFormat: (value: unknown) => {
                  if (value instanceof Date) {
                    return value.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                  }
                  if (value && typeof value === 'object' && 'start' in (value as Record<string, unknown>)) {
                    const startVal = (value as Record<string, unknown>).start as Date | string | number | undefined;
                    const d = startVal instanceof Date ? startVal : new Date(startVal ?? 0);
                    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                  }
                  const d = new Date(value as string | number);
                  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                },
                agendaDateFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
                agendaTimeRangeFormat: ({ start, end }) => {
                  const s = start instanceof Date ? start : new Date(start as string);
                  const e = end instanceof Date ? end : new Date(end as string);
                  return `${s.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${e.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                },
              }}
              messages={{
                week: 'Hafta',
                work_week: 'Çalışma Haftası',
                day: 'Gün',
                month: 'Ay',
                previous: 'Geri',
                next: 'İleri',
                today: 'Bugün',
                agenda: 'Ajanda',
                noEventsInRange: 'Bu aralıkta etkinlik yok',
                showMore: (total) => `+${total} daha`,
              }}
            />
                      </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Yeni Randevu Oluştur</h2>
              <button
                onClick={() => setShowCreateModal(false)}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
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

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Randevu Detayları</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedEvent.summary}
                </h3>
                {selectedEvent.description && (
                  <p className="text-gray-600">{selectedEvent.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(selectedEvent.start.dateTime || selectedEvent.start.date || '')}</span>
                </div>
                
                {selectedEvent.start.dateTime && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(selectedEvent.start.dateTime)} - {formatTime(selectedEvent.end.dateTime || '')}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Katılımcılar:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.attendees.map((attendee, index) => (
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

              {selectedEvent.creator && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Oluşturan: {selectedEvent.creator.displayName || selectedEvent.creator.email}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              {canModifyEvent(selectedEvent) && (
                <>
                  <button
                    onClick={() => {
                      if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
                        handleDeleteEvent(selectedEvent.id);
                        setSelectedEvent(null);
                      }
                    }}
                    disabled={deletingEvent === selectedEvent.id}
                    className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingEvent === selectedEvent.id ? 'Siliniyor...' : 'Sil'}
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};