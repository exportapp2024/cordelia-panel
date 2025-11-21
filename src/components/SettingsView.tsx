import React, { useState } from 'react';
import { User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { TeamManagementSection } from './TeamManagementSection';
import { buildApiUrl } from '../lib/api';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, updateEmail } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deletePassword, setDeletePassword] = useState('');

  // Update profile data when user changes
  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Check if email has changed
      const emailChanged = profileData.email !== user?.email;
      const nameChanged = profileData.name !== user?.name;

      if (!emailChanged && !nameChanged) {
        setMessage('Herhangi bir değişiklik yapılmadı.');
        return;
      }

      // Update name first if changed (name update doesn't require verification)
      if (nameChanged) {
        await updateProfile({
          name: profileData.name,
        });
      }

      // Update email if changed (this requires verification flow)
      if (emailChanged) {
        await updateEmail(profileData.email);
        if (nameChanged) {
          setMessage(`✓ Profil Güncellendi!

• İsim başarıyla güncellendi.
• Email değişikliği başlatıldı.

Doğrulama linkleri gönderildi:
• Mevcut email: ${user?.email}
• Yeni email: ${profileData.email}

Her iki email adresinizdeki doğrulama linklerine tıklamanız gerekmektedir.`);
        } else {
          setMessage(`✓ Email Değişikliği Başlatıldı!

Doğrulama linkleri gönderildi:
• Mevcut email: ${user?.email}
• Yeni email: ${profileData.email}

Her iki email adresinizdeki doğrulama linklerine tıklamanız gerekmektedir.`);
        }
      } else {
        // Only name was changed
        setMessage('Profil başarıyla güncellendi!');
      }
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
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
    if (!deletePassword) {
      setMessage('Hata: Şifre gereklidir');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(buildApiUrl(`users/${user?.id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hesap silinirken bir hata oluştu');
      }

      setMessage('Hesap başarıyla silindi. Yönlendiriliyorsunuz...');
      setShowDeleteModal(false);
      setDeletePassword('');
      
      // Sign out and redirect to landing page
      await supabase.auth.signOut();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
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
            <div className={`p-4 rounded-lg border-2 ${
              message.startsWith('Hata') 
                ? 'bg-red-50 border-red-300 text-red-700' 
                : message.startsWith('✓')
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-green-50 border-green-300 text-green-700'
            }`}>
              <p className="text-sm font-medium whitespace-pre-line">{message}</p>
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
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Mevcut email: {user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">Email değiştirirseniz, hem eski hem yeni adresinize doğrulama linki gönderilecektir.</p>
          </div>
          
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
          </button>
        </form>
      </div>



      {/* Team & Calendar */}
      <TeamManagementSection />

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
            <p className="text-gray-600 mb-4">
              Bu işlem geri alınamaz! Hesabınız ve tüm verileriniz kalıcı olarak silinecek.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devam etmek için şifrenizi girin:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Şifreniz"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword}
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