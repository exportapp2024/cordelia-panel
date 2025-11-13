import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import cordeliaLogo from '../assets/cordelia.png';

export const ResetPasswordView: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // Password validation functions (same as AuthForm)
  const getPasswordValidation = (password: string) => {
    return {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      digit: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  };

  const isPasswordValid = (password: string) => {
    const validation = getPasswordValidation(password);
    return Object.values(validation).every(Boolean);
  };

  const getPasswordStrength = (password: string) => {
    const validation = getPasswordValidation(password);
    const validCount = Object.values(validation).filter(Boolean).length;
    
    if (validCount < 3) return { text: 'Zayıf', color: 'text-red-600' };
    if (validCount < 5) return { text: 'Orta', color: 'text-yellow-600' };
    return { text: 'Güçlü', color: 'text-green-600' };
  };

  // Check if token is valid on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Check URL hash for recovery token first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // Try to set session with the recovery token
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });
            
            if (!sessionError) {
              setIsTokenValid(true);
              return;
            }
          } catch (err) {
            console.error('Session set error:', err);
          }
        }

        // Fallback: check existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if we're in password recovery mode by checking URL or session metadata
          if (type === 'recovery' || window.location.hash.includes('type=recovery')) {
            setIsTokenValid(true);
          } else {
            // User might have a valid session but not in recovery mode
            // Check if they came from a recovery link
            setIsTokenValid(true); // Allow them to proceed, Supabase will validate
          }
        } else {
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error('Token check error:', err);
        setIsTokenValid(false);
      }
    };

    checkToken();
  }, []);

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (event, _session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsTokenValid(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation
      if (!password || !confirmPassword) {
        throw new Error('Şifre ve şifre tekrarı gereklidir');
      }

      if (!isPasswordValid(password)) {
        throw new Error('Şifre tüm güvenlik gereksinimlerini karşılamalıdır');
      }

      if (password !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar girin.');
      }

      await updatePassword(password);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Token kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Geçersiz Link</h1>
              <p className="text-gray-600 mt-2">Şifre sıfırlama linki geçersiz veya süresi dolmuş.</p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Lütfen yeni bir şifre sıfırlama isteği gönderin.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Giriş Sayfasına Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img src={cordeliaLogo} alt="Cordelia" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Şifre Belirle</h1>
            <p className="text-gray-600 mt-2">Güçlü bir şifre seçin</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Şifre Başarıyla Güncellendi!</h2>
              <p className="text-gray-600">Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                {password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Şifre Güvenliği:</span>
                      <span className={`text-sm font-medium ${getPasswordStrength(password).color}`}>
                        {getPasswordStrength(password).text}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          getPasswordValidation(password).length ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {getPasswordValidation(password).length && (
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          getPasswordValidation(password).length ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          En az 8 karakter
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          getPasswordValidation(password).lowercase ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {getPasswordValidation(password).lowercase && (
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          getPasswordValidation(password).lowercase ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Küçük harf (a-z)
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          getPasswordValidation(password).uppercase ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {getPasswordValidation(password).uppercase && (
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          getPasswordValidation(password).uppercase ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Büyük harf (A-Z)
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          getPasswordValidation(password).digit ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {getPasswordValidation(password).digit && (
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          getPasswordValidation(password).digit ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Rakam (0-9)
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:col-span-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          getPasswordValidation(password).symbol ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {getPasswordValidation(password).symbol && (
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                        <span className={`text-xs ${
                          getPasswordValidation(password).symbol ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Özel karakter (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre Tekrarı
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    Şifreler eşleşmiyor
                  </p>
                )}
                {confirmPassword && password === confirmPassword && password && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <span className="w-1 h-1 bg-green-600 rounded-full mr-2"></span>
                    Şifreler eşleşiyor
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading || 
                  !isPasswordValid(password) || 
                  password !== confirmPassword ||
                  !password ||
                  !confirmPassword
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  disabled={loading}
                >
                  Giriş sayfasına dön
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

