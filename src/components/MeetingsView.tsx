import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePatients } from '../hooks/usePatients';
import { buildApiUrl } from '../lib/api';
import { Calendar, momentLocalizer, SlotInfo, Event as RBCEvent, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Configure moment to use Turkish locale
moment.locale('tr');
// Set Monday as the first day of the week
moment.updateLocale('tr', {
  week: {
    dow: 1, // Monday is the first day of the week
  }
});

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
  patient?: {
    id: string;
    patient_number: number;
    data: {
      name?: string;
      national_id?: string;
      phone?: string;
      address?: string;
      reason?: string;
      notes?: string;
    };
  } | null;
}

// Extended event type for react-big-calendar
interface CalendarEventRBC extends RBCEvent {
  resource: CalendarEvent;
}

export const MeetingsView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { patients } = usePatients(user?.id || null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    notes: '',
    patient_id: ''
  });
  // const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);
  const [deepLinkParams, setDeepLinkParams] = useState<{ date?: string; appointmentId?: string; action?: string } | null>(null);
  const [loadedDateRange, setLoadedDateRange] = useState<{ min: Date; max: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // Get calendar events
  const fetchEvents = useCallback(async (customTimeMin?: string, customTimeMax?: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let timeMin: string;
      let timeMax: string;
      
      if (customTimeMin && customTimeMax) {
        // Use provided date range
        timeMin = customTimeMin;
        timeMax = customTimeMax;
      } else {
        // Default: Get events for 3 months before and 3 months after current date
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        
        timeMin = threeMonthsAgo.toISOString();
        timeMax = threeMonthsLater.toISOString();
      }
      
      const url = buildApiUrl(`calendar/events/${user.id}?timeMin=${timeMin}&timeMax=${timeMax}`);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const mapped: CalendarEvent[] = (data.events || []).map((e: any) => ({
          id: e.id,
          summary: e.title,
          description: e.description || '',
          start: { dateTime: e.start_time },
          end: { dateTime: e.end_time },
          createdBy: e.created_by || e.user_id, // Use created_by from backend, fallback to user_id
          patient: e.patients && Array.isArray(e.patients) && e.patients.length > 0 ? e.patients[0] : (e.patients || null),
        }));
        setEvents(mapped);
        // Save the loaded date range
        setLoadedDateRange({
          min: new Date(timeMin),
          max: new Date(timeMax)
        });
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Etkinlikler yüklenirken bir hata oluştu';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Helper function to check and load events if needed for a date
  const checkAndLoadEventsForDate = useCallback((date: Date) => {
    if (loadedDateRange) {
      const newDate = new Date(date);
      const oneMonthBefore = new Date(newDate);
      oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
      const oneMonthAfter = new Date(newDate);
      oneMonthAfter.setMonth(oneMonthAfter.getMonth() + 1);
      
      // Check if new date is outside the loaded range
      const bufferDays = 7; // 7 day buffer to avoid frequent reloads
      const minWithBuffer = new Date(loadedDateRange.min.getTime() + bufferDays * 24 * 60 * 60 * 1000);
      const maxWithBuffer = new Date(loadedDateRange.max.getTime() - bufferDays * 24 * 60 * 60 * 1000);
      
      if (newDate < minWithBuffer || newDate > maxWithBuffer) {
        // Load events for the new date range
        fetchEvents(oneMonthBefore.toISOString(), oneMonthAfter.toISOString());
      }
    }
  }, [loadedDateRange, fetchEvents]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const newDate = moment(currentDate).subtract(1, 'week').toDate();
    setCurrentDate(newDate);
    checkAndLoadEventsForDate(newDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newDate = moment(currentDate).add(1, 'week').toDate();
    setCurrentDate(newDate);
    checkAndLoadEventsForDate(newDate);
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
      notes: '',
      patient_id: ''
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

    // For drag & drop, snap start to 15-minute intervals and calculate end based on original duration
    const ms15 = 1000 * 60 * 15;
    const roundedStart = new Date(Math.round(start.getTime() / ms15) * ms15);
    
    // Calculate original duration and maintain it
    const originalDurationMs = end.getTime() - start.getTime();
    const roundedEnd = new Date(roundedStart.getTime() + originalDurationMs);

    // Calculate duration in minutes
    const durationMinutes = originalDurationMs / (1000 * 60);

    // Validate minimum duration (15 minutes)
    if (durationMinutes < 15) {
      setError('Randevu süresi en az 15 dakika olmalıdır.');
      return;
    }

    // Validate maximum duration (12 hours = 720 minutes) to prevent accidental all-day events
    if (durationMinutes > 720) {
      setError('Tüm günlük etkinlikler desteklenmiyor. Randevu süresi en fazla 12 saat olabilir.');
      return;
    }

    // Optimistic update
    const prevEvents = events;
    const updated: CalendarEvent = {
      ...original,
      start: { dateTime: roundedStart.toISOString() },
      end: { dateTime: roundedEnd.toISOString() }
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
          startTime: roundedStart.toISOString(),
          endTime: roundedEnd.toISOString(),
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

  // Helper function to snap end time to 15-minute intervals
  const snapToNext15Minutes = (date: Date, startDate: Date): Date => {
    const ms = 1000 * 60 * 15; // 15 minutes in milliseconds
    const rounded = new Date(Math.round(date.getTime() / ms) * ms);
    
    // Ensure minimum 15 minutes from start
    const minEnd = new Date(startDate.getTime() + ms);
    if (rounded < minEnd) {
      return minEnd;
    }
    
    return rounded;
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

    // Only snap the end time to 15-minute intervals
    // Keep start time as-is to allow resizing from bottom
    const adjustedEnd = snapToNext15Minutes(end, start);

    // Calculate duration in minutes
    const durationMs = adjustedEnd.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // Validate minimum duration (15 minutes)
    if (durationMinutes < 15) {
      setError('Randevu süresi en az 15 dakika olmalıdır.');
      return;
    }

    // Validate maximum duration (12 hours = 720 minutes) to prevent accidental all-day events
    if (durationMinutes > 720) {
      setError('Tüm günlük etkinlikler desteklenmiyor. Randevu süresi en fazla 12 saat olabilir.');
      return;
    }

    const prevEvents = events;
    const updated: CalendarEvent = {
      ...original,
      start: { dateTime: start.toISOString() },
      end: { dateTime: adjustedEnd.toISOString() }
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
          endTime: adjustedEnd.toISOString(),
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

    // Mobile: Show shorter format
    if (isMobile) {
      if (start.getMonth() === end.getMonth()) {
        return `${fmt(start, { day: 'numeric' })} - ${fmt(end, { day: 'numeric', month: 'short' })}`;
      }
      return `${fmt(start, { day: 'numeric', month: 'short' })} - ${fmt(end, { day: 'numeric', month: 'short' })}`;
    }

    // Desktop: Show full week range
    if (start.getMonth() === end.getMonth()) {
      return `${fmt(start, { day: 'numeric' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `${fmt(start, { day: 'numeric', month: 'long' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  // Connection checks removed (local calendar always available)

  // Google auth removed

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

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to center current day on mobile with horizontal scrolling
  useEffect(() => {
    if (!isMobile) return;

    // Wait for calendar to render
    const timer = setTimeout(() => {
      const timeContent = document.querySelector('.rbc-time-content') as HTMLElement;
      const timeHeader = document.querySelector('.rbc-time-header-content') as HTMLElement;
      
      if (!timeContent || !timeHeader) return;

      // Sync scroll between header and content
      const syncScroll = (source: HTMLElement, target: HTMLElement) => {
        target.scrollLeft = source.scrollLeft;
      };

      const handleContentScroll = () => syncScroll(timeContent, timeHeader);
      const handleHeaderScroll = () => syncScroll(timeHeader, timeContent);

      timeContent.addEventListener('scroll', handleContentScroll);
      timeHeader.addEventListener('scroll', handleHeaderScroll);

      // Calculate which day of week (0=Monday, 6=Sunday)
      const weekStart = moment(currentDate).startOf('week');
      const dayIndex = moment(currentDate).diff(weekStart, 'days');
      
      // Get actual column width from the calendar
      const firstColumn = timeContent.querySelector('.rbc-time-column') as HTMLElement;
      const columnWidth = firstColumn ? firstColumn.offsetWidth : 100;
      
      // Calculate scroll position to center the current day
      // Show: previous day | CURRENT DAY (centered) | next day
      const containerWidth = timeContent.offsetWidth;
      const scrollLeft = Math.max(0, (dayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2));
      
      timeContent.scrollLeft = scrollLeft;
      timeHeader.scrollLeft = scrollLeft;

      return () => {
        timeContent.removeEventListener('scroll', handleContentScroll);
        timeHeader.removeEventListener('scroll', handleHeaderScroll);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isMobile, currentDate]);

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      if (user?.id) {
        // Parse deep-link query params once on mount
        try {
          const params = new URLSearchParams(window.location.search);
          const date = params.get('date') || undefined;
          const appointmentId = params.get('appointmentId') || undefined;
          const action = params.get('action') || undefined;
          if (date) {
            const d = moment(date, 'YYYY-MM-DD', true);
            if (d.isValid()) {
              setCurrentDate(d.toDate());
            }
          }
          if (date || appointmentId || action) {
            setDeepLinkParams({ date, appointmentId, action });
          }
        } catch {
          // ignore bad query
        }
        await fetchEvents();
      }
    };
    initialize();
  }, [user?.id, fetchEvents]);

  // After events are loaded, if deep-link requests edit, open the details modal for the appointment
  useEffect(() => {
    if (!deepLinkParams || !user?.id) return;
    const { appointmentId, action } = deepLinkParams;
    
    if (action === 'edit' && appointmentId) {
      const handleDeepLinkAppointment = async () => {
        try {
          // First, try to find the appointment in the current events array
          let target = events.find(e => String(e.id) === String(appointmentId));
          
          // If not found, fetch it directly by ID
          if (!target) {
            const response = await fetch(buildApiUrl(`calendar/events/${user.id}/${appointmentId}`));
            const data = await response.json();
            
            if (data.success && data.event) {
              const fetchedEvent: CalendarEvent = {
                id: data.event.id,
                summary: data.event.title,
                description: data.event.description || '',
                start: { dateTime: data.event.start_time },
                end: { dateTime: data.event.end_time },
                createdBy: data.event.created_by || data.event.user_id,
                patient: data.event.patients && Array.isArray(data.event.patients) && data.event.patients.length > 0 ? data.event.patients[0] : (data.event.patients || null),
              };
              
              // Calculate dynamic date range based on appointment date
              const appointmentDate = new Date(data.event.start_time);
              const now = new Date();
              
              let timeMin: Date;
              let timeMax: Date;
              
              if (appointmentDate > now) {
                // Future appointment: from now to appointment date + 1 month buffer
                timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 month before now
                timeMax = new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month after appointment
              } else {
                // Past appointment: appointment date ± 1 month
                timeMin = new Date(appointmentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                timeMax = new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
              }
              
              // Fetch events with dynamic range
              await fetchEvents(timeMin.toISOString(), timeMax.toISOString());
              
              // After fetchEvents completes, the appointment should be in the events array
              // Wait a bit for state to update, then find it
              target = fetchedEvent;
            } else {
              throw new Error(data.error || 'Randevu bulunamadı');
            }
          }
          
          if (target) {
            setSelectedEvent(target);
            // Optionally clean URL so modal doesn't reopen on refresh
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('action');
              url.searchParams.delete('appointmentId');
              window.history.replaceState({}, document.title, url.toString());
            } catch {
              // noop
            }
          } else {
            setError('Randevu bulunamadı veya erişim yetkiniz yok.');
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : 'Randevu bulunamadı veya erişim yetkiniz yok.';
          setError(errorMsg);
        } finally {
          // Clear so it doesn't retrigger
          setDeepLinkParams(null);
        }
      };
      
      handleDeepLinkAppointment();
    }
  }, [events, deepLinkParams, user?.id, fetchEvents]);

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
    if (!user?.id || !formData.title || !formData.date || !formData.time || !formData.patient_id) {
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
          notes: formData.notes || undefined,
          patient_id: formData.patient_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({ title: '', date: '', time: '', duration: '60', notes: '', patient_id: '' });
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

  // Connection gating and Google connect UI removed

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
        <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 12.5rem)' }}>
          {/* Custom Toolbar */}
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={handleToday}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium transition-colors"
              >
                Bugün
              </button>
              <div className="flex items_center">
                <button
                  onClick={handlePreviousWeek}
                  className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Önceki hafta"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-1 sm:p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Sonraki hafta"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                    </div>
              <h2 className="text-sm sm:text-xl font-normal text-gray-900">
                {getWeekRange()}
              </h2>
                  </div>
                  
            {/* Actions on the right */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
                disabled={!!syncingEventId}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Yeni Randevu</span>
              </button>
                      <button
                onClick={() => fetchEvents()}
                disabled={loading || !!syncingEventId}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2"
              >
                <RefreshCw className={`${loading ? 'animate-spin' : ''} w-4 h-4`} />
                <span className="hidden sm:inline">Yenile</span>
                      </button>
              
            {syncingEventId && (
              <span className="hidden sm:inline text-xs text-gray-500 ml-2">Kaydediliyor...</span>
            )}
          </div>
          </div>
                  
          {/* Calendar Container - flexes to fill remaining space */}
          <div className="flex-1 overflow-hidden">
            <DnDCalendar
              localizer={localizer}
              events={events.map(convertToRBCEvent)}
              startAccessor={(e) => (e as CalendarEventRBC).start as Date}
              endAccessor={(e) => (e as CalendarEventRBC).end as Date}
              defaultView={Views.WEEK}
              views={[Views.WEEK]}
              culture="tr"
              date={currentDate}
              onNavigate={(date) => {
                setCurrentDate(date);
                checkAndLoadEventsForDate(date);
              }}
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
              step={15}
              timeslots={4}
              min={new Date(1970, 0, 1, 0, 0, 0)}
              max={new Date(1970, 0, 1, 23, 59, 59)}
              formats={{
                dayFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { weekday: isMobile ? 'short' : 'long', day: '2-digit' }),
                timeGutterFormat: (date) =>
                  date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                dateFormat: (date) => date.toLocaleDateString('tr-TR', { day: 'numeric' }),
                weekdayFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                monthHeaderFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                dayHeaderFormat: (date) =>
                  date.toLocaleDateString('tr-TR', { day: 'numeric', month: isMobile ? 'short' : 'long', year: 'numeric', weekday: isMobile ? 'short' : 'long' }),
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
                  Hasta <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-emerald-400"
                  required
                >
                  <option value="">Hasta seçiniz</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_number ? `#${patient.patient_number} - ` : ''}{patient.data.name || 'İsimsiz Hasta'}
                    </option>
                  ))}
                </select>
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
                  setFormData({ title: '', date: '', time: '', duration: '60', notes: '', patient_id: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={createAppointment}
                disabled={creating || !formData.title || !formData.date || !formData.time || !formData.patient_id}
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

              {selectedEvent.patient && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Hasta:</span>
                    <button
                      onClick={() => navigate(`/patient-file/${selectedEvent.patient!.id}`)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                    >
                      {selectedEvent.patient.data.name || 'İsimsiz Hasta'}
                      {selectedEvent.patient.patient_number && ` (#${selectedEvent.patient.patient_number})`}
                    </button>
                  </div>
                </div>
              )}

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