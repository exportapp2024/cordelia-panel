import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, Plus, X, ChevronLeft, ChevronRight, Filter, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePatients } from '../hooks/usePatients';
import { buildApiUrl, type Appointment } from '../lib/api';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { AddPatientAccordion } from './AddPatientAccordion';
import { Calendar, momentLocalizer, SlotInfo, Event as RBCEvent, Views, View } from 'react-big-calendar';
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
  status?: 'attended' | 'no_show' | 'cancelled' | 'confirmed' | null; // Appointment status
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
    deleted_at?: string | null;
  } | null;
}

// Extended event type for react-big-calendar
interface CalendarEventRBC extends RBCEvent {
  resource: CalendarEvent;
}

// Helper function to display patient name with deleted patient handling
const displayPatientName = (patient: CalendarEvent['patient'] | null): string => {
  if (!patient) return 'İsimsiz Hasta';
  if (patient.deleted_at) {
    return patient.patient_number 
      ? `Silinen Hasta (#${patient.patient_number})`
      : 'Silinen Hasta';
  }
  return patient.data.name || 'İsimsiz Hasta';
};

export const MeetingsView: React.FC = () => {
  const { user } = useAuth();
  const { patients, addPatient } = usePatients(user?.id || null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    notes: '',
    patient_id: ''
  });
  // Autocomplete states
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(-1);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  // New patient form states
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  // const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);
  const [deepLinkParams, setDeepLinkParams] = useState<{ date?: string; appointmentId?: string; action?: string } | null>(null);
  const [loadedDateRange, setLoadedDateRange] = useState<{ min: Date; max: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterPatientIds, setFilterPatientIds] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const createPanelRef = useRef<HTMLDivElement>(null);
  // Conflict warning states
  const [conflictWarning, setConflictWarning] = useState<CalendarEvent[]>([]);
  const [pendingAppointment, setPendingAppointment] = useState<{
    type: 'create' | 'drop' | 'resize';
    start: Date;
    end: Date;
    eventId?: string;
    formData?: typeof formData;
    originalEvent?: CalendarEvent;
  } | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

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

  // Filter patients based on search query (exclude deleted patients)
  const filteredPatients = useMemo(() => {
    // First filter out deleted patients
    const activePatients = patients.filter(patient => !patient.deleted_at);
    
    if (!patientSearchQuery.trim()) {
      return [...activePatients].sort((a, b) => {
        const nameA = a.data.name || 'İsimsiz Hasta';
        const nameB = b.data.name || 'İsimsiz Hasta';
        return nameA.localeCompare(nameB, 'tr');
      });
    }
    const normalizedSearch = normalizeForSearch(patientSearchQuery);
    return activePatients
      .filter(patient => {
        const patientName = patient.data.name || '';
        return normalizeForSearch(patientName).includes(normalizedSearch);
      })
      .sort((a, b) => {
        const nameA = a.data.name || 'İsimsiz Hasta';
        const nameB = b.data.name || 'İsimsiz Hasta';
        return nameA.localeCompare(nameB, 'tr');
      });
  }, [patients, patientSearchQuery]);

  // Convert CalendarEvent to react-big-calendar Event format
  const convertToRBCEvent = (event: CalendarEvent): CalendarEventRBC => {
    const startDate = event.start.dateTime 
      ? new Date(event.start.dateTime) 
      : new Date(event.start.date || '');
    const endDate = event.end.dateTime 
      ? new Date(event.end.dateTime) 
      : new Date(event.end.date || '');

    // Add patient name to title if available
    const patientName = displayPatientName(event.patient);
    const displayTitle = patientName && patientName !== 'İsimsiz Hasta'
      ? `${patientName}: ${event.summary}` 
      : event.summary;

    return {
      title: displayTitle,
      start: startDate,
      end: endDate,
      resource: event
    };
  };

  // Check for appointment conflicts
  const checkAppointmentConflict = (start: Date, end: Date, excludeEventId?: string): CalendarEvent[] => {
    const conflicts: CalendarEvent[] = [];
    
    for (const event of events) {
      // Skip the event being moved/resized
      if (excludeEventId && event.id === excludeEventId) {
        continue;
      }

      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start.date || '');
      const eventEnd = event.end.dateTime 
        ? new Date(event.end.dateTime) 
        : new Date(event.end.date || '');

      // Check if there's an overlap: (newStart < existingEnd) && (newEnd > existingStart)
      if (start < eventEnd && end > eventStart) {
        conflicts.push(event);
      }
    }

    return conflicts;
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
          status: e.status || 'confirmed', // Include status field
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

  // Navigate to previous period (week or month based on view)
  const handlePreviousPeriod = () => {
    const period = currentView === Views.MONTH ? 'month' : 'week';
    const newDate = moment(currentDate).subtract(1, period).toDate();
    setCurrentDate(newDate);
    checkAndLoadEventsForDate(newDate);
  };

  // Navigate to next period (week or month based on view)
  const handleNextPeriod = () => {
    const period = currentView === Views.MONTH ? 'month' : 'week';
    const newDate = moment(currentDate).add(1, period).toDate();
    setCurrentDate(newDate);
    checkAndLoadEventsForDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle view change
  const handleViewChange = (view: string) => {
    if (view === Views.WEEK || view === Views.MONTH) {
      setCurrentView(view);
    }
  };

  // Handle slot selection (clicking on empty time slot)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const start = moment(slotInfo.start);
    // Snap to nearest 15-minute interval (00/15/30/45)
    const minutes = start.minute();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    start.minute(roundedMinutes).second(0);
    
    const formattedDate = start.format('YYYY-MM-DD');
    const formattedTime = start.format('HH:mm');
    
    setFormData({
      title: '',
      date: formattedDate,
      time: formattedTime,
      duration: '30',
      notes: '',
      patient_id: ''
    });
    setPatientSearchQuery('');
    setShowPatientDropdown(false);
    setShowNewPatientForm(false);
    setShowCreateModal(true);
  };

  // Handle event selection (clicking on an event)
  const handleSelectEvent = (event: CalendarEventRBC) => {
    setSelectedEvent(event.resource);
  };

  // Calculate conflict groups and positions for side-by-side display
  const getConflictGroups = useMemo(() => {
    const groups: CalendarEvent[][] = [];
    const processed = new Set<string>();

    for (const event of events) {
      if (processed.has(event.id)) continue;

      const eventStart = event.start.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start.date || '');
      const eventEnd = event.end.dateTime 
        ? new Date(event.end.dateTime) 
        : new Date(event.end.date || '');

      // Find all events that conflict with this one
      const conflictGroup: CalendarEvent[] = [event];
      processed.add(event.id);

      for (const otherEvent of events) {
        if (processed.has(otherEvent.id)) continue;

        const otherStart = otherEvent.start.dateTime 
          ? new Date(otherEvent.start.dateTime) 
          : new Date(otherEvent.start.date || '');
        const otherEnd = otherEvent.end.dateTime 
          ? new Date(otherEvent.end.dateTime) 
          : new Date(otherEvent.end.date || '');

        // Check if they overlap
        if (eventStart < otherEnd && eventEnd > otherStart) {
          conflictGroup.push(otherEvent);
          processed.add(otherEvent.id);
        }
      }

      if (conflictGroup.length > 1) {
        // Sort by start time for consistent ordering
        conflictGroup.sort((a, b) => {
          const aStart = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
          const bStart = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
          return aStart - bStart;
        });
        groups.push(conflictGroup);
      }
    }

    return groups;
  }, [events]);

  // Get conflict position for an event
  const getConflictPosition = (eventId: string): { left: number; width: number } | null => {
    for (const group of getConflictGroups) {
      const index = group.findIndex(e => e.id === eventId);
      if (index !== -1) {
        const totalConflicts = group.length;
        const widthPercent = 100 / totalConflicts;
        const leftPercent = index * widthPercent;
        return { left: leftPercent, width: widthPercent };
      }
    }
    return null;
  };

  // Event style getter for custom colors
  const eventStyleGetter = (event: CalendarEventRBC) => {
    const backgroundColor = '#10b981'; // emerald-500
    const conflictPos = getConflictPosition(event.resource?.id || '');
    
    const baseStyle: React.CSSProperties = {
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

    // If event is in a conflict group, adjust position and width for side-by-side display
    if (conflictPos) {
      // Use calc to position events side-by-side
      // react-big-calendar uses absolute positioning, so we adjust left and width
      baseStyle.width = `calc(${conflictPos.width}% - 2px)`;
      baseStyle.left = conflictPos.left > 0 ? `calc(${conflictPos.left}% + 2px)` : '2px';
      baseStyle.marginRight = '2px';
    }

    return { style: baseStyle };
  };

  // Internal function to actually perform event drop
  const performEventDrop = async (original: CalendarEvent, roundedStart: Date, roundedEnd: Date) => {
    if (!user?.id) return;

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

    // Check for conflicts
    const conflicts = checkAppointmentConflict(roundedStart, roundedEnd, original.id);
    if (conflicts.length > 0) {
      setConflictWarning(conflicts);
      setPendingAppointment({
        type: 'drop',
        start: roundedStart,
        end: roundedEnd,
        eventId: original.id,
        originalEvent: original
      });
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed with update
    await performEventDrop(original, roundedStart, roundedEnd);
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

  // Internal function to actually perform event resize
  const performEventResize = async (original: CalendarEvent, start: Date, adjustedEnd: Date) => {
    if (!user?.id) return;

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

    // Check for conflicts
    const conflicts = checkAppointmentConflict(start, adjustedEnd, original.id);
    if (conflicts.length > 0) {
      setConflictWarning(conflicts);
      setPendingAppointment({
        type: 'resize',
        start: start,
        end: adjustedEnd,
        eventId: original.id,
        originalEvent: original
      });
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed with update
    await performEventResize(original, start, adjustedEnd);
  };

  // Format date range for display based on view (force Turkish via Intl)
  const getDateRange = () => {
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      d.toLocaleDateString('tr-TR', opts);

    if (currentView === Views.MONTH) {
      // Month view: Show month name and year
      if (isMobile) {
        return fmt(currentDate, { month: 'long', year: 'numeric' });
      }
      return fmt(currentDate, { month: 'long', year: 'numeric' });
    } else {
      // Week view: Show week range
      const start = moment(currentDate).startOf('week').toDate();
      const end = moment(currentDate).endOf('week').toDate();

      // Mobile: Show shorter format with year
      if (isMobile) {
        if (start.getMonth() === end.getMonth()) {
          return `${fmt(start, { day: 'numeric' })} - ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return `${fmt(start, { day: 'numeric', month: 'short' })} - ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }

      // Desktop: Show full week range
      if (start.getMonth() === end.getMonth()) {
        return `${fmt(start, { day: 'numeric' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      return `${fmt(start, { day: 'numeric', month: 'long' })} - ${fmt(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
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

  // Convert CalendarEvent to Appointment format
  const convertToAppointment = (event: CalendarEvent): Appointment => {
    return {
      id: event.id,
      title: event.summary,
      description: event.description,
      start_time: event.start.dateTime || event.start.date || '',
      end_time: event.end.dateTime || event.end.date || '',
      created_by: event.createdBy,
      status: event.status || 'confirmed',
      patient_id: event.patient?.id || '',
      patients: event.patient ? {
        id: event.patient.id,
        patient_number: event.patient.patient_number,
        data: event.patient.data,
        deleted_at: event.patient.deleted_at || null
      } : undefined
    };
  };

  // Handle status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const handleStatusUpdate = async (eventId: string, newStatus: 'attended' | 'no_show' | 'cancelled') => {
    if (!user?.id) return;
    
    setUpdatingStatus(eventId);
    try {
      const response = await fetch(buildApiUrl(`calendar/events/${user.id}/${eventId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the selected event state
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent({
            ...selectedEvent,
            status: newStatus
          });
        }
        // Update events list
        setEvents(events.map(e => 
          e.id === eventId ? { ...e, status: newStatus } : e
        ));
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Durum güncellenirken bir hata oluştu');
    } finally {
      setUpdatingStatus(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node) && 
          patientInputRef.current && !patientInputRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    if (showFilterDropdown || showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown, showPatientDropdown]);

  // Handle ESC key to close create panel
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
        setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
      }
    };

    if (showCreateModal) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [showCreateModal]);

  // Focus trap for create panel
  useEffect(() => {
    if (!showCreateModal || !createPanelRef.current) return;

    const panel = createPanelRef.current;
    const focusableElements = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when panel opens
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTabKey);
    return () => {
      panel.removeEventListener('keydown', handleTabKey);
    };
  }, [showCreateModal]);

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
                status: data.event.status || 'confirmed',
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

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get selected patient display name
  const getSelectedPatientName = () => {
    if (!formData.patient_id) return '';
    const patient = patients.find(p => p.id === formData.patient_id);
    if (!patient) return '';
    // Use displayPatientName helper, but adapt for form display format
    if (patient.deleted_at) {
      return patient.patient_number 
        ? `#${patient.patient_number} - Silinen Hasta`
        : 'Silinen Hasta';
    }
    return patient.patient_number ? `#${patient.patient_number} - ${patient.data.name || 'İsimsiz Hasta'}` : (patient.data.name || 'İsimsiz Hasta');
  };

  // Handle patient selection from autocomplete
  const handlePatientSelect = (patientId: string) => {
    setFormData({ ...formData, patient_id: patientId });
    setPatientSearchQuery('');
    setShowPatientDropdown(false);
    setSelectedPatientIndex(-1);
  };

  // Handle new patient form submission
  const handleAddNewPatient = async (patientData: {
    name: string;
    national_id?: string | null;
    phone?: string | null;
    address?: string | null;
    reason?: string | null;
    notes?: string | null;
  }) => {
    setIsAddingPatient(true);
    setError(null);

    try {
      const newPatient = await addPatient(patientData);

      // Select the newly created patient
      if (newPatient && newPatient.id) {
        handlePatientSelect(newPatient.id);
      }
      
      setShowNewPatientForm(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Hasta eklenirken bir hata oluştu');
      throw error; // Re-throw so AddPatientAccordion can handle it
    } finally {
      setIsAddingPatient(false);
    }
  };

  // Handle keyboard navigation in autocomplete
  const handlePatientInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPatientDropdown) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setShowPatientDropdown(true);
        setSelectedPatientIndex(0);
      }
      return;
    }

    const maxIndex = filteredPatients.length > 0 ? filteredPatients.length - 1 : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (maxIndex >= 0) {
          setSelectedPatientIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (maxIndex >= 0) {
          setSelectedPatientIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedPatientIndex >= 0 && selectedPatientIndex < filteredPatients.length) {
          handlePatientSelect(filteredPatients[selectedPatientIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPatientDropdown(false);
        setSelectedPatientIndex(-1);
        break;
    }
  };

  // Internal function to actually create appointment
  const performCreateAppointment = async (appointmentData: typeof formData) => {
    if (!user?.id) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`calendar/events/${user.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: appointmentData.title,
          date: appointmentData.date,
          time: appointmentData.time,
          duration_minutes: parseInt(appointmentData.duration) || 30,
          notes: appointmentData.notes || undefined,
          patient_id: appointmentData.patient_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
        setPatientSearchQuery('');
        setShowPatientDropdown(false);
        setShowNewPatientForm(false);
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

  // Create new appointment
  const createAppointment = async () => {
    if (!user?.id || !formData.title || !formData.date || !formData.time || !formData.patient_id) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Calculate start and end times
    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    const duration = parseInt(formData.duration) || 30;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Check for conflicts
    const conflicts = checkAppointmentConflict(startDateTime, endDateTime);
    if (conflicts.length > 0) {
      setConflictWarning(conflicts);
      setPendingAppointment({
        type: 'create',
        start: startDateTime,
        end: endDateTime,
        formData: { ...formData }
      });
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed with creation
    await performCreateAppointment(formData);
  };

  // Handle conflict override
  const handleConflictOverride = async () => {
    if (!pendingAppointment) return;

    setShowConflictModal(false);
    setConflictWarning([]);

    if (pendingAppointment.type === 'create' && pendingAppointment.formData) {
      // Restore form data and create with override
      setFormData(pendingAppointment.formData);
      await performCreateAppointment(pendingAppointment.formData);
    } else if (pendingAppointment.type === 'drop' && pendingAppointment.originalEvent) {
      // Perform drop with override
      await performEventDrop(
        pendingAppointment.originalEvent,
        pendingAppointment.start,
        pendingAppointment.end
      );
    } else if (pendingAppointment.type === 'resize' && pendingAppointment.originalEvent) {
      // Perform resize with override
      await performEventResize(
        pendingAppointment.originalEvent,
        pendingAppointment.start,
        pendingAppointment.end
      );
    }

    setPendingAppointment(null);
  };

  // Handle conflict cancel
  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflictWarning([]);
    setPendingAppointment(null);
  };

  // Connection gating and Google connect UI removed

  return (
    <>
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
          <div className="flex flex-col px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex-shrink-0 gap-2">
            {/* Mobile: Top row - Navigation and Date */}
            <div className="flex items-center justify-between sm:hidden">
              <button
                onClick={handlePreviousPeriod}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title={currentView === Views.MONTH ? "Önceki ay" : "Önceki hafta"}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-sm font-normal text-gray-900 flex-1 text-center px-2">
                {getDateRange()}
              </h2>
              <button
                onClick={handleNextPeriod}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title={currentView === Views.MONTH ? "Sonraki ay" : "Sonraki hafta"}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Mobile: Bottom row - All buttons in one row */}
            {/* Desktop: All buttons in one row with proper spacing */}
            <div className="flex items-center justify-between gap-1 sm:gap-0">
              {/* Left side - Hafta/Ay and Bugün button */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* View Toggle Buttons */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewChange(Views.WEEK)}
                    className={`px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                      currentView === Views.WEEK
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Hafta
                  </button>
                  <button
                    onClick={() => handleViewChange(Views.MONTH)}
                    className={`px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors border-l border-gray-300 ${
                      currentView === Views.MONTH
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Ay
                  </button>
                </div>
                
                {/* Desktop: Navigation buttons and date */}
                <div className="hidden sm:flex items-center">
                  <button
                    onClick={handleToday}
                    className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Bugün
                  </button>
                  <div className="flex items-center">
                    <button
                      onClick={handlePreviousPeriod}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title={currentView === Views.MONTH ? "Önceki ay" : "Önceki hafta"}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleNextPeriod}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title={currentView === Views.MONTH ? "Sonraki ay" : "Sonraki hafta"}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <h2 className="text-xl font-normal text-gray-900 ml-4">
                    {getDateRange()}
                  </h2>
                </div>
                
                {/* Mobile: Bugün button */}
                <button
                  onClick={handleToday}
                  className="sm:hidden px-2 py-1.5 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Bugün
                </button>
              </div>
              
              {/* Right side - Filter, New Appointment, Refresh */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Patient Filter Dropdown */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="bg-gray-100 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors flex items-center justify-center gap-1 sm:gap-2"
                    style={{ minWidth: isMobile ? '40px' : 'auto' }}
                    title={isMobile ? (filterPatientIds.length > 0 ? `${filterPatientIds.length} hasta seçili` : 'Hasta Filtrele') : undefined}
                  >
                    <Filter className="w-4 h-4 text-gray-500" />
                    {!isMobile && (
                      <span>
                        {filterPatientIds.length === 0 
                          ? 'Tüm Hastalar' 
                          : filterPatientIds.length === 1
                            ? patients.find(p => p.id === filterPatientIds[0])?.data.name || '1 Hasta'
                            : `${filterPatientIds.length} Hasta`
                        }
                      </span>
                    )}
                    {filterPatientIds.length > 0 && (
                      <span className="bg-emerald-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                        {filterPatientIds.length}
                      </span>
                    )}
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterPatientIds.length === 0}
                            onChange={(e) => {
                              setIsFiltering(true);
                              if (e.target.checked) {
                                setFilterPatientIds([]);
                              }
                              setTimeout(() => setIsFiltering(false), 300);
                            }}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-900">Tüm Hastalar</span>
                        </label>
                        {patients.filter(patient => !patient.deleted_at).map((patient) => (
                          <label
                            key={patient.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filterPatientIds.includes(patient.id)}
                              onChange={(e) => {
                                setIsFiltering(true);
                                if (e.target.checked) {
                                  setFilterPatientIds([...filterPatientIds, patient.id]);
                                } else {
                                  setFilterPatientIds(filterPatientIds.filter(id => id !== patient.id));
                                }
                                setTimeout(() => setIsFiltering(false), 300);
                              }}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700">
                              {patient.patient_number ? `#${patient.patient_number} - ` : ''}
                              {patient.data.name || 'İsimsiz Hasta'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
                    setPatientSearchQuery('');
                    setShowPatientDropdown(false);
                    setShowNewPatientForm(false);
                    setShowCreateModal(true);
                  }}
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
          </div>
                  
          {/* Calendar Container - flexes to fill remaining space */}
          <div className={`flex-1 overflow-hidden transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="h-full"
              >
            <DnDCalendar
              localizer={localizer}
              events={events
                .filter(event => {
                  if (filterPatientIds.length === 0) return true; // Show all if no filter
                  return event.patient?.id && filterPatientIds.includes(event.patient.id);
                })
                .map(convertToRBCEvent)}
              startAccessor={(e) => (e as CalendarEventRBC).start as Date}
              endAccessor={(e) => (e as CalendarEventRBC).end as Date}
              defaultView={Views.WEEK}
              view={currentView}
              views={[Views.WEEK, Views.MONTH]}
              culture="tr"
              date={currentDate}
              onNavigate={(date) => {
                setCurrentDate(date);
                checkAndLoadEventsForDate(date);
              }}
              onView={handleViewChange}
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
      </div>

      {/* Create Appointment Side Panel */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-30 z-40"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
                setPatientSearchQuery('');
                setShowPatientDropdown(false);
                setShowNewPatientForm(false);
              }}
              aria-hidden="true"
            />
            
            {/* Side Panel */}
            <motion.div
              ref={createPanelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[480px] md:max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-appointment-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h2 id="create-appointment-title" className="text-lg sm:text-xl font-semibold text-gray-900">
                  Yeni Randevu Oluştur
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İşlem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örnek: Muayene"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    autoFocus
                  />
                </div>

                {/* Patient Autocomplete */}
                {!showNewPatientForm ? (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={patientInputRef}
                        type="text"
                        value={formData.patient_id ? getSelectedPatientName() : patientSearchQuery}
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value);
                          setFormData({ ...formData, patient_id: '' });
                          setShowPatientDropdown(true);
                          setSelectedPatientIndex(-1);
                        }}
                        onFocus={() => {
                          setShowPatientDropdown(true);
                          if (!formData.patient_id) {
                            setPatientSearchQuery('');
                          }
                        }}
                        onKeyDown={handlePatientInputKeyDown}
                        placeholder="Hasta ara veya seçiniz..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                        required
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      
                      {/* Dropdown */}
                      {showPatientDropdown && (
                        <div
                          ref={patientDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col"
                        >
                          {/* Scrollable patient list */}
                          <div className="max-h-60 overflow-auto">
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map((patient, index) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => handlePatientSelect(patient.id)}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                                    selectedPatientIndex === index ? 'bg-emerald-50' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                      {patient.patient_number ? `#${patient.patient_number} - ` : ''}
                                      {patient.data.name || 'İsimsiz Hasta'}
                                    </span>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Hasta bulunamadı
                              </div>
                            )}
                          </div>
                          {/* Fixed "Yeni Hasta Ekle" button at bottom */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPatientForm(true);
                              setShowPatientDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-t border-gray-200 flex-shrink-0"
                          >
                            <div className="flex items-center space-x-2 text-emerald-600">
                              <Plus className="w-4 h-4" />
                              <span className="text-sm font-medium">Yeni Hasta Ekle</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Add Patient Accordion - shown when showNewPatientForm is true */}
                {showNewPatientForm && (
                  <AddPatientAccordion
                    isOpen={showNewPatientForm}
                    onClose={() => setShowNewPatientForm(false)}
                    onAdd={handleAddNewPatient}
                    loading={isAddingPatient}
                    variant="inline"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({ ...formData, time: e.target.value });
                    }}
                    step="60"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', date: '', time: '', duration: '30', notes: '', patient_id: '' });
                    setPatientSearchQuery('');
                    setShowPatientDropdown(false);
                    setShowNewPatientForm(false);
                  }}
                  className="px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={createAppointment}
                  disabled={creating || !formData.title || !formData.date || !formData.time || !formData.patient_id}
                  className="px-4 py-2.5 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedEvent ? convertToAppointment(selectedEvent) : null}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={canModifyEvent(selectedEvent || {} as CalendarEvent) ? handleDeleteEvent : undefined}
        canModify={canModifyEvent(selectedEvent || {} as CalendarEvent)}
        isUpdating={updatingStatus === selectedEvent?.id}
        isDeleting={deletingEvent === selectedEvent?.id}
      />

      {/* Conflict Warning Modal */}
      <AnimatePresence>
        {showConflictModal && conflictWarning.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={handleConflictCancel}
              aria-hidden="true"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Randevu Çakışması
                    </h2>
                  </div>
                  <button
                    onClick={handleConflictCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Seçtiğiniz zaman diliminde <strong>{conflictWarning.length}</strong> randevu bulunmaktadır. 
                      Yine de devam etmek istiyor musunuz?
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Çakışan Randevular:</h3>
                    <div className="space-y-2">
                      {conflictWarning.map((conflict) => {
                        const conflictStart = conflict.start.dateTime 
                          ? new Date(conflict.start.dateTime) 
                          : new Date(conflict.start.date || '');
                        const conflictEnd = conflict.end.dateTime 
                          ? new Date(conflict.end.dateTime) 
                          : new Date(conflict.end.date || '');
                        const patientName = displayPatientName(conflict.patient);
                        
                        return (
                          <div
                            key={conflict.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {patientName}: {conflict.summary}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatTime(conflictStart.toISOString())} - {formatTime(conflictEnd.toISOString())}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-white">
                  <button
                    onClick={handleConflictCancel}
                    className="px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConflictOverride}
                    className="px-4 py-2.5 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Yine de Devam Et
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};