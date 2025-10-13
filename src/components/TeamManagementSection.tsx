import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  LogOut, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';

export const TeamManagementSection: React.FC = () => {
  const { user } = useAuth();
  const {
    teamMembers,
    pendingInvitations,
    teamInfo,
    loading,
    error,
    inviteTeamMember,
    acceptInvitation,
    rejectInvitation,
    removeTeamMember,
    disconnectCalendar,
    getTeamMembers,
    getPendingInvitations,
    getTeamInfo,
    checkIsTeamOwner
  } = useTeam(user?.id || null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await inviteTeamMember(inviteEmail.trim());
      setInviteEmail('');
      setInviteMessage(`Davet ${inviteEmail.trim()} adresine gönderildi!`);
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (error) {
      console.error('Error inviting member:', error);
      setInviteMessage(`Hata: ${error instanceof Error ? error.message : 'Davet gönderilemedi'}`);
      setTimeout(() => setInviteMessage(null), 5000);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bu üyeyi takımdan çıkarmak istediğinize emin misiniz?')) {
      return;
    }

    try {
      await removeTeamMember(memberId);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleDisconnectCalendar = async () => {
    setDisconnectLoading(true);
    try {
      await disconnectCalendar();
      setShowDisconnectModal(false);
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
    } finally {
      setDisconnectLoading(false);
    }
  };

  const isTeamOwner = teamMembers.some(member => member.role === 'owner');
  const isTeamMember = teamInfo !== null;
  const hasCalendarAccess = isTeamOwner || isTeamMember;

  console.log('TeamManagementSection - teamMembers:', teamMembers);
  console.log('TeamManagementSection - teamInfo:', teamInfo);
  console.log('TeamManagementSection - hasCalendarAccess:', hasCalendarAccess);

  // Show loading state while team data is being fetched
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Takım & Takvim</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-600">Takım bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="w-6 h-6 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Takım & Takvim</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Team Owner Section */}
      {isTeamOwner && (
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Takım Sahibisiniz</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">Takviminiz bağlı</span>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Takım Üyeleri</h3>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-gray-600">Yükleniyor...</span>
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz takım üyesi yok</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.users?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{member.users?.email || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'owner' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'owner' ? 'Sahip' : 'Üye'}
                      </span>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.member_user_id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Üyeyi çıkar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Member */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Üye Davet Et</h3>
            <form onSubmit={handleInviteMember} className="flex space-x-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email adresi girin"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Davet Et</span>
              </button>
            </form>
            
            {/* Invite Message */}
            {inviteMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                inviteMessage.includes('Hata') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {inviteMessage}
              </div>
            )}
          </div>

          {/* Disconnect Calendar */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Takvimi Bağlantısını Kes</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Member Section */}
      {isTeamMember && !isTeamOwner && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Takım Üyesisiniz</span>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {teamInfo?.users?.name || 'Unknown'} takımının takvimini kullanıyorsunuz
                </p>
                <p className="text-sm text-blue-700">{teamInfo?.users?.email || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDisconnectModal(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Takımdan Ayrıl</span>
          </button>
        </div>
      )}

      {/* No Team Section */}
      {!hasCalendarAccess && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Takvim Bağlantısı Gerekli
          </h3>
          <p className="text-gray-600 mb-4">
            Takviminizi bağlayarak takım sahibi olabilir veya bir takıma katılabilirsiniz.
          </p>
          <button
            onClick={() => window.location.href = '/meetings'}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Takvimi Bağla
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            getTeamMembers();
            getPendingInvitations();
            getTeamInfo();
          }}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-900">
              {isTeamOwner ? 'Takvimi Bağlantısını Kes' : 'Takımdan Ayrıl'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isTeamOwner 
                ? 'Bu işlem takviminizi bağlantısını kesecek ve tüm takım üyelerini çıkaracak. Bu işlem geri alınamaz!'
                : 'Bu işlem takımdan ayrılmanıza neden olacak ve takvim erişiminizi kaybedeceksiniz.'
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDisconnectCalendar}
                disabled={disconnectLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {disconnectLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <span>{isTeamOwner ? 'Bağlantıyı Kes' : 'Ayrıl'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
