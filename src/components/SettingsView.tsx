import React, { useState } from 'react';
import { User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { TeamManagementSection } from './TeamManagementSection';

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
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