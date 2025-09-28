import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Meeting {
  id: string;
  date: string;
  time: string;
  patient_name: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMeetings = async () => {
    if (!user) return;

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('meetings')
      .insert([{ ...meeting, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    
    setMeetings(prev => [...prev, data]);
    return data;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setMeetings(prev => prev.map(meeting => 
      meeting.id === id ? { ...meeting, ...data } : meeting
    ));
    return data;
  };

  const deleteMeeting = async (id: string) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
  };

  return {
    meetings,
    loading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    refetch: fetchMeetings,
  };
};