import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MeetingsView } from './MeetingsView';
import { SettingsView } from './SettingsView';
import { PatientsView } from './PatientsView';
import { ViewType } from '../types';

export const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewType>('meetings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize view from URL query parameter
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['meetings', 'patients', 'settings'].includes(viewParam)) {
      setCurrentView(viewParam as ViewType);
    }
  }, [searchParams]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto md:ml-0">
        <div className="p-4 md:p-8">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
};