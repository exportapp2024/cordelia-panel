import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MeetingsView } from './MeetingsView';
import { SettingsView } from './SettingsView';
import { PatientsView } from './PatientsView';
import { CalendarSuccessView } from './CalendarSuccessView';
import { ViewType } from '../types';

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('meetings');
  const [showCalendarSuccess, setShowCalendarSuccess] = useState(false);

  // Check for calendar connection success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      setShowCalendarSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleNavigateHome = () => {
    setShowCalendarSuccess(false);
    setCurrentView('meetings');
  };

  // Show calendar success screen if connected
  if (showCalendarSuccess) {
    return <CalendarSuccessView onNavigateHome={handleNavigateHome} />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'meetings':
        return <MeetingsView />;
      case 'patients':
        return <PatientsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <MeetingsView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};