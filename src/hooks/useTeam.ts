import { useState, useEffect } from 'react';
import { buildApiUrl } from '../lib/api';
import { supabase } from '../lib/supabase';

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
  users?: {
    id: string;
    name: string;
    email: string;
  };
  invited_user?: {
    id?: string;
    name: string | null;
    email: string;
  };
}

export interface TeamInfo {
  team_owner_id?: string;
  ownedTeams?: Array<{
    id: string;
    owner_id: string;
    name: string | null;
    created_at: string;
  }>;
  memberTeams?: Array<{
    id: string;
    owner_id: string;
    name: string | null;
    created_at: string;
  }>;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

export const useTeam = (userId: string | null) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);
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

  // Get pending invitations for user (received)
  const getPendingInvitations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email;
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const response = await fetch(buildApiUrl(`calendar/team/invitations/${userId}${query}`));
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

  // Get sent invitations by team owner (only pending)
  const getSentInvitations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl(`calendar/team/invitations/sent/${userId}?status=pending`));
      const data = await response.json();
      
      if (data.success) {
        setSentInvitations(data.invitations);
      } else {
        throw new Error(data.error || 'Failed to get sent invitations');
      }
    } catch (err: any) {
      console.error('Error getting sent invitations:', err);
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
        // Refresh team members and sent invitations
        await getTeamMembers();
        await getSentInvitations();
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
        // Refresh all team-related data in parallel for better performance
        // Backend has already processed the invitation, so no delay needed
        await Promise.all([
          getPendingInvitations(),
          getTeamInfo(),
          getTeamMembers()
        ]);
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
    // No-op: external calendar disconnected; keeping for API compatibility
    setTeamMembers([]);
    setPendingInvitations([]);
    setTeamInfo(null);
  };

  // Check if user is team owner
  const checkIsTeamOwner = async () => {
    if (!userId) return false;
    try {
      const response = await fetch(buildApiUrl(`calendar/team/info/${userId}`));
      const data = await response.json();
      if (data.success) {
        return Array.isArray(data.teamInfo?.ownedTeams) && data.teamInfo.ownedTeams.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking team owner status:', error);
      return false;
    }
  };

  // Create a new team
  const createTeam = async (teamName: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl('calendar/team/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          teamName: teamName.trim() || null,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh team data
        await getTeamMembers();
        await getTeamInfo();
        return data.team;
      } else {
        throw new Error(data.error || 'Failed to create team');
      }
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update team name
  const updateTeamName = async (teamName: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(buildApiUrl('calendar/team/update-name'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          teamName: teamName.trim() || null,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh team data
        await getTeamMembers();
        await getTeamInfo();
        return data.team;
      } else {
        throw new Error(data.error || 'Failed to update team name');
      }
    } catch (err: any) {
      console.error('Error updating team name:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (userId) {
      getTeamMembers();
      getPendingInvitations();
      getTeamInfo();
      getSentInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    teamMembers,
    pendingInvitations,
    sentInvitations,
    teamInfo,
    loading,
    error,
    getTeamMembers,
    getPendingInvitations,
    getSentInvitations,
    getTeamInfo,
    inviteTeamMember,
    acceptInvitation,
    rejectInvitation,
    removeTeamMember,
    disconnectCalendar,
    checkIsTeamOwner,
    createTeam,
    updateTeamName,
  };
};
