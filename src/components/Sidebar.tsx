import React from 'react';
import { Calendar, Settings, Users, LogOut, Menu, X, Clock } from 'lucide-react';
import { ViewType } from '../types';
import { useAuth } from '../hooks/useAuth';
import cordeliaLogo from '../assets/cordelia.png';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onToggle }) => {
  const { user, signOut } = useAuth();
  const menuItems = [
    { id: 'meetings' as ViewType, label: 'Randevular', icon: Calendar },
    { id: 'patients' as ViewType, label: 'Hastalar', icon: Users },
    { id: 'settings' as ViewType, label: 'Ayarlar', icon: Settings },
  ];

  if (!user) return null;

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Header - Always visible on mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={cordeliaLogo} alt="Cordelia" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Cordelia</h1>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header with close button */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src={cordeliaLogo} alt="Cordelia" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cordelia</h1>
                <p className="text-sm text-gray-500">Tıbbi Platform</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Membership Status Card */}
          <div className="p-4">
            <div 
              className="membership-anim border-2 border-emerald-400 rounded-xl p-4 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
              onClick={() => {
                // Navigate to pricing or renewal page when implemented
                console.log('Membership renewal clicked');
              }}
            >
              <div className="flex items-center justify-center mb-1.5">
                <Clock className="w-4 h-4 text-white mr-1.5" />
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Üyelik Durumu</span>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white mb-0.5 leading-none">89</div>
                <div className="text-sm font-bold text-emerald-50 mb-2">gün kaldı</div>
                <div className="text-xs text-white bg-white/20 rounded-lg px-3 py-1 inline-block font-medium">
                  Hemen Yenile
                </div>
              </div>
            </div>
          </div>

          {/* User Info at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 h-screen flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src={cordeliaLogo} alt="Cordelia" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cordelia</h1>
              <p className="text-sm text-gray-500">Tıbbi Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Membership Status Card */}
        <div className="p-4">
          <div 
            className="membership-anim border-2 border-emerald-400 rounded-xl p-4 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
            onClick={() => {
              // Navigate to pricing or renewal page when implemented
              console.log('Membership renewal clicked');
            }}
          >
            <div className="flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4 text-white mr-1.5" />
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Üyelik Durumu</span>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white mb-0.5 leading-none">89</div>
              <div className="text-sm font-bold text-emerald-50 mb-2">gün kaldı</div>
              <div className="text-xs text-white bg-white/20 rounded-lg px-3 py-1 inline-block font-medium">
                Hemen Yenile
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};