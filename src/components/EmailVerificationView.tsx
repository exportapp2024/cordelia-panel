import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const EmailVerificationView: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Get current user email
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  const resendVerification = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage('Doğrulama emaili tekrar gönderildi!');
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        setIsVerified(true);
        setMessage('Email adresiniz başarıyla doğrulandı!');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  useEffect(() => {
    // Check verification status every 5 seconds
    const interval = setInterval(checkVerificationStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Doğrulandı!</h1>
          <p className="text-gray-600 mb-6">
            Email adresiniz başarıyla doğrulandı. Artık Cordelia'yı kullanmaya başlayabilirsiniz.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Doğrulama Gerekli</h1>
          <p className="text-gray-600 mt-2">
            Hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekiyor.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Doğrulama Emaili Gönderildi</h3>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>{email}</strong> adresine doğrulama emaili gönderildi.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Email'inizi kontrol edin ve doğrulama linkine tıklayın.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('Hata') 
                ? 'bg-red-50 border border-red-200 text-red-600' 
                : 'bg-green-50 border border-green-200 text-green-600'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={resendVerification}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Doğrulama Emailini Tekrar Gönder</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                onClick={checkVerificationStatus}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Doğrulama Durumunu Kontrol Et
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Email gelmedi mi?</h4>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Spam klasörünü kontrol edin</li>
                  <li>• Email adresinizi doğru yazdığınızdan emin olun</li>
                  <li>• Birkaç dakika bekleyin ve tekrar deneyin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

