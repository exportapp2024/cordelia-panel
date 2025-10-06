import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MeetingsView } from './MeetingsView';
import { SettingsView } from './SettingsView';
import { PatientsView } from './PatientsView';
import { ViewType } from '../types';

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('meetings');

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