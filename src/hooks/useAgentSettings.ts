import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface AgentSettings {
  id: string;
  connected: boolean;
  version: string;
  last_sync: string;
  calendar_connected: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgentSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Set default demo settings
        setSettings({
          id: 'demo',
          connected: false,
          version: '1.0.0',
          last_sync: new Date().toISOString(),
          calendar_connected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('agent_settings')
            .insert([{
              user_id: user.id,
              connected: false,
              version: '1.0.0',
              last_sync: new Date().toISOString(),
              calendar_connected: false,
            }])
            .select()
            .single();

          if (createError) throw createError;
          setSettings(newSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching agent settings:', error);
      // Set fallback demo settings
      setSettings({
        id: 'demo',
        connected: false,
        version: '1.0.0',
        last_sync: new Date().toISOString(),
        calendar_connected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AgentSettings>) => {
    if (!user || !settings) throw new Error('No user or settings available');

    const { data, error } = await supabase
      .from('agent_settings')
      .update({ ...updates, last_sync: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setSettings(data);
    return data;
  };

  const toggleConnection = async () => {
    if (!settings) return;
    
    return updateSettings({ connected: !settings.connected });
  };

  const toggleCalendar = async () => {
    if (!settings) return;
    
    return updateSettings({ calendar_connected: !settings.calendar_connected });
  };

  return {
    settings,
    loading,
    updateSettings,
    toggleConnection,
    toggleCalendar,
    refetch: fetchSettings,
  };
};