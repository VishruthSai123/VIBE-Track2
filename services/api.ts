import { Space, SpacePermission, SpaceMember, User, Workspace, Project, Issue, Sprint, Epic, Team, Notification, Activity, ActivityAction, SpaceType } from '../types';
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

  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('workspaces').select('*');
      if(error) console.error(error);
      return data as Workspace[];
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
  }
};