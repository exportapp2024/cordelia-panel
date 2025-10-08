import React from 'react';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';

interface CalendarSuccessViewProps {
  onNavigateHome: () => void;
}

export const CalendarSuccessView: React.FC<CalendarSuccessViewProps> = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bağlantı Başarılı!
          </h1>
          
          <p className="text-gray-600">
            Google Calendar hesabınız başarıyla bağlandı
          </p>
        </div>

        {/* Success Details */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-900 mb-1">
                Takvim Senkronizasyonu Aktif
              </h3>
              <p className="text-sm text-emerald-700">
                Artık randevularınız otomatik olarak Google Calendar'ınızla senkronize edilecek.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Neler Yapabilirsiniz?
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Yeni randevular otomatik olarak takviminize eklenir</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Randevu değişiklikleri anında güncellenir</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Tüm randevularınızı tek yerden yönetebilirsiniz</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onNavigateHome}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 group"
        >
          <span>Ana Sayfaya Dön</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Ayarlar bölümünden bağlantınızı istediğiniz zaman yönetebilirsiniz
        </p>
      </div>
    </div>
  );
};

