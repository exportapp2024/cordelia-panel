import { useState, useEffect } from 'react';
import { buildApiUrl } from '../lib/api';

export interface TeamMember {
  id: string;
  member_user_id: string;
  role: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_owner_id: string;
  invited_email: string;
  status: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeamInfo {
  team_owner_id: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export const useTeam = (userId: string | null) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get team members (if user is team owner)
  const getTeamMembers = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/members/${userId}`));
      const data = await response.json();
      
      if (data.success) {
        setTeamMembers(data.members);
      } else {
        throw new Error(data.error || 'Failed to get team members');
      }
    } catch (err: any) {
      console.error('Error getting team members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get pending invitations for user
  const getPendingInvitations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/invitations/${userId}`));
      const data = await response.json();
      
      if (data.success) {
        setPendingInvitations(data.invitations);
      } else {
        throw new Error(data.error || 'Failed to get invitations');
      }
    } catch (err: any) {
      console.error('Error getting invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get team info (for team members)
  const getTeamInfo = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/info/${userId}`));
      const data = await response.json();
      
      if (data.success) {
        setTeamInfo(data.teamInfo);
      } else {
        throw new Error(data.error || 'Failed to get team info');
      }
    } catch (err: any) {
      console.error('Error getting team info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Invite team member
  const inviteTeamMember = async (email: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl('calendar/team/invite'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamOwnerId: userId,
          invitedEmail: email
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh team members
        await getTeamMembers();
        return data.invitation;
      } else {
        throw new Error(data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation
  const acceptInvitation = async (invitationId: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/invitations/${invitationId}/accept`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh invitations and team info
        await getPendingInvitations();
        await getTeamInfo();
        return data.teamInfo;
      } else {
        throw new Error(data.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject invitation
  const rejectInvitation = async (invitationId: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/invitations/${invitationId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh invitations
        await getPendingInvitations();
      } else {
        throw new Error(data.error || 'Failed to reject invitation');
      }
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove team member
  const removeTeamMember = async (memberId: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/members/${memberId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamOwnerId: userId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh team members
        await getTeamMembers();
      } else {
        throw new Error(data.error || 'Failed to remove team member');
      }
    } catch (err: any) {
      console.error('Error removing team member:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect calendar
  const disconnectCalendar = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/disconnect/${userId}`), {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear all team data
        setTeamMembers([]);
        setPendingInvitations([]);
        setTeamInfo(null);
      } else {
        throw new Error(data.error || 'Failed to disconnect calendar');
      }
    } catch (err: any) {
      console.error('Error disconnecting calendar:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is team owner
  const checkIsTeamOwner = async () => {
    if (!userId) return false;
    
    try {
      const response = await fetch(buildApiUrl(`calendar/status/${userId}`));
      const data = await response.json();
      
      if (data.success && data.connected) {
        // User has calendar access, check if they're the owner
        const teamResponse = await fetch(buildApiUrl(`calendar/team/members/${userId}`));
        const teamData = await teamResponse.json();
        
        if (teamData.success) {
          const isOwner = teamData.members.some((member: TeamMember) => member.role === 'owner');
          return isOwner;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking team owner status:', error);
      return false;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (userId) {
      getTeamMembers();
      getPendingInvitations();
      getTeamInfo();
    }
  }, [userId]);

  return {
    teamMembers,
    pendingInvitations,
    teamInfo,
    loading,
    error,
    getTeamMembers,
    getPendingInvitations,
    getTeamInfo,
    inviteTeamMember,
    acceptInvitation,
    rejectInvitation,
    removeTeamMember,
    disconnectCalendar,
    checkIsTeamOwner,
  };
};
