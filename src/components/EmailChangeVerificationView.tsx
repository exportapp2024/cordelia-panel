import React, { useEffect, useState } from 'react';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const EmailChangeVerificationView: React.FC = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEmailChange = async () => {
      try {
        // Check if user came from email link (has hash parameters)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'email_change') {
          // User clicked on email change link - show success
          setIsVerified(true);
        }
      } catch (error) {
        console.error('Error checking email change:', error);
      } finally {
        setLoading(false);
      }
    };

    checkEmailChange();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' && session?.user) {
          // Email has been updated
          setIsVerified(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email Doğrulandı!</h1>
            <p className="text-gray-600 mt-2">
              Email adresiniz başarıyla doğrulandı. Lütfen diğer email adresinize gönderilen linke de tıklayın.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-900">Bir Adım Daha</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Email değişikliğinin tamamlanması için diğer email adresinize gönderilen doğrulama linkine de tıklamanız gerekmektedir.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard'a Dön</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Değişikliği Başlatıldı</h1>
          <p className="text-gray-600 mt-2">
            Email adresinizi değiştirmek için doğrulama işlemini tamamlamanız gerekiyor.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Doğrulama Emaillerini Kontrol Edin</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Hem <strong>mevcut email adresinize</strong> hem de <strong>yeni email adresinize</strong> doğrulama linkleri gönderildi.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Email değişikliğinin tamamlanması için <strong>her iki linke de tıklamanız</strong> gerekmektedir.
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
                  <li>• Her iki email adresinizdeki doğrulama linklerine tıklayın</li>
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
              <span>Dashboard'a Dön</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

