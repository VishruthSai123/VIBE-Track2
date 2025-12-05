import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Issue, User, Status, Priority, IssueType, Sprint, Epic, Project, Notification, Workspace, Team, Permission, UserRole, Space, SpacePermission, Activity, ActivityAction, SpaceMember, SpaceType, DEFAULT_SPACE_PERMISSIONS, Organization, OrgMember, OrgRole, WorkspaceMember, WorkspaceRole, Invite, InviteType, InviteStatus } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { hasPermission, setPermissionOverrides, hasOrgPermission, hasWorkspacePermission, checkPermissionWithContext, PermissionContext } from '../utils/rbac';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ProjectContextType {
  // Organizations
  organizations: Organization[];
  activeOrganization: Organization | null;
  currentOrgRole: OrgRole | null;
  
  workspaces: Workspace[];
  projects: Project[];
  spaces: Space[];
  teams: Team[];
  issues: Issue[];
  allIssues: Issue[];
  users: User[];
  sprints: Sprint[];
  epics: Epic[];
  notifications: Notification[];
  activities: Activity[];
  pendingInvites: Invite[];
  
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  activeSpace: Space | null;
  activeSprint: Sprint | undefined;
  currentUser: User | null;
  searchQuery: string;
  isAuthenticated: boolean;
  toasts: Toast[];
  isLoading: boolean;

  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, workspaceName: string, role: string, password?: string, orgName?: string) => Promise<void>;
  signupWithInvite: (name: string, email: string, password: string, inviteToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  
  // Organization actions
  setActiveOrganization: (id: string) => void;
  createOrganization: (name: string) => Promise<Organization | null>;
  updateOrganization: (org: Partial<Organization> & { id: string }) => Promise<void>;
  
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  setActiveSpace: (id: string | null) => void;
  
  createWorkspace: (name: string) => Promise<boolean>;
  updateWorkspaceDetails: (workspace: Workspace) => Promise<void>;
  deleteCurrentWorkspace: () => Promise<void>;
  createProject: (name: string, key: string, description: string, type: Project['type']) => Promise<void>;
  
  createSpace: (name: string, type: SpaceType, description: string) => Promise<boolean>;
  updateSpace: (space: Partial<Space> & { id: string }) => Promise<void>;
  softDeleteSpace: (id: string) => Promise<void>;
  restoreSpace: (id: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  
  // Space Members
  getSpaceMembers: (spaceId: string) => Promise<SpaceMember[]>;
  addSpaceMember: (spaceId: string, userId: string) => Promise<void>;
  removeSpaceMember: (spaceId: string, userId: string) => Promise<void>;
  
  // Space Permissions
  saveSpacePermissions: (permissions: SpacePermission) => Promise<void>;
  getSpacePermissions: (spaceId: string) => Promise<SpacePermission[]>;
  deleteSpacePermission: (spaceId: string, userId: string) => Promise<void>;
  checkSpacePermission: (permission: keyof SpacePermission) => boolean;
  
  // Activity Logging
  logSpaceActivity: (action: ActivityAction, details: string, entityId?: string) => Promise<void>;

  // Invite actions
  createInvite: (email: string, type: InviteType, targetId: string, role: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
  loadPendingInvites: () => Promise<void>;

  setSearchQuery: (query: string) => void;
  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'subtasks' | 'attachments' | 'projectId'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  addComment: (issueId: string, text: string, userId: string) => void;
  
  createSprint: (name: string, goal: string, startDate: string, endDate: string, capacity?: number) => Promise<boolean>;
  startSprint: (sprintId: string, startDate: string, endDate: string, goal?: string) => void;
  completeSprint: (sprintId: string, spilloverAction: 'BACKLOG' | 'NEXT_SPRINT') => void;
  
  createTeam: (name: string, memberIds: string[]) => Promise<boolean>;
  addMemberToTeam: (teamId: string, userId: string) => void;
  removeMemberFromTeam: (teamId: string, userId: string) => void;
  inviteUser: (email: string) => Promise<void>;
  
  updateProjectInfo: (info: Project) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateUserPermissions: (userId: string, permissions: Partial<Record<Permission, boolean>>) => void;
  
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  uploadAttachment: (file: File) => Promise<string>;
  
  checkPermission: (permission: Permission) => boolean;
  checkOrgPermission: (permission: Permission) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Organizations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>('');
  const [currentOrgRole, setCurrentOrgRole] = useState<OrgRole | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [rawIssues, setRawIssues] = useState<Issue[]>([]); 
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [allEpics, setAllEpics] = useState<Epic[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [currentSpacePermission, setCurrentSpacePermission] = useState<SpacePermission | null>(null);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = !!currentUser;
  const activeOrganization = organizations.find(o => o.id === activeOrgId) || null;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
  }, []);

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    let mounted = true;
    const handleSession = async (session: any) => {
        if (!session?.user) {
            if (mounted) {
                setCurrentUser(null); setWorkspaces([]); setAllProjects([]); setActiveWorkspaceId(''); setActiveProjectId(''); setIsLoading(false);
            }
            return;
        }
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
            let userObj: User;
            if (profile) {
                userObj = profile as User;
            } else {
                const newProfile = { id: session.user.id, email: session.user.email || '', name: session.user.user_metadata.full_name || 'User', role: 'Developer', avatar: `https://ui-avatars.com/api/?name=${session.user.user_metadata.full_name || 'U'}&background=random`, workspaceIds: [] };
                await supabase.from('profiles').insert(newProfile);
                userObj = newProfile;
            }
            // Load organizations for this user first
            const userOrgs = await api.getOrganizations(userObj.id);
            const allUsers = await api.getUsers();
            
            if (mounted) {
                setCurrentUser(userObj); 
                setUsers(allUsers);
                setOrganizations(userOrgs);
                
                if (userOrgs.length > 0) {
                    // Set first org as active
                    const firstOrg = userOrgs[0];
                    setActiveOrgId(firstOrg.id);
                    
                    // Get user's role in this org
                    const orgRole = await api.getOrgMemberRole(firstOrg.id, userObj.id);
                    setCurrentOrgRole(orgRole);
                    
                    // Load workspaces for this org only
                    const allWs = await api.getWorkspaces();
                    const orgWorkspaces = allWs.filter(ws => ws.orgId === firstOrg.id);
                    setWorkspaces(orgWorkspaces);
                    
                    if (orgWorkspaces.length > 0) {
                        setActiveWorkspaceId(orgWorkspaces[0].id);
                    }
                } else {
                    // Fallback: Load all workspaces (legacy mode for users without orgs)
                    const wsData = await api.getWorkspaces();
                    if (wsData.length > 0) {
                        setWorkspaces(wsData);
                        setActiveWorkspaceId(wsData[0].id);
                    }
                }
                
                // Load pending invites for this user
                const invites = await api.getInvitesByEmail(userObj.email);
                setPendingInvites(invites);
            }
        } catch (error) { console.error(error); } finally { if (mounted) setIsLoading(false); }
    };
    const init = async () => {
        if (!isSupabaseConfigured) { if (mounted) setIsLoading(false); return; }
        const { data: { session } } = await supabase.auth.getSession(); await handleSession(session);
        supabase.auth.onAuthStateChange(async (_, session) => await handleSession(session));
    };
    init();
    return () => { mounted = false; };
  }, []);

  // 2. Realtime
  useEffect(() => {
    if (!isAuthenticated || !activeProjectId) return;
    const channel = supabase.channel(`project-${activeProjectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `projectId=eq.${activeProjectId}` }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    setRawIssues(prev => { if (prev.some(i => i.id === payload.new.id)) return prev; return [...prev, payload.new as Issue]; });
                } else if (payload.eventType === 'UPDATE') {
                    setRawIssues(prev => prev.map(i => i.id === payload.new.id ? payload.new as Issue : i));
                } else if (payload.eventType === 'DELETE') {
                    setRawIssues(prev => prev.filter(i => i.id !== payload.old.id));
                }
            }
        )
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, activeProjectId]);


  useEffect(() => {
    if (!activeWorkspaceId) { setAllProjects([]); setAllTeams([]); setActiveProjectId(''); return; }
    const load = async () => {
       const [projs, tms] = await Promise.all([api.getProjects(activeWorkspaceId), api.getTeams(activeWorkspaceId)]);
       setAllProjects(projs); setAllTeams(tms);
       if (projs.length > 0 && (!activeProjectId || !projs.some(p => p.id === activeProjectId))) setActiveProjectId(projs[0].id);
    };
    load();
  }, [activeWorkspaceId]);

  useEffect(() => {
     if (!activeProjectId) { setRawIssues([]); setAllSprints([]); setAllEpics([]); setAllSpaces([]); setActiveSpaceId(null); return; }
     const load = async () => {
        const [iss, sps, eps, spcs] = await Promise.all([
            api.getIssues(activeProjectId), api.getSprints(activeProjectId), api.getEpics(activeProjectId), api.getSpaces(activeProjectId)
        ]);
        setRawIssues(iss); setAllSprints(sps); setAllEpics(eps); setAllSpaces(spcs);
     };
     load();
  }, [activeProjectId]);

  useEffect(() => {
      if (activeSpaceId && currentUser) {
          api.getSpacePermissions(activeSpaceId).then(perms => {
              const myPerm = perms.find(p => p.userId === currentUser.id) || null;
              setCurrentSpacePermission(myPerm);
          });
          api.getActivities(activeSpaceId).then(acts => setActivities(acts));
      } else {
          setCurrentSpacePermission(null);
          setActivities([]);
      }
  }, [activeSpaceId, currentUser]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;
  const activeProject = allProjects.find(p => p.id === activeProjectId) || null;
  const activeSpace = allSpaces.find(s => s.id === activeSpaceId) || null;
  
  const projects = allProjects; 
  const teams = allTeams;
  
  // Defined filteredIssues properly
  const filteredIssues = activeSpaceId ? rawIssues.filter(i => i.spaceId === activeSpaceId) : rawIssues;
  
  const sprints = allSprints;
  const epics = allEpics;
  const spaces = allSpaces;
  const activeSprint = sprints.find(s => s.status === 'ACTIVE');

  const checkPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.FOUNDER) return true;
    if (activeSpaceId && currentSpacePermission) {
        // Space overrides
        return hasPermission(currentUser.role, permission, currentUser.id);
    }
    return hasPermission(currentUser.role, permission, currentUser.id);
  };

  // --- Authentication Actions ---
  const login = async (email: string, password?: string) => { 
    if (isSupabaseConfigured && password) { 
      const { error } = await supabase.auth.signInWithPassword({ email, password }); 
      if (error) showToast(error.message, "error"); 
    } 
  };

  const signup = async (name: string, email: string, workspaceName: string, role: string, password?: string, orgName?: string) => { 
    if (!isSupabaseConfigured || !password) {
      showToast("Authentication not configured", "error");
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name: name, role: role }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        // Generate slug from org name
        const orgSlug = (orgName || workspaceName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Create organization first (user becomes Founder)
        const org = await api.createOrganizationWithFounder(
          {
            name: orgName || workspaceName,
            slug: orgSlug,
            ownerId: data.user.id,
            plan: 'free'
          },
          data.user.id
        );
        
        // Create initial workspace under the organization
        const ws: Workspace = { 
          id: `ws-${Date.now()}`, 
          name: workspaceName, 
          ownerId: data.user.id, 
          members: [data.user.id],
          orgId: org.id
        };
        await api.createWorkspace(ws);
        
        // Add user as workspace admin
        await api.addWorkspaceMember({
          workspaceId: ws.id,
          userId: data.user.id,
          role: WorkspaceRole.WORKSPACE_ADMIN,
          joinedAt: new Date().toISOString()
        });
        
        showToast("Account created! Please check your email to verify.", "success");
      }
    } catch (e: any) { 
      showToast(e.message || "Signup failed", "error"); 
    }
  };

  // Signup for invited users - they don't create an org, just accept the invite
  const signupWithInvite = async (name: string, email: string, password: string, inviteToken: string) => {
    if (!isSupabaseConfigured) {
      showToast("Authentication not configured", "error");
      return;
    }
    try {
      // First verify the invite is valid
      const invite = await api.getInviteByToken(inviteToken);
      if (!invite) {
        showToast("Invalid or expired invite link", "error");
        return;
      }
      if (invite.status !== 'pending') {
        showToast("This invite has already been used", "error");
        return;
      }
      if (new Date(invite.expiresAt) < new Date()) {
        showToast("This invite has expired", "error");
        return;
      }
      // Verify email matches invite (if specified)
      if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
        showToast("Email doesn't match the invite", "error");
        return;
      }

      // Create the user account
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name: name, role: 'Member' }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        // Accept the invite - this adds them to the org/workspace/space
        await api.acceptInvite(inviteToken, data.user.id);
        showToast("Account created! You've joined the team.", "success");
      }
    } catch (e: any) { 
      showToast(e.message || "Signup failed", "error"); 
    }
  };

  const resetPassword = async (email: string) => { 
    if (!isSupabaseConfigured) {
      showToast("Authentication not configured", "error");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
      showToast("Password reset email sent! Check your inbox.", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to send reset email", "error");
    }
  };

  const logout = async () => { 
    try {
      // Sign out from Supabase first
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      
      // Reset all state to initial values
      setCurrentUser(null);
      setOrganizations([]);
      setActiveOrgId('');
      setCurrentOrgRole(null);
      setWorkspaces([]);
      setAllProjects([]);
      setAllSpaces([]);
      setRawIssues([]);
      setAllSprints([]);
      setAllEpics([]);
      setAllTeams([]);
      setUsers([]);
      setNotifications([]);
      setActivities([]);
      setPendingInvites([]);
      setActiveWorkspaceId('');
      setActiveProjectId('');
      setActiveSpaceId(null);
      setSearchQuery('');
      setCurrentSpacePermission(null);
      setIsLoading(false);
      
      showToast("Signed out successfully", "success");
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force reset even if signOut fails
      setCurrentUser(null);
      setOrganizations([]);
      setActiveOrgId('');
      setWorkspaces([]);
      setAllProjects([]);
      setActiveWorkspaceId('');
      setActiveProjectId('');
    }
  };

  const createWorkspace = async (name: string): Promise<boolean> => {
      if (!currentUser) return false;
      try {
          // New workspaces go under the active organization
          const ws: Workspace = { 
            id: `ws-${Date.now()}`, 
            name, 
            ownerId: currentUser.id, 
            members: [currentUser.id],
            orgId: activeOrgId || undefined  // Link to current org
          };
          await api.createWorkspace(ws);
          
          // Also add user as workspace admin
          if (activeOrgId) {
            await api.addWorkspaceMember({
              workspaceId: ws.id,
              userId: currentUser.id,
              role: WorkspaceRole.WORKSPACE_ADMIN,
              joinedAt: new Date().toISOString()
            });
          }
          
          setWorkspaces(prev => [...prev, ws]);
          setActiveWorkspaceId(ws.id);
          return true;
      } catch(e: any) { showToast(e.message, "error"); return false; }
  };
  const updateWorkspaceDetails = async (workspace: Workspace) => { 
    try { 
      await api.updateWorkspace(workspace); 
      setWorkspaces(prev => prev.map(w => w.id === workspace.id ? workspace : w)); 
      showToast("Workspace updated successfully", "success"); 
    } catch (e: any) { 
      showToast(`Failed: ${e.message}`, "error"); 
    } 
  };

  const deleteCurrentWorkspace = async () => { 
    if (!activeWorkspaceId) return; 
    try { 
      await api.deleteWorkspace(activeWorkspaceId); 
      setWorkspaces(prev => prev.filter(w => w.id !== activeWorkspaceId)); 
      setActiveWorkspaceId(''); 
      showToast("Workspace deleted", "success"); 
    } catch (e: any) { 
      showToast(`Failed: ${e.message}`, "error"); 
    } 
  };

  const createProject = async (name: string, key: string, description: string, type: Project['type']) => { 
    if (!activeWorkspace || !currentUser) {
      showToast("No active workspace", "error");
      return;
    }
    try {
      const project: Project = {
        id: `proj-${Date.now()}`,
        workspaceId: activeWorkspaceId,
        name,
        key: key.toUpperCase(),
        description,
        type,
        leadId: currentUser.id
      };
      await api.createProject(project);
      setAllProjects(prev => [...prev, project]);
      setActiveProjectId(project.id);
      showToast("Project created successfully", "success");
    } catch (e: any) {
      showToast(`Failed to create project: ${e.message}`, "error");
    }
  };

  const createSpace = async (name: string, type: SpaceType, description: string): Promise<boolean> => {
      if (!activeProject || !currentUser) return false;
      try {
          const sp: Space = { 
              id: `spc-${Date.now()}`, 
              projectId: activeProject.id, 
              name, 
              type, 
              description, 
              createdBy: currentUser.id, 
              createdAt: new Date().toISOString() 
          };
          await api.createSpace(sp);
          setAllSpaces(prev => [...prev, sp]);
          showToast("Space created", "success");
          
          // Log activity
          await logSpaceActivityInternal(sp.id, 'space_created', `Created space "${name}"`);
          
          return true;
      } catch (e: any) { showToast(e.message, "error"); return false; }
  };

  const updateSpace = async (space: Partial<Space> & { id: string }) => {
      try {
          await api.updateSpace(space);
          setAllSpaces(prev => prev.map(s => s.id === space.id ? { ...s, ...space } : s));
          showToast("Space updated", "success");
          await logSpaceActivityInternal(space.id, 'space_updated', `Updated space settings`);
      } catch (e: any) { 
          showToast(e.message, "error"); 
      }
  };

  const softDeleteSpace = async (id: string) => { 
      try {
          await api.softDeleteSpace(id); 
          setAllSpaces(prev => prev.map(s => s.id === id ? { ...s, deletedAt: new Date().toISOString() } : s)); 
          if (activeSpaceId === id) setActiveSpaceId(null);
          showToast("Space moved to trash", "success");
          await logSpaceActivityInternal(id, 'space_deleted', `Deleted space`);
      } catch (e: any) {
          showToast(e.message, "error");
      }
  };

  const restoreSpace = async (id: string) => {
      try {
          await api.restoreSpace(id);
          setAllSpaces(prev => prev.map(s => s.id === id ? { ...s, deletedAt: null } : s));
          showToast("Space restored", "success");
          await logSpaceActivityInternal(id, 'space_restored', `Restored space`);
      } catch (e: any) {
          showToast(e.message, "error");
      }
  };

  const deleteSpace = async (id: string) => { 
      await api.deleteSpace(id); 
      setAllSpaces(prev => prev.filter(s => s.id !== id)); 
      if (activeSpaceId === id) setActiveSpaceId(null); 
  };

  // Space Members
  const getSpaceMembers = async (spaceId: string): Promise<SpaceMember[]> => {
      return await api.getSpaceMembers(spaceId);
  };

  const addSpaceMember = async (spaceId: string, userId: string) => {
      if (!currentUser) return;
      const member: SpaceMember = {
          userId,
          spaceId,
          addedAt: new Date().toISOString(),
          addedBy: currentUser.id
      };
      await api.addSpaceMember(member);
      
      // Send notification
      const user = users.find(u => u.id === userId);
      const space = allSpaces.find(s => s.id === spaceId);
      if (user && space) {
          const notif: Notification = {
              id: `notif-${Date.now()}`,
              userId,
              title: "Added to Space",
              message: `You've been added to the "${space.name}" space`,
              read: false,
              createdAt: new Date().toISOString(),
              type: 'SPACE_INVITE',
              spaceId
          };
          await api.createNotification(notif);
      }
      
      await logSpaceActivityInternal(spaceId, 'member_added', `Added ${user?.name || 'member'} to space`);
  };

  const removeSpaceMember = async (spaceId: string, userId: string) => {
      await api.removeSpaceMember(spaceId, userId);
      const user = users.find(u => u.id === userId);
      await logSpaceActivityInternal(spaceId, 'member_removed', `Removed ${user?.name || 'member'} from space`);
  };

  // Space Permissions
  const saveSpacePermissions = async (perm: SpacePermission) => { 
      await api.updateSpacePermissions(perm); 
      showToast("Permissions updated", "success"); 
      await logSpaceActivityInternal(perm.spaceId, 'permission_updated', `Updated permissions for user`);
  };

  const getSpacePermissions = async (spaceId: string) => { 
      return await api.getSpacePermissions(spaceId); 
  };

  const deleteSpacePermission = async (spaceId: string, userId: string) => {
      await api.deleteSpacePermission(spaceId, userId);
  };

  const checkSpacePermission = (permission: keyof SpacePermission): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === UserRole.FOUNDER) return true;
      
      if (currentSpacePermission) {
          return !!(currentSpacePermission as any)[permission];
      }
      
      // Fall back to default role permissions
      const defaults = DEFAULT_SPACE_PERMISSIONS[currentUser.role as UserRole];
      return defaults ? !!(defaults as any)[permission] : false;
  };

  // Activity logging (internal helper)
  const logSpaceActivityInternal = async (spaceId: string, action: ActivityAction, details: string, entityId?: string) => {
      if (!currentUser) return;
      const activity: Activity = { 
          id: `act-${Date.now()}`, 
          spaceId, 
          projectId: activeProjectId,
          userId: currentUser.id, 
          action, 
          entityType: 'space',
          entityId,
          details, 
          createdAt: new Date().toISOString() 
      };
      setActivities(prev => [activity, ...prev].slice(0, 100));
      await api.createActivity(activity);
  };

  const logSpaceActivity = async (action: ActivityAction, details: string, entityId?: string) => {
      if (!activeSpaceId) return;
      await logSpaceActivityInternal(activeSpaceId, action, details, entityId);
  };
  const updateUserPermissions = (userId: string, permissions: any) => { setPermissionOverrides(userId, permissions); showToast("Updated", "success"); };

  const addIssue = async (issue: any) => { 
      if (!activeProject) return;
      const suffix = Date.now().toString().slice(-4);
      const newIssue = { ...issue, id: `${activeProject.key}-${suffix}`, projectId: activeProject.id, spaceId: activeSpaceId || null, comments: [], subtasks: [], attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      // FIX: Use setRawIssues here
      setRawIssues(prev => [...prev, newIssue]);
      await api.createIssue(newIssue);
      if (activeSpaceId) {
          await logSpaceActivityInternal(activeSpaceId, 'task_created', `Created issue "${newIssue.title}"`, newIssue.id);
      }
  };

  const updateIssue = async (id: string, updates: any) => { 
      // FIX: Use setRawIssues here
      setRawIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i)); 
      await api.updateIssue({ id, ...updates } as Issue); 
      if (updates.status && activeSpaceId) {
          await logSpaceActivityInternal(activeSpaceId, 'task_moved', `Moved ${id} to ${updates.status}`, id);
      }
  };
  
  const deleteIssue = async (id: string) => { 
      // FIX: Use setRawIssues here
      setRawIssues(prev => prev.filter(i => i.id !== id)); 
      await api.deleteIssue(id); 
      if (activeSpaceId) {
          await logSpaceActivityInternal(activeSpaceId, 'task_deleted', `Deleted issue ${id}`, id);
      }
  };
  
  const addComment = async (issueId: string, text: string, userId: string) => { 
    const issue = rawIssues.find(i => i.id === issueId);
    if (!issue) return;
    
    const newComment = {
      id: `cmt-${Date.now()}`,
      userId,
      text,
      createdAt: new Date().toISOString()
    };
    
    const updatedComments = [...issue.comments, newComment];
    setRawIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: updatedComments } : i));
    await api.updateIssue({ ...issue, comments: updatedComments });
    if (activeSpaceId) {
        await logSpaceActivityInternal(activeSpaceId, 'comment_added', `Commented on ${issueId}`, issueId);
    }
  };
  
  const createSprint = async (name: string, goal: string, startDate: string, endDate: string, capacity: number): Promise<boolean> => { 
      if(!activeProject) return false;
      const s = { id: `sp-${Date.now()}`, projectId: activeProject.id, name, goal, startDate, endDate, capacity, status: 'PLANNED' as const };
      await api.createSprint(s);
      setAllSprints(prev => [...prev, s]);
      if (activeSpaceId) {
          await logSpaceActivityInternal(activeSpaceId, 'sprint_started', `Created sprint "${name}"`);
      }
      return true;
  };

  const startSprint = async (id: string, start: string, end: string, goal: string) => { 
      const sprint = allSprints.find(s => s.id === id); if (!sprint) return; 
      const updates = { status: 'ACTIVE' as const, startDate: start, endDate: end, goal }; 
      setAllSprints(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      await api.updateSprint({ ...sprint, ...updates });
  };
  
  const completeSprint = async (id: string, action: any) => { 
      const sprint = allSprints.find(s => s.id === id); if (!sprint) return;
      setAllSprints(prev => prev.map(s => s.id === id ? { ...s, status: 'COMPLETED' } : s));
      await api.updateSprint({ ...sprint, status: 'COMPLETED' });
      
      // Handle spillover (simplified)
      const unfinished = rawIssues.filter(i => i.sprintId === id && i.status !== Status.DONE);
      unfinished.forEach(i => updateIssue(i.id, { sprintId: null })); // Move to backlog
  };
  
  const createTeam = async (name: string, members: string[]): Promise<boolean> => { 
      if (!activeWorkspace) return false;
      const t = { id: `t-${Date.now()}`, workspaceId: activeWorkspaceId, name, leadId: currentUser?.id || '', members };
      await api.createTeam(t);
      setAllTeams(prev => [...prev, t]);
      return true;
  };
  
  const addMemberToTeam = async (teamId: string, userId: string) => { 
    const team = allTeams.find(t => t.id === teamId);
    if (!team || team.members.includes(userId)) return;
    
    const updatedTeam = { ...team, members: [...team.members, userId] };
    setAllTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    try {
      await api.updateTeam(updatedTeam);
      showToast("Member added to team", "success");
    } catch (e: any) {
      showToast(`Failed: ${e.message}`, "error");
    }
  };

  const removeMemberFromTeam = async (teamId: string, userId: string) => { 
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return;
    
    const updatedTeam = { ...team, members: team.members.filter(m => m !== userId) };
    setAllTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    try {
      await api.updateTeam(updatedTeam);
      showToast("Member removed from team", "success");
    } catch (e: any) {
      showToast(`Failed: ${e.message}`, "error");
    }
  };

  const inviteUser = async (email: string) => { 
    if (!activeWorkspace || !currentUser) {
      showToast("No active workspace", "error");
      return;
    }
    try {
      // Create a notification/invitation for the user
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        title: "Workspace Invitation",
        message: `You've been invited to join ${activeWorkspace.name}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'SYSTEM'
      };
      // In a real app, this would send an email invitation
      // For now, we'll just show a success message
      showToast(`Invitation sent to ${email}`, "success");
    } catch (e: any) {
      showToast(`Failed to invite: ${e.message}`, "error");
    }
  };

  const updateProjectInfo = async (project: Project) => { 
    try {
      await api.updateProject(project);
      setAllProjects(prev => prev.map(p => p.id === project.id ? project : p));
      showToast("Project updated successfully", "success");
    } catch (e: any) {
      showToast(`Failed to update project: ${e.message}`, "error");
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => { 
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }
    
    try {
      if (isSupabaseConfigured) {
        await supabase.from('profiles').update(updates).eq('id', userId);
      }
      showToast("Profile updated", "success");
    } catch (e: any) {
      showToast(`Failed to update profile: ${e.message}`, "error");
    }
  };

  const uploadAttachment = async (file: File) => { 
    return await api.uploadFile(file); 
  };

  const markNotificationRead = (id: string) => { 
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Optionally persist to database
    if (isSupabaseConfigured) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {});
    }
  };

  const clearNotifications = () => { 
    const notifIds = notifications.map(n => n.id);
    setNotifications([]);
    // Optionally delete from database
    if (isSupabaseConfigured && currentUser) {
      supabase.from('notifications').delete().eq('userId', currentUser.id).then(() => {});
    }
  };

  // ============================================================
  // ORGANIZATION ACTIONS
  // ============================================================
  const setActiveOrganization = async (orgId: string) => {
    setActiveOrgId(orgId);
    // Load organization role for current user
    if (currentUser) {
      const role = await api.getOrgMemberRole(orgId, currentUser.id);
      setCurrentOrgRole(role);
    }
    // Filter workspaces by organization
    const allWs = await api.getWorkspaces();
    const orgWorkspaces = allWs.filter(ws => ws.orgId === orgId);
    setWorkspaces(orgWorkspaces);
    if (orgWorkspaces.length > 0) {
      setActiveWorkspaceId(orgWorkspaces[0].id);
    } else {
      setActiveWorkspaceId('');
    }
  };

  const createOrganizationAction = async (name: string): Promise<Organization | null> => {
    if (!currentUser) return null;
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const org = await api.createOrganizationWithFounder(
        { name, slug, ownerId: currentUser.id, plan: 'free' },
        currentUser.id
      );
      setOrganizations(prev => [...prev, org]);
      showToast(`Organization "${name}" created`, "success");
      return org;
    } catch (e: any) {
      showToast(e.message, "error");
      return null;
    }
  };

  const updateOrganizationAction = async (org: Partial<Organization> & { id: string }) => {
    try {
      await api.updateOrganization(org);
      setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, ...org } : o));
      showToast("Organization updated", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const checkOrgPermission = (permission: Permission): boolean => {
    if (!currentUser || !currentOrgRole) return false;
    if (currentOrgRole === OrgRole.FOUNDER) return true;
    return hasOrgPermission(currentOrgRole, permission);
  };

  // ============================================================
  // INVITE ACTIONS
  // ============================================================
  const loadPendingInvites = async () => {
    if (!currentUser) return;
    const invites = await api.getInvitesByEmail(currentUser.email);
    setPendingInvites(invites);
  };

  const createInviteAction = async (email: string, type: InviteType, targetId: string, role: string) => {
    if (!currentUser) return;
    try {
      const token = api.generateInviteToken();
      const invite: Invite = {
        id: `inv-${Date.now()}`,
        email,
        type,
        targetId,
        role,
        status: 'pending',
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invitedBy: currentUser.id,
        createdAt: new Date().toISOString()
      };
      await api.createInvite(invite);
      
      // Generate invite URL for sharing
      const inviteUrl = `${window.location.origin}?invite=${token}&email=${encodeURIComponent(email)}`;
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(inviteUrl);
        showToast(`Invitation created! Link copied to clipboard.`, "success");
      } catch {
        showToast(`Invitation sent to ${email}`, "success");
      }
      
      console.log('Invite URL:', inviteUrl); // For debugging
      
      // Create notification for invitee (if they're already a user)
      const invitee = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (invitee) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: invitee.id,
          title: "New Invitation",
          message: `You've been invited to join a ${type}`,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'INVITE'
        };
        await api.createNotification(notif);
      }
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const acceptInviteAction = async (token: string) => {
    if (!currentUser) return;
    try {
      await api.acceptInvite(token, currentUser.id);
      showToast("Invitation accepted!", "success");
      // Reload pending invites and organizations
      await loadPendingInvites();
      const orgs = await api.getOrganizations(currentUser.id);
      setOrganizations(orgs);
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const rejectInviteAction = async (inviteId: string) => {
    try {
      await api.rejectInvite(inviteId);
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
      showToast("Invitation declined", "info");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      // Organizations
      organizations, activeOrganization, currentOrgRole, pendingInvites,
      setActiveOrganization, createOrganization: createOrganizationAction, updateOrganization: updateOrganizationAction,
      checkOrgPermission,
      
      // Invites
      createInvite: createInviteAction, acceptInvite: acceptInviteAction, rejectInvite: rejectInviteAction, loadPendingInvites,
      
      // Existing
      workspaces, projects, spaces, teams, issues: filteredIssues, allIssues: rawIssues, users, sprints, epics, notifications, activities,
      activeWorkspace, activeProject, activeSpace, activeSprint, currentUser, searchQuery, isAuthenticated, isLoading,
      login, signup, signupWithInvite, logout, resetPassword, setActiveWorkspace: setActiveWorkspaceId, setActiveProject: setActiveProjectId, setActiveSpace: setActiveSpaceId,
      createWorkspace, updateWorkspaceDetails, deleteCurrentWorkspace, createProject, 
      createSpace, updateSpace, softDeleteSpace, restoreSpace, deleteSpace,
      getSpaceMembers, addSpaceMember, removeSpaceMember,
      saveSpacePermissions, getSpacePermissions, deleteSpacePermission, checkSpacePermission,
      logSpaceActivity, updateUserPermissions,
      setSearchQuery, addIssue, updateIssue, deleteIssue, addComment, createSprint, startSprint, completeSprint,
      createTeam, addMemberToTeam, removeMemberFromTeam, inviteUser, updateProjectInfo, updateUser, markNotificationRead, clearNotifications, checkPermission,
      toasts, showToast, removeToast, uploadAttachment
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};