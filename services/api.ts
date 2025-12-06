import { 
  Space, SpacePermission, SpaceMember, User, Workspace, Project, Issue, Sprint, Epic, Team, 
  Notification, Activity, ActivityAction, SpaceType,
  Organization, OrgMember, WorkspaceMember, Invite, OrgRole, WorkspaceRole, InviteStatus,
  TeamMember, EntityType
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const handleSupabaseError = (error: any) => {
  if (error) {
    console.error("Supabase API Error:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Database error");
  }
};

export const api = {
  // ... (All previous methods remain unchanged - getUsers, getWorkspaces, etc.)
  // I will re-list the critical ones and add the new Activity ones.

  // --- USERS & WORKSPACES ---
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if(error) console.error(error);
      return data as User[];
    }
    return [];
  },

  getWorkspaces: async (orgId?: string): Promise<Workspace[]> => {
    if (isSupabaseConfigured) {
      let query = supabase.from('workspaces').select('*');
      if (orgId) {
        query = query.eq('orgId', orgId);
      }
      const { data, error } = await query;
      if(error) {
        console.error('getWorkspaces error:', error);
        return [];
      }
      return (data as Workspace[]) || [];
    }
    return [];
  },
  
  createWorkspace: async (workspace: Workspace): Promise<Workspace> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').insert(workspace).select().single();
      if(error) throw error;
      return data as Workspace;
    }
    throw new Error("Supabase not configured");
  },

  updateWorkspace: async (workspace: Workspace): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('workspaces').update({ 
            name: workspace.name,
            members: workspace.members,
            description: workspace.description,
            logo: workspace.logo,
            colorTheme: workspace.colorTheme,
            visibility: workspace.visibility
        }).eq('id', workspace.id);
        if(error) throw error;
    }
  },

  deleteWorkspace: async (workspaceId: string): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
        if(error) throw error;
    }
  },

  // --- PROJECTS ---
  getProjects: async (workspaceId: string): Promise<Project[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').select('*').eq('workspaceId', workspaceId);
      if(error) console.error(error);
      return data as Project[];
    }
    return [];
  },

  createProject: async (project: Project): Promise<Project> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      if(error) throw error;
      return data as Project;
    }
    throw new Error("Supabase not configured");
  },

  updateProject: async (project: Project): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').update(project).eq('id', project.id);
      if(error) throw error;
    }
  },

  // --- SPACES (Enhanced) ---
  getSpaces: async (projectId: string, includeDeleted = false): Promise<Space[]> => {
    if (isSupabaseConfigured) {
        try {
            let query = supabase.from('spaces').select('*').eq('projectId', projectId);
            if (!includeDeleted) {
                query = query.is('deletedAt', null);
            }
            const { data, error } = await query.order('createdAt', { ascending: true });
            if (error && error.code !== '42P01') console.error(error); 
            return (data as Space[]) || [];
        } catch (e) {
            return [];
        }
    }
    return [];
  },

  getSpaceById: async (spaceId: string): Promise<Space | null> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('spaces').select('*').eq('id', spaceId).single();
        if (error) return null;
        return data as Space;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  createSpace: async (space: Space): Promise<Space> => {
      if (isSupabaseConfigured) {
          const { data, error } = await supabase.from('spaces').insert(space).select().single();
          if (error) throw new Error(error.message);
          return data as Space;
      }
      throw new Error("Supabase not configured");
  },

  updateSpace: async (space: Partial<Space> & { id: string }): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase.from('spaces').update({
              ...space,
              updatedAt: new Date().toISOString()
          }).eq('id', space.id);
          if (error) throw new Error(error.message);
      }
  },

  softDeleteSpace: async (spaceId: string): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase.from('spaces').update({
              deletedAt: new Date().toISOString()
          }).eq('id', spaceId);
          if (error) throw new Error(error.message);
      }
  },

  restoreSpace: async (spaceId: string): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase.from('spaces').update({
              deletedAt: null
          }).eq('id', spaceId);
          if (error) throw new Error(error.message);
      }
  },

  deleteSpace: async (spaceId: string): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase.from('spaces').delete().eq('id', spaceId);
          if (error) throw new Error(error.message);
      }
  },

  // --- SPACE MEMBERS ---
  getSpaceMembers: async (spaceId: string): Promise<SpaceMember[]> => {
      if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase
                .from('space_members')
                .select('*')
                .eq('spaceId', spaceId);
            if (error && error.code !== '42P01') console.error(error);
            return (data as SpaceMember[]) || [];
          } catch (e) { return []; }
      }
      return [];
  },

  addSpaceMember: async (member: SpaceMember): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase.from('space_members').insert(member);
          if (error) throw new Error(error.message);
      }
  },

  removeSpaceMember: async (spaceId: string, userId: string): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase
              .from('space_members')
              .delete()
              .eq('spaceId', spaceId)
              .eq('userId', userId);
          if (error) throw new Error(error.message);
      }
  },

  // --- SPACE PERMISSIONS ---
  getSpacePermissions: async (spaceId: string): Promise<SpacePermission[]> => {
      if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase
                .from('space_permissions')
                .select('*')
                .eq('spaceId', spaceId);
            
            if (error && error.code !== '42P01') console.error(error);
            return (data as SpacePermission[]) || [];
          } catch (e) { return []; }
      }
      return [];
  },

  getSpacePermissionForUser: async (spaceId: string, userId: string): Promise<SpacePermission | null> => {
      if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase
                .from('space_permissions')
                .select('*')
                .eq('spaceId', spaceId)
                .eq('userId', userId)
                .single();
            if (error) return null;
            return data as SpacePermission;
          } catch (e) { return null; }
      }
      return null;
  },

  updateSpacePermissions: async (permissions: SpacePermission): Promise<void> => {
      if (isSupabaseConfigured) {
          const payload = {
              ...permissions,
              updatedAt: new Date().toISOString()
          };
          const { error } = await supabase
              .from('space_permissions')
              .upsert(payload, { onConflict: 'spaceId,userId' });
          
          if (error) throw new Error(error.message);
      }
  },

  deleteSpacePermission: async (spaceId: string, userId: string): Promise<void> => {
      if (isSupabaseConfigured) {
          const { error } = await supabase
              .from('space_permissions')
              .delete()
              .eq('spaceId', spaceId)
              .eq('userId', userId);
          if (error) throw new Error(error.message);
      }
  },
  
  // --- ACTIVITIES (Enhanced) ---
  getActivities: async (spaceId: string, limit = 50): Promise<Activity[]> => {
      if (isSupabaseConfigured) {
          try {
              const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('spaceId', spaceId)
                .order('createdAt', { ascending: false })
                .limit(limit);
              
              if (error && error.code !== '42P01') console.error(error);
              return (data as Activity[]) || [];
          } catch (e) { return []; }
      }
      return [];
  },

  getProjectActivities: async (projectId: string, limit = 100): Promise<Activity[]> => {
      if (isSupabaseConfigured) {
          try {
              const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('projectId', projectId)
                .order('createdAt', { ascending: false })
                .limit(limit);
              
              if (error && error.code !== '42P01') console.error(error);
              return (data as Activity[]) || [];
          } catch (e) { return []; }
      }
      return [];
  },

  createActivity: async (activity: Activity): Promise<void> => {
      if (isSupabaseConfigured) {
          // Fire and forget, don't block UI
          supabase.from('activities').insert(activity).then(({ error }) => {
              if(error && error.code !== '42P01') console.error("Failed to log activity", error);
          });
      }
  },

  // --- SPACE BOARD (Get issues for space) ---
  getSpaceBoard: async (spaceId: string): Promise<Issue[]> => {
      if (isSupabaseConfigured) {
          const { data, error } = await supabase
              .from('issues')
              .select('*')
              .eq('spaceId', spaceId)
              .order('updatedAt', { ascending: false });
          if (error) console.error(error);
          return (data as Issue[]) || [];
      }
      return [];
  },

  // Create default spaces for a project
  createDefaultSpaces: async (projectId: string, createdBy: string): Promise<Space[]> => {
      const defaultSpaces: Partial<Space>[] = [
          { name: 'Development', type: 'development' as SpaceType, description: 'Core development tasks and features' },
          { name: 'Design', type: 'design' as SpaceType, description: 'UI/UX design tasks' },
          { name: 'QA', type: 'qa' as SpaceType, description: 'Quality assurance and testing' }
      ];

      const spaces: Space[] = [];
      for (const sp of defaultSpaces) {
          const space: Space = {
              id: `spc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              projectId,
              name: sp.name!,
              type: sp.type!,
              description: sp.description,
              createdBy,
              createdAt: new Date().toISOString()
          };
          try {
              const created = await api.createSpace(space);
              spaces.push(created);
          } catch (e) {
              console.error(`Failed to create default space ${sp.name}`, e);
          }
      }
      return spaces;
  },

  // --- ISSUES ---
  getIssues: async (projectId: string): Promise<Issue[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('issues').select('*').eq('projectId', projectId);
      if(error) console.error(error);
      return data as Issue[];
    }
    return [];
  },

  createIssue: async (issue: Issue): Promise<Issue> => {
    if (isSupabaseConfigured) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = issue; 
      const payload = {
        ...issue,
        sprintId: issue.sprintId || null,
        epicId: issue.epicId || null,
        assigneeId: issue.assigneeId || null,
        spaceId: issue.spaceId || null,
      };
      const { data, error } = await supabase.from('issues').insert(payload).select().single();
      if(error) throw error;
      return data as Issue;
    }
    throw new Error("Supabase not configured");
  },

  updateIssue: async (issue: Issue): Promise<void> => {
    if (isSupabaseConfigured) {
      const payload = {
        ...issue,
        sprintId: issue.sprintId || null,
        epicId: issue.epicId || null,
        assigneeId: issue.assigneeId || null,
        spaceId: issue.spaceId || null,
      };
      const { error } = await supabase.from('issues').update(payload).eq('id', issue.id);
      if(error) throw error;
    }
  },

  deleteIssue: async (issueId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('issues').delete().eq('id', issueId);
      if(error) throw error;
    }
  },

  // --- SPRINTS ---
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sprints').select('*').eq('projectId', projectId);
      if(error) console.error(error);
      return data as Sprint[];
    }
    return [];
  },

  createSprint: async (sprint: Sprint): Promise<Sprint> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sprints').insert(sprint).select().single();
      if(error) throw error;
      return data as Sprint;
    }
    return sprint;
  },

  updateSprint: async (sprint: Sprint): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('sprints').update(sprint).eq('id', sprint.id);
      if(error) throw error;
    }
  },

  // --- EPICS ---
  getEpics: async (projectId: string): Promise<Epic[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('epics').select('*').eq('projectId', projectId);
      if(error) console.error(error);
      return data as Epic[];
    }
    return [];
  },

  // --- TEAMS ---
  getTeams: async (workspaceId: string): Promise<Team[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').select('*').eq('workspaceId', workspaceId);
      if(error) console.error(error);
      return data as Team[];
    }
    return [];
  },

  createTeam: async (team: Team): Promise<Team> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').insert(team).select().single();
      if(error) throw error;
      return data as Team;
    }
    return team;
  },

  updateTeam: async (team: Team): Promise<void> => {
    if (isSupabaseConfigured) {
        const { error } = await supabase.from('teams').update({ members: team.members }).eq('id', team.id);
        if(error) throw error;
    }
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId);
      if(error) console.error(error);
      return data as Notification[];
    }
    return [];
  },

  createNotification: async (notif: Notification): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications').insert(notif);
      if (error) console.error("Failed to send notification", error);
    }
  },

  uploadFile: async (file: File): Promise<string> => {
    if (isSupabaseConfigured) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (uploadError) {
             throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
    throw new Error("Supabase not configured");
  },

  // ============================================================
  // ORGANIZATIONS
  // ============================================================
  getOrganizations: async (userId: string): Promise<Organization[]> => {
    if (isSupabaseConfigured) {
      try {
        // First, get organizations where this user is the OWNER
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from('organizations')
          .select('*')
          .eq('ownerId', userId);
        
        if (ownedError) {
          console.error('getOrganizations ownedError:', ownedError);
        }
        
        const owned = (ownedOrgs as Organization[]) || [];
        const ownedIds = new Set(owned.map(o => o.id));
        
        // Then try to get orgs where user is a member (not owner)
        try {
          const { data: memberData, error: memberError } = await supabase
            .from('org_members')
            .select('orgId')
            .eq('userId', userId);
          
          if (!memberError && memberData && memberData.length > 0) {
            // Filter out orgs we already own
            const memberOrgIds = memberData.map(m => m.orgId).filter(id => !ownedIds.has(id));
            
            if (memberOrgIds.length > 0) {
              const { data: memberOrgs } = await supabase
                .from('organizations')
                .select('*')
                .in('id', memberOrgIds);
              
              if (memberOrgs) {
                return [...owned, ...(memberOrgs as Organization[])];
              }
            }
          }
        } catch (e) {
          console.warn('org_members query failed, returning owned orgs only:', e);
        }
        
        // Return only owned organizations
        return owned;
      } catch (e) {
        console.error('getOrganizations exception:', e);
        return [];
      }
    }
    return [];
  },

  getOrganizationById: async (orgId: string): Promise<Organization | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error) return null;
      return data as Organization;
    }
    return null;
  },

  getOrganizationBySlug: async (slug: string): Promise<Organization | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) return null;
      return data as Organization;
    }
    return null;
  },

  createOrganization: async (org: Organization): Promise<Organization> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('organizations')
        .insert(org)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as Organization;
    }
    throw new Error("Supabase not configured");
  },

  updateOrganization: async (org: Partial<Organization> & { id: string }): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...org,
          updatedAt: new Date().toISOString()
        })
        .eq('id', org.id);
      
      if (error) throw new Error(error.message);
    }
  },

  deleteOrganization: async (orgId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);
      
      if (error) throw new Error(error.message);
    }
  },

  // ============================================================
  // ORGANIZATION MEMBERS
  // ============================================================
  getOrgMembers: async (orgId: string): Promise<OrgMember[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('org_members')
        .select('*')
        .eq('orgId', orgId);
      
      if (error) console.error(error);
      return (data as OrgMember[]) || [];
    }
    return [];
  },

  getOrgMemberRole: async (orgId: string, userId: string): Promise<OrgRole | null> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('role')
          .eq('orgId', orgId)
          .eq('userId', userId)
          .single();
        
        if (error) return null;
        return data?.role as OrgRole;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  addOrgMember: async (member: OrgMember): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('org_members')
        .insert(member);
      
      if (error) throw new Error(error.message);
    }
  },

  updateOrgMemberRole: async (orgId: string, userId: string, role: OrgRole): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('org_members')
        .update({ role })
        .eq('orgId', orgId)
        .eq('userId', userId);
      
      if (error) throw new Error(error.message);
    }
  },

  removeOrgMember: async (orgId: string, userId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('orgId', orgId)
        .eq('userId', userId);
      
      if (error) throw new Error(error.message);
    }
  },

  // ============================================================
  // WORKSPACE MEMBERS (Enhanced)
  // ============================================================
  getWorkspaceMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspaceId', workspaceId);
      
      if (error && error.code !== '42P01') console.error(error);
      return (data as WorkspaceMember[]) || [];
    }
    return [];
  },

  getWorkspaceMemberRole: async (workspaceId: string, userId: string): Promise<WorkspaceRole | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspaceId', workspaceId)
        .eq('userId', userId)
        .single();
      
      if (error) return null;
      return data?.role as WorkspaceRole;
    }
    return null;
  },

  addWorkspaceMember: async (member: WorkspaceMember): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('workspace_members')
        .insert(member);
      
      if (error) throw new Error(error.message);
    }
  },

  updateWorkspaceMemberRole: async (workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspaceId', workspaceId)
        .eq('userId', userId);
      
      if (error) throw new Error(error.message);
    }
  },

  removeWorkspaceMember: async (workspaceId: string, userId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspaceId', workspaceId)
        .eq('userId', userId);
      
      if (error) throw new Error(error.message);
    }
  },

  // ============================================================
  // INVITES SYSTEM (DEPRECATED - kept for backward compatibility)
  // ============================================================
  getInvitesByEmail: async (email: string): Promise<Invite[]> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .eq('email', email)
          .eq('status', 'pending')
          .gt('expiresAt', new Date().toISOString());
        
        // Handle table not existing gracefully
        if (error) {
          // 42P01 = PostgreSQL table not exist, PGRST205 = PostgREST table not in cache
          if (error.code === '42P01' || error.code === 'PGRST205') return [];
          console.error('getInvitesByEmail error:', error);
          return [];
        }
        return (data as Invite[]) || [];
      } catch (e) {
        console.error('getInvitesByEmail exception:', e);
        return [];
      }
    }
    return [];
  },

  getInviteByToken: async (token: string): Promise<Invite | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error) return null;
      return data as Invite;
    }
    return null;
  },

  getInvitesForOrg: async (orgId: string): Promise<Invite[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('targetId', orgId)
        .eq('type', 'organization')
        .order('createdAt', { ascending: false });
      
      if (error) console.error(error);
      return (data as Invite[]) || [];
    }
    return [];
  },

  getInvitesForWorkspace: async (workspaceId: string): Promise<Invite[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('targetId', workspaceId)
        .eq('type', 'workspace')
        .order('createdAt', { ascending: false });
      
      if (error) console.error(error);
      return (data as Invite[]) || [];
    }
    return [];
  },

  createInvite: async (invite: Invite): Promise<Invite> => {
    if (isSupabaseConfigured) {
      // Check if invite already exists
      const { data: existing } = await supabase
        .from('invites')
        .select('*')
        .eq('email', invite.email)
        .eq('targetId', invite.targetId)
        .eq('type', invite.type)
        .eq('status', 'pending')
        .single();
      
      if (existing) {
        throw new Error('An invite already exists for this email');
      }

      const { data, error } = await supabase
        .from('invites')
        .insert(invite)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data as Invite;
    }
    throw new Error("Supabase not configured");
  },

  acceptInvite: async (token: string, userId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      // Get the invite
      const invite = await api.getInviteByToken(token);
      
      if (!invite) throw new Error('Invite not found');
      if (invite.status !== 'pending') throw new Error('Invite is no longer valid');
      if (new Date(invite.expiresAt) < new Date()) throw new Error('Invite has expired');

      // Add member based on invite type
      if (invite.type === 'organization') {
        await api.addOrgMember({
          orgId: invite.targetId,
          userId,
          role: invite.role as OrgRole,
          joinedAt: new Date().toISOString(),
          invitedBy: invite.invitedBy
        });
      } else if (invite.type === 'workspace') {
        // First, get the workspace to find its org
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', invite.targetId)
          .single();
        
        // If workspace belongs to an org, also add user to org as Member
        if (workspace?.orgId) {
          // Check if already an org member
          const existingOrgMember = await api.getOrgMemberRole(workspace.orgId, userId);
          if (!existingOrgMember) {
            await api.addOrgMember({
              orgId: workspace.orgId,
              userId,
              role: OrgRole.MEMBER, // Workspace invites give basic org membership
              joinedAt: new Date().toISOString(),
              invitedBy: invite.invitedBy
            });
          }
        }
        
        await api.addWorkspaceMember({
          workspaceId: invite.targetId,
          userId,
          role: invite.role as WorkspaceRole,
          joinedAt: new Date().toISOString(),
          invitedBy: invite.invitedBy
        });
      } else if (invite.type === 'space') {
        // Get space -> project -> workspace -> org chain
        const { data: space } = await supabase
          .from('spaces')
          .select('*, projects!inner(*, workspaces!inner(*))')
          .eq('id', invite.targetId)
          .single();
        
        if (space?.projects?.workspaces?.orgId) {
          const orgId = space.projects.workspaces.orgId;
          // Add to org if not already member
          const existingOrgMember = await api.getOrgMemberRole(orgId, userId);
          if (!existingOrgMember) {
            await api.addOrgMember({
              orgId,
              userId,
              role: OrgRole.MEMBER,
              joinedAt: new Date().toISOString(),
              invitedBy: invite.invitedBy
            });
          }
        }
        
        await api.addSpaceMember({
          spaceId: invite.targetId,
          userId,
          role: invite.role,
          canEdit: invite.role !== 'Viewer',
          canManage: invite.role === 'Space Owner'
        });
      }

      // Update invite status
      const { error } = await supabase
        .from('invites')
        .update({
          status: 'accepted' as InviteStatus,
          acceptedAt: new Date().toISOString()
        })
        .eq('id', invite.id);
      
      if (error) throw new Error(error.message);
    }
  },

  rejectInvite: async (inviteId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'rejected' as InviteStatus })
        .eq('id', inviteId);
      
      if (error) throw new Error(error.message);
    }
  },

  revokeInvite: async (inviteId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw new Error(error.message);
    }
  },

  resendInvite: async (inviteId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      // Generate new token and extend expiry
      const newToken = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      
      const { error } = await supabase
        .from('invites')
        .update({
          token: newToken,
          expiresAt: newExpiry,
          status: 'pending' as InviteStatus
        })
        .eq('id', inviteId);
      
      if (error) throw new Error(error.message);
    }
  },

  // ============================================================
  // UTILITY: Generate Invite Token
  // ============================================================
  generateInviteToken: (): string => {
    return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  },

  // ============================================================
  // TEAM MEMBERS (Admin-Created Accounts)
  // ============================================================
  getTeamMembers: async (scopeType: string, scopeId: string): Promise<any[]> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('scopeType', scopeType)
          .eq('scopeId', scopeId)
          .order('createdAt', { ascending: false });
        
        if (error) {
          if (error.code === '42P01') return [];
          console.error('getTeamMembers error:', error);
          return [];
        }
        return data || [];
      } catch (e) {
        console.error('getTeamMembers exception:', e);
        return [];
      }
    }
    return [];
  },

  getTeamMemberByEmail: async (email: string, scopeId: string): Promise<any | null> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('email', email.toLowerCase())
          .eq('scopeId', scopeId)
          .eq('isActive', true)
          .single();
        
        if (error) return null;
        return data;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  createTeamMember: async (member: {
    email: string;
    name: string;
    password: string;
    role: string;
    scopeType: string;
    scopeId: string;
    scopeCode: string;
    createdBy: string;
  }): Promise<any> => {
    if (isSupabaseConfigured) {
      // Check if member already exists
      const existing = await api.getTeamMemberByEmail(member.email, member.scopeId);
      if (existing) {
        throw new Error('A member with this email already exists');
      }

      const teamMember = {
        id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: member.email.toLowerCase(),
        name: member.name,
        passwordHash: member.password, // Will be hashed by DB trigger or we handle client-side
        role: member.role,
        scopeType: member.scopeType,
        scopeId: member.scopeId,
        scopeCode: member.scopeCode,
        isActive: true,
        createdBy: member.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('team_members')
        .insert(teamMember)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }
    throw new Error("Supabase not configured");
  },

  updateTeamMember: async (memberId: string, updates: {
    name?: string;
    role?: string;
    password?: string;
    isActive?: boolean;
  }): Promise<void> => {
    if (isSupabaseConfigured) {
      const payload: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If password is being updated, store it (will be hashed by trigger)
      if (updates.password) {
        payload.passwordHash = updates.password;
        delete payload.password;
      }
      
      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', memberId);
      
      if (error) throw new Error(error.message);
    }
  },

  deleteTeamMember: async (memberId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw new Error(error.message);
    }
  },

  // Verify team member credentials for login
  verifyTeamMemberCredentials: async (
    email: string, 
    password: string, 
    scopeCode: string
  ): Promise<{ member: any; scopeType: string; scopeName: string } | null> => {
    if (isSupabaseConfigured) {
      try {
        // Get member by email and scope code (6-digit numeric)
        const { data: member, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('email', email.toLowerCase())
          .eq('scopeCode', scopeCode.trim())
          .eq('isActive', true)
          .single();
        
        if (error || !member) return null;

        // Verify password using database function
        const { data: verified, error: verifyError } = await supabase
          .rpc('verify_team_member_password', {
            member_id: member.id,
            password_attempt: password
          });
        
        if (verifyError || !verified) {
          // Fallback: direct comparison for testing (remove in production)
          if (member.passwordHash !== password) {
            return null;
          }
        }

        // Get scope name based on type
        let scopeName = '';
        if (member.scopeType === 'organization') {
          const org = await api.getOrganizationById(member.scopeId);
          scopeName = org?.name || '';
        } else if (member.scopeType === 'workspace') {
          const { data: ws } = await supabase.from('workspaces').select('name').eq('id', member.scopeId).single();
          scopeName = ws?.name || '';
        } else if (member.scopeType === 'project') {
          const { data: proj } = await supabase.from('projects').select('name').eq('id', member.scopeId).single();
          scopeName = proj?.name || '';
        }

        return { member, scopeType: member.scopeType, scopeName };
      } catch (e) {
        console.error('verifyTeamMemberCredentials exception:', e);
        return null;
      }
    }
    return null;
  },

  // Get entity info by code (6-digit numeric code)
  getEntityByCode: async (code: string): Promise<{
    type: 'organization' | 'workspace' | 'project';
    id: string;
    name: string;
    code: string;
  } | null> => {
    if (isSupabaseConfigured) {
      try {
        const trimmedCode = code.trim();
        
        // Check organizations
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, code')
          .eq('code', trimmedCode)
          .single();
        if (org) return { type: 'organization', id: org.id, name: org.name, code: org.code };

        // Check workspaces
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id, name, code')
          .eq('code', trimmedCode)
          .single();
        if (ws) return { type: 'workspace', id: ws.id, name: ws.name, code: ws.code };

        // Check projects
        const { data: proj } = await supabase
          .from('projects')
          .select('id, name, code')
          .eq('code', trimmedCode)
          .single();
        if (proj) return { type: 'project', id: proj.id, name: proj.name, code: proj.code };

        return null;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // ============================================================
  // UTILITY: Create org with founder
  // ============================================================
  createOrganizationWithFounder: async (
    orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
    founderId: string
  ): Promise<Organization> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    const org: Organization = {
      id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...orgData,
      ownerId: founderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create organization
    const createdOrg = await api.createOrganization(org);

    // Add founder as org member with Founder role
    await api.addOrgMember({
      orgId: createdOrg.id,
      userId: founderId,
      role: OrgRole.FOUNDER,
      joinedAt: new Date().toISOString()
    });

    // AUTO-CREATE a default workspace for this organization
    const defaultWorkspace: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orgId: createdOrg.id,
      name: `${orgData.name} Workspace`,
      ownerId: founderId,
      members: [founderId],
      description: `Default workspace for ${orgData.name}`,
      visibility: 'private'
    };
    
    try {
      await api.createWorkspace(defaultWorkspace);
    } catch (e) {
      console.error('Failed to create default workspace:', e);
    }

    return createdOrg;
  },

  // ============================================================
  // OWNERSHIP TRANSFER
  // ============================================================
  transferOrgOwnership: async (orgId: string, currentOwnerId: string, newOwnerId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      // Verify current owner
      const org = await api.getOrganizationById(orgId);
      if (!org || org.ownerId !== currentOwnerId) {
        throw new Error('Only the current owner can transfer ownership');
      }

      // Update org owner
      await api.updateOrganization({ id: orgId, ownerId: newOwnerId });

      // Update member roles
      await api.updateOrgMemberRole(orgId, newOwnerId, OrgRole.FOUNDER);
      await api.updateOrgMemberRole(orgId, currentOwnerId, OrgRole.ADMIN);
    }
  }
};