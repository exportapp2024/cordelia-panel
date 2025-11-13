import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import cordeliaLogo from '../assets/cordelia.png';

export const AuthForm: React.FC = () => {
  const { signIn, signUp, resetPasswordForEmail, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password validation functions
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

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Get detailed error message
  const getDetailedErrorMessage = (error: any) => {
    const errorMessage = error.message || error.toString();
    
    // Email related errors
    if (errorMessage.includes('Invalid email')) {
      return 'Geçersiz email adresi. Lütfen doğru bir email adresi girin.';
    }
    if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
      return 'Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin veya farklı bir email kullanın.';
    }
    if (errorMessage.includes('email')) {
      return 'Email ile ilgili bir hata oluştu. Lütfen email adresinizi kontrol edin.';
    }
    
    // Password related errors
    if (errorMessage.includes('Password should be at least')) {
      return 'Şifre en az 8 karakter olmalıdır.';
    }
    if (errorMessage.includes('Password') && errorMessage.includes('weak')) {
      return 'Şifre güvenlik gereksinimlerini karşılamıyor. Lütfen şifre kurallarını kontrol edin.';
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
    }
    
    // Auth errors
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Email veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
    }
    if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.';
    }
    
    // Password reset errors
    if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      return 'Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin.';
    }
    
    // Default fallback
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Email ve şifre gereklidir');
      }

      // Email validation
      if (!isValidEmail(email)) {
        throw new Error('Geçersiz email adresi. Lütfen doğru bir email adresi girin.');
      }

      if (!isLogin) {
        // Sign up validation
        if (!name.trim()) {
          throw new Error('Ad soyad gereklidir');
        }
        if (name.trim().length < 2) {
          throw new Error('Ad soyad en az 2 karakter olmalıdır');
        }
        if (!isPasswordValid(password)) {
          throw new Error('Şifre tüm güvenlik gereksinimlerini karşılamalıdır');
        }
        if (password !== confirmPassword) {
          throw new Error('Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar girin.');
        }
      }

      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name.trim());
        setSuccess('Hesap başarıyla oluşturuldu! Email adresinizi kontrol ederek hesabınızı doğrulayın.');
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        // Switch to login after 3 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(getDetailedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email) {
        throw new Error('Email adresi gereklidir');
      }

      if (!isValidEmail(email)) {
        throw new Error('Geçersiz email adresi. Lütfen doğru bir email adresi girin.');
      }

      await resetPasswordForEmail(email);
      // Güvenlik: Email kayıtlı olmasa bile başarı mesajı göster (email enumeration koruması)
      setSuccess('Şifre sıfırlama linki email adresinize gönderildi. Email kutunuzu kontrol edin. (Eğer email kayıtlıysa)');
      setEmail('');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(getDetailedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative">
          <Link
            to="/"
            className="absolute top-6 left-5 w-10 h-10 rounded-full hover:bg-emerald-100 flex items-center justify-center transition-colors group"
            title="Anasayfaya Dön"
          >
            <ArrowLeft className="w-6 h-6 text-white-500 group-hover:text-emerald-600 transition-colors" />
          </Link>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img src={cordeliaLogo} alt="Cordelia" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Cordelia</h1>
            <p className="text-gray-600 mt-2">Tıbbi Platformunuz</p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      email && !isValidEmail(email) 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200'
                    }`}
                    placeholder="doktor@hastane.com"
                    required
                  />
                </div>
                {email && !isValidEmail(email) && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    Geçersiz email formatı
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || authLoading || !isValidEmail(email) || !email}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || authLoading ? 'Gönderiliyor...' : 'Reset Linki Gönder'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setSuccess(null);
                    setEmail('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  disabled={loading || authLoading}
                >
                  ← Giriş sayfasına dön
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Dr. Ahmet Yılmaz"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    email && !isValidEmail(email) 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200'
                  }`}
                  placeholder="doktor@hastane.com"
                  required
                />
              </div>
              {email && !isValidEmail(email) && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  Geçersiz email formatı
                </p>
              )}
              {email && isValidEmail(email) && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <span className="w-1 h-1 bg-green-600 rounded-full mr-2"></span>
                  Geçerli email adresi
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
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
                  minLength={!isLogin ? 6 : undefined}
                />
              </div>
              {!isLogin && password && (
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

              {!isLogin && (
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
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-green-600 rounded-full mr-2"></span>
                      Şifreler eşleşiyor
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading || 
                  authLoading || 
                  !isValidEmail(email) ||
                  (!isLogin && (
                    !name.trim() || 
                    name.trim().length < 2 ||
                    !isPasswordValid(password) || 
                    password !== confirmPassword
                  ))
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || authLoading) ? 'Lütfen bekleyin...' : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
              </button>

            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {isLogin && !isForgotPassword && (
              <div>
                <button
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  disabled={loading || authLoading}
                >
                  Şifremi Unuttum
                </button>
              </div>
            )}
            {!isForgotPassword && (
              <button
                onClick={switchMode}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
                disabled={loading || authLoading}
              >
                {isLogin ? "Hesabınız yok mu? Kayıt olun" : 'Zaten hesabınız var mı? Giriş yapın'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};