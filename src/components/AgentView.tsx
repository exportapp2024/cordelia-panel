import React, { useState } from 'react';
import { Bot, Zap, CheckCircle, AlertCircle, Calendar as CalendarIcon, RefreshCw as Refresh } from 'lucide-react';
import { useAgentSettings } from '../hooks/useAgentSettings';

export const AgentView: React.FC = () => {
  const { settings, loading, toggleConnection, toggleCalendar } = useAgentSettings();

  const handleToggleAgent = async () => {
    try {
      await toggleConnection();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      await toggleCalendar();
    } catch (error) {
      console.error('Error connecting calendar:', error);
    }
  };

  const formatLastSync = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-600 mt-2 text-center">Asistan ayarları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-center">Asistan ayarları yüklenemedi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Asistan</h1>
        <p className="text-gray-600">AI asistan bağlantınızı ve ayarlarınızı yönetin</p>
      </div>

      {/* Agent Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              settings.connected ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Bot className={`w-6 h-6 ${
                settings.connected ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cordelia AI Asistan</h2>
              <p className="text-gray-600">Akıllı tıbbi not alma ve analiz</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              settings.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {settings.connected ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{settings.connected ? 'Bağlı' : 'Bağlı Değil'}</span>
            </div>
            
            <button
              onClick={handleToggleAgent}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.connected ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.connected ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Sürüm</p>
              <p className="font-semibold text-gray-900">{settings.version}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Refresh className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Son Senkronizasyon</p>
              <p className="font-semibold text-gray-900">{formatLastSync(settings.last_sync)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Bot className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Bugünkü Oturumlar</p>
              <p className="font-semibold text-gray-900">7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Integration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              settings.calendar_connected ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <CalendarIcon className={`w-6 h-6 ${
                settings.calendar_connected ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Takvim Entegrasyonu</h2>
              <p className="text-gray-600">Otomatik planlama için Google Calendar ile senkronize olun</p>
            </div>
          </div>
          
          {!settings.calendar_connected ? (
            <button
              onClick={handleConnectCalendar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Google Calendar Bağla
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span>Bağlı</span>
            </div>
          )}
        </div>

        {settings.calendar_connected && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Google Calendar'a başarıyla bağlandı</p>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Randevularınız artık Cordelia AI ile otomatik olarak senkronize olacak.
            </p>
          </div>
        )}
      </div>

      {/* AI Capabilities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Yetenekleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Gerçek Zamanlı Transkripsiyon</h4>
              <p className="text-sm text-gray-600">Konuşmaları doğru tıbbi notlara dönüştürün</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Akıllı Analiz</h4>
              <p className="text-sm text-gray-600">Ana semptomları ve önerileri belirleyin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};