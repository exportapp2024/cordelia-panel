import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  LogOut, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  Mail,
  X,
  Edit2,
  Check,
  XCircle
} from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../hooks/useAuth';
import { buildApiUrl } from '../lib/api';

export const TeamManagementSection: React.FC = () => {
  const { user } = useAuth();
  const {
    teamMembers,
    teamInfo,
    pendingInvitations,
    sentInvitations,
    loading,
    error,
    inviteTeamMember,
    removeTeamMember,
    disconnectCalendar,
    getTeamMembers,
    getPendingInvitations,
    getSentInvitations,
    getTeamInfo,
    createTeam,
    updateTeamName,
    acceptInvitation,
    rejectInvitation
  } = useTeam(user?.id || null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamDetails, setTeamDetails] = useState<any>(null);

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

  // Check if user is actually a team owner (has members or owns a team)
  const isTeamOwner = teamMembers.some(member => member.role === 'owner') || 
                      (teamInfo?.ownedTeams && teamInfo.ownedTeams.length > 0);
  
  // Check if user is actually a team member (not just has pending invitations)
  // User is a team member only if they have accepted an invitation and are in team_members table
  // Use teamInfo.memberTeams as the primary source (most reliable)
  const isTeamMember = teamInfo?.memberTeams && teamInfo.memberTeams.length > 0 && !isTeamOwner;
  
  // User has calendar access only if they are actually a team owner or member (not just invited)
  const hasCalendarAccess = isTeamOwner || isTeamMember;

  // Fetch team details
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(buildApiUrl(`calendar/team/details/${user.id}`));
        const data = await response.json();
        if (data.success) {
          setTeamDetails(data.team);
        }
      } catch (err) {
        console.error('Error fetching team details:', err);
      }
    };
    fetchTeamDetails();
  }, [user?.id, teamMembers, teamInfo]);


  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTeam(teamName.trim() || '');
      setShowCreateTeamModal(false);
      setTeamName('');
      setInviteMessage('Takım başarıyla oluşturuldu!');
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (error) {
      console.error('Error creating team:', error);
      setInviteMessage(`Hata: ${error instanceof Error ? error.message : 'Takım oluşturulamadı'}`);
      setTimeout(() => setInviteMessage(null), 5000);
    }
  };

  const handleUpdateTeamName = async () => {
    try {
      await updateTeamName(teamName.trim() || '');
      setEditingTeamName(false);
      setTeamName('');
      setInviteMessage('Takım adı başarıyla güncellendi!');
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (error) {
      console.error('Error updating team name:', error);
      setInviteMessage(`Hata: ${error instanceof Error ? error.message : 'Takım adı güncellenemedi'}`);
      setTimeout(() => setInviteMessage(null), 5000);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      // Refresh all team data after accepting invitation
      // Force refresh by calling all functions sequentially
      await getTeamInfo();
      // Small delay to ensure backend has processed the invitation
      await new Promise(resolve => setTimeout(resolve, 500));
      await getTeamMembers();
      await getPendingInvitations();
      await getSentInvitations();
      // Refresh team details - wait for it to complete
      const response = await fetch(buildApiUrl(`calendar/team/details/${user?.id}`));
      const data = await response.json();
      if (data.success && data.team) {
        setTeamDetails(data.team);
      } else {
        // If no team returned, set to null to trigger re-render
        setTeamDetails(null);
      }
      // Force another refresh of teamInfo to ensure UI updates
      await getTeamInfo();
      setInviteMessage('Davet kabul edildi!');
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setInviteMessage(`Hata: ${error instanceof Error ? error.message : 'Davet kabul edilemedi'}`);
      setTimeout(() => setInviteMessage(null), 5000);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      setInviteMessage('Davet reddedildi');
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      setInviteMessage(`Hata: ${error instanceof Error ? error.message : 'Davet reddedilemedi'}`);
      setTimeout(() => setInviteMessage(null), 5000);
    }
  };

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

      {/* Pending Invitations Section */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-md font-medium text-gray-900 mb-3">Bekleyen Davetler</h3>
          {pendingInvitations.map((invitation) => (
            <div key={invitation.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {invitation.users?.name || 'Bilinmeyen'} sizi takımına davet etti
                    </p>
                    <p className="text-sm text-blue-700">{invitation.users?.email || invitation.invited_email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Kabul Et</span>
                  </button>
                  <button
                    onClick={() => handleRejectInvitation(invitation.id)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reddet</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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

          {/* Team Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-gray-900">Takım Adı</h3>
              {!editingTeamName && (
                <button
                  onClick={() => {
                    setEditingTeamName(true);
                    setTeamName(teamDetails?.name || '');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Düzenle</span>
                </button>
              )}
            </div>
            {editingTeamName ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Takım adı girin"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  onClick={handleUpdateTeamName}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingTeamName(false);
                    setTeamName('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-gray-700 p-3 bg-gray-50 rounded-lg">
                {teamDetails?.name || 'Takım adı belirtilmemiş'}
              </p>
            )}
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

          {/* Sent Invitations */}
          {sentInvitations && sentInvitations.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Gönderilen Davetler</h3>
              <div className="space-y-2">
                {sentInvitations.map((invitation) => (
                  <div key={invitation.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {invitation.invited_user?.name || invitation.invited_email}
                          </p>
                          <p className="text-sm text-gray-500">{invitation.invited_email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invitation.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : invitation.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invitation.status === 'pending' ? 'Bekliyor' : 
                         invitation.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Team Member Section - Only show if user has actually accepted an invitation */}
      {isTeamMember && !isTeamOwner && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Takım Üyesisiniz</span>
          </div>
          
          {/* Team Name */}
          {teamInfo?.memberTeams && teamInfo.memberTeams.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 font-medium">
                {teamInfo.memberTeams[0]?.name || 'Takım adı belirtilmemiş'}
              </p>
            </div>
          )}
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {teamInfo?.memberTeams?.[0]?.name || 'Bilinmeyen'} takımının takvimini kullanıyorsunuz
                </p>
                {teamDetails?.owner && (
                  <p className="text-sm text-blue-700">{teamDetails.owner.email || teamDetails.owner.name || 'Bilinmeyen'}</p>
                )}
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

      {/* No Team Section - Show if user has no team (even if they have pending invitations) */}
      {!hasCalendarAccess && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Takım Oluşturun
          </h3>
          <p className="text-gray-600 mb-4">
            Takım oluşturarak diğer kullanıcıları davet edebilir ve ortak takvim kullanabilirsiniz.
          </p>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 mx-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Takım Oluştur</span>
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            getTeamMembers();
            getPendingInvitations();
            getSentInvitations();
            getTeamInfo();
          }}
          disabled={loading}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Takım Oluştur</h3>
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setTeamName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Takım Adı
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Örn: Doktorlar Takımı (Opsiyonel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Takım adı opsiyoneldir, daha sonra değiştirebilirsiniz</p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    setTeamName('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <span>Oluştur</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
