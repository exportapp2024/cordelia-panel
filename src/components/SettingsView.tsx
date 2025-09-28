import React, { useState } from 'react';
import { User, Mail, Shield, LogOut, MessageCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, signOut } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        name: profileData.name,
      });
      setMessage('Profil başarıyla güncellendi!');
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Yeni şifreler eşleşmiyor');
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error('Yeni şifre en az 6 karakter olmalıdır');
      }

      // Supabase auth password update
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage('Şifre başarıyla değiştirildi!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Delete all user data from database
      const { error: patientsError } = await supabase
        .from('patients')
        .delete()
        .eq('user_id', user?.id);

      if (patientsError) throw patientsError;

      const { error: telegramError } = await supabase
        .from('telegram_users')
        .delete()
        .eq('user_id', user?.id);

      if (telegramError) throw telegramError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');

      if (authError) throw authError;

      setMessage('Hesap başarıyla silindi');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyLinkingCode = async () => {
    if (user?.id) {
      try {
        await navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600">Hesap tercihlerinizi ve güvenlik ayarlarınızı yönetin</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${
              message.startsWith('Hata') 
                ? 'bg-red-50 border border-red-200 text-red-600' 
                : 'bg-green-50 border border-green-200 text-green-600'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Adresi
            </label>
            <input
              type="email"
              value={profileData.email}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email adresi değiştirilemez</p>
          </div>
          
          
          <button 
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
          </button>
        </form>
      </div>


      {/* Telegram Integration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageCircle className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Telegram Entegrasyonu</h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Telegram Bot'unuzu Bağlayın</h3>
            <p className="text-sm text-blue-700 mb-4">
              AI asistanımız aracılığıyla hasta bilgilerini almak ve göndermek için Telegram hesabınızı bağlayın.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Bağlantı Kodunuz:
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-blue-100 border border-blue-300 rounded text-sm font-mono text-blue-900">
                    {user?.id || 'Yükleniyor...'}
                  </code>
                  <button
                    onClick={copyLinkingCode}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Kurulum Talimatları:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Telegram'da Cordelia bot'unuzla sohbet başlatın</li>
                  <li>Komutu gönderin: <code className="bg-blue-100 px-1 rounded">/start</code></li>
                  <li>Gönderin: <code className="bg-blue-100 px-1 rounded">/link {user?.id?.slice(0, 8)}...</code> (yukarıdaki tam kodu kopyalayın)</li>
                  <li>Hasta bilgilerini göndermeye başlayın!</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Kullanım Örnekleri</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="bg-gray-50 p-2 rounded">
                <code>"Yeni hasta ekle: Ahmet Yılmaz, 35, migren ağrısı"</code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code>"Hasta: Ayşe Demir, 42, diyabet kontrolü, ilaç gözden geçirilmeli"</code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code>"Yeni hasta: Zeynep Kaya, 28, anksiyete bozukluğu, ilk konsültasyon"</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Güvenlik</h2>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Şifre Değiştir</h3>
            <p className="text-sm text-gray-600">Hesabınızı güvende tutmak için şifrenizi güncelleyin</p>
          </button>
          
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <LogOut className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Tehlikeli Bölge</h2>
        </div>
        
        <div className="space-y-4">
          
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <h3 className="font-medium text-red-900">Hesabı Sil</h3>
            <p className="text-sm text-red-600">Hesabınızı ve tüm verilerinizi kalıcı olarak silin</p>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Şifre Değiştir</h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şifre Tekrarı
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-900">Hesabı Sil</h3>
            <p className="text-gray-600 mb-6">
              Bu işlem geri alınamaz! Hesabınız ve tüm verileriniz kalıcı olarak silinecek.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Siliniyor...' : 'Hesabı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};