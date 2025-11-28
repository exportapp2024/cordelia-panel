import React from 'react';
import { CheckCircle, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmailChangeVerificationView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Doğrulandı!</h1>
          <p className="text-gray-600 mt-2">
            Bu email adresi başarıyla doğrulandı.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Diğer Email'i Kontrol Edin</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Email değişikliğinin tamamlanması için <strong>diğer email adresinize</strong> gönderilen doğrulama linkine de tıklamanız gerekmektedir.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 text-sm">Önemli</h4>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  <li>• Diğer email adresinizdeki doğrulama linkine tıklayın</li>
                  <li>• Linkler 24 saat geçerlidir</li>
                  <li>• Email gelmedi mi? Spam klasörünü kontrol edin</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

