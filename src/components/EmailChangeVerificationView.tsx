import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const EmailChangeVerificationView: React.FC = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isEmailChangeComplete, setIsEmailChangeComplete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkTokenAndVerify = async () => {
      try {
        // Check URL hash for email change token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const messageParam = hashParams.get('message');

        // Verify we have a valid email change token
        if (!accessToken || (type !== 'email_change' && !(messageParam && messageParam.includes('Confirmation link accepted')))) {
          setIsVerified(false);
          return;
        }

        // Try to set session with the token to verify it's valid
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (sessionError) {
            console.error('Session set error:', sessionError);
            setIsVerified(false);
            return;
          }

          // Token is valid, now wait for USER_UPDATED event or check if email was already updated
          setIsVerified(true);
        } catch (err) {
          console.error('Token verification error:', err);
          setIsVerified(false);
        }
      } catch (err) {
        console.error('Verification check error:', err);
        setIsVerified(false);
      }
    };

    checkTokenAndVerify();

    // Listen for USER_UPDATED event which indicates email change completed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' && session?.user) {
          // Email change completed
          setIsEmailChangeComplete(true);
          setMessage('Email adresiniz başarıyla güncellendi!');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking token
  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Doğrulama kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid or user navigated directly
  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Geçersiz Link</h1>
            <p className="text-gray-600 mt-2">
              Email değişikliği doğrulama linki geçersiz veya süresi dolmuş.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Lütfen email değişikliği işlemini tekrar başlatın.
            </p>
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
    );
  }

  // Show success message - only shown if token was valid
  // If email change is complete, show full success, otherwise show partial success
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEmailChangeComplete ? 'Email Doğrulandı!' : 'Email Doğrulama Başlatıldı'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEmailChangeComplete
              ? 'Bu email adresi başarıyla doğrulandı.'
              : 'Bu email adresi doğrulandı. Email değişikliğinin tamamlanması için diğer email adresinizdeki doğrulama linkine de tıklamanız gerekmektedir.'}
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        <div className="space-y-6">
          {!isEmailChangeComplete && (
            <>
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
            </>
          )}

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

