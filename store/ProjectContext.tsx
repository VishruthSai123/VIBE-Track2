import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Issue, User, Status, Priority, IssueType, Sprint, Epic, Project, Notification, Workspace, Team, Permission, UserRole, Space, SpacePermission, Activity } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { hasPermission, setPermissionOverrides } from '../utils/rbac';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ProjectContextType {
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
  signup: (name: string, email: string, workspaceName: string, role: string, password?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  setActiveSpace: (id: string | null) => void;
  
  createWorkspace: (name: string) => Promise<boolean>;
  updateWorkspaceDetails: (workspace: Workspace) => Promise<void>;
  deleteCurrentWorkspace: () => Promise<void>;
  createProject: (name: string, key: string, description: string, type: Project['type']) => Promise<void>;
  
  createSpace: (name: string, type: Space['type'], description: string) => Promise<boolean>;
  deleteSpace: (id: string) => Promise<void>;
  saveSpacePermissions: (permissions: SpacePermission) => Promise<void>;
  getSpacePermissions: (spaceId: string) => Promise<SpacePermission[]>;

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
  
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  uploadAttachment: (file: File) => Promise<string>;
  
  checkPermission: (permission: Permission) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
            const [wsData, allUsers] = await Promise.all([api.getWorkspaces(), api.getUsers()]);
            if (mounted) {
                setCurrentUser(userObj); setUsers(allUsers);
                if (wsData.length > 0) {
                    setWorkspaces(wsData);
                    setActiveWorkspaceId(activeWorkspaceId && wsData.some(w => w.id === activeWorkspaceId) ? activeWorkspaceId : wsData[0].id);
                }
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

  const logActivity = async (action: string, details: string) => {
      if (!activeSpaceId || !currentUser) return;
      const activity: Activity = { id: `act-${Date.now()}`, spaceId: activeSpaceId, userId: currentUser.id, action, details, createdAt: new Date().toISOString() };
      setActivities(prev => [activity, ...prev]);
      await api.createActivity(activity);
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.FOUNDER) return true;
    if (activeSpaceId && currentSpacePermission) {
        // Space overrides
        return hasPermission(currentUser.role, permission, currentUser.id);
    }
    return hasPermission(currentUser.role, permission, currentUser.id);
  };

  // ... Actions ...
  const login = async (email: string, password?: string) => { if (isSupabaseConfigured && password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) showToast(error.message, "error"); } };
  const signup = async (name: string, email: string, workspaceName: string, role: string, password?: string) => { /* ... */ };
  const resetPassword = async (email: string) => { /* ... */ };
  const logout = async () => { if (isSupabaseConfigured) await supabase.auth.signOut(); setCurrentUser(null); window.location.reload(); };

  const createWorkspace = async (name: string): Promise<boolean> => {
      if (!currentUser) return false;
      try {
          const ws = { id: `ws-${Date.now()}`, name, ownerId: currentUser.id, members: [currentUser.id] };
          await api.createWorkspace(ws);
          setWorkspaces(prev => [...prev, ws]);
          setActiveWorkspaceId(ws.id);
          return true;
      } catch(e: any) { showToast(e.message, "error"); return false; }
  };
  const updateWorkspaceDetails = async (workspace: Workspace) => { try { await api.updateWorkspace(workspace); setWorkspaces(prev => prev.map(w => w.id === workspace.id ? workspace : w)); showToast("Updated", "success"); } catch (e: any) { showToast(`Failed: ${e.message}`, "error"); } };
  const deleteCurrentWorkspace = async () => { if (!activeWorkspaceId) return; try { await api.deleteWorkspace(activeWorkspaceId); setWorkspaces(prev => prev.filter(w => w.id !== activeWorkspaceId)); setActiveWorkspaceId(''); showToast("Deleted", "success"); } catch (e: any) { showToast(`Failed: ${e.message}`, "error"); } };
  const createProject = async (name: string, key: string, desc: string, type: any) => { /* ... */ };

  const createSpace = async (name: string, type: Space['type'], description: string): Promise<boolean> => {
      if (!activeProject || !currentUser) return false;
      try {
          const sp = { id: `spc-${Date.now()}`, projectId: activeProject.id, name, type, description, createdBy: currentUser.id, createdAt: new Date().toISOString() };
          await api.createSpace(sp);
          setAllSpaces(prev => [...prev, sp]);
          showToast("Space created", "success");
          return true;
      } catch (e: any) { showToast(e.message, "error"); return false; }
  };
  const deleteSpace = async (id: string) => { await api.deleteSpace(id); setAllSpaces(prev => prev.filter(s => s.id !== id)); if(activeSpaceId === id) setActiveSpaceId(null); };
  const saveSpacePermissions = async (perm: SpacePermission) => { await api.updateSpacePermissions(perm); showToast("Permissions updated", "success"); };
  const getSpacePermissions = async (spaceId: string) => { return await api.getSpacePermissions(spaceId); };
  const updateUserPermissions = (userId: string, permissions: any) => { setPermissionOverrides(userId, permissions); showToast("Updated", "success"); };

  const addIssue = async (issue: any) => { 
      if (!activeProject) return;
      const suffix = Date.now().toString().slice(-4);
      const newIssue = { ...issue, id: `${activeProject.key}-${suffix}`, projectId: activeProject.id, spaceId: activeSpaceId || null, comments: [], subtasks: [], attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      // FIX: Use setRawIssues here
      setRawIssues(prev => [...prev, newIssue]);
      await api.createIssue(newIssue);
      logActivity("Created Issue", newIssue.title);
  };

  const updateIssue = async (id: string, updates: any) => { 
      // FIX: Use setRawIssues here
      setRawIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i)); 
      await api.updateIssue({ id, ...updates } as Issue); 
      if (updates.status) logActivity("Moved Issue", `${id} to ${updates.status}`);
  };
  
  const deleteIssue = async (id: string) => { 
      // FIX: Use setRawIssues here
      setRawIssues(prev => prev.filter(i => i.id !== id)); 
      await api.deleteIssue(id); 
      logActivity("Deleted Issue", id); 
  };
  
  const addComment = async (id: string, text: string, userId: string) => { /* ... */ };
  
  const createSprint = async (name: string, goal: string, startDate: string, endDate: string, capacity: number): Promise<boolean> => { 
      if(!activeProject) return false;
      const s = { id: `sp-${Date.now()}`, projectId: activeProject.id, name, goal, startDate, endDate, capacity, status: 'PLANNED' as const };
      await api.createSprint(s);
      setAllSprints(prev => [...prev, s]);
      logActivity("Created Sprint", name);
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
  
  const addMemberToTeam = (tid: string, uid: string) => { /* ... */ };
  const removeMemberFromTeam = (tid: string, uid: string) => { /* ... */ };
  const inviteUser = async (email: string) => { /* ... */ };
  const updateProjectInfo = (info: Project) => { /* ... */ };
  const updateUser = (uid: string, data: any) => { /* ... */ };
  const uploadAttachment = async (file: File) => { return await api.uploadFile(file); };
  const markNotificationRead = (id: string) => { /* ... */ };
  const clearNotifications = () => { /* ... */ };

  return (
    <ProjectContext.Provider value={{ 
      workspaces, projects, spaces, teams, issues: filteredIssues, allIssues: rawIssues, users, sprints, epics, notifications, activities,
      activeWorkspace, activeProject, activeSpace, activeSprint, currentUser, searchQuery, isAuthenticated, isLoading,
      login, signup, logout, resetPassword, setActiveWorkspace: setActiveWorkspaceId, setActiveProject: setActiveProjectId, setActiveSpace: setActiveSpaceId,
      createWorkspace, updateWorkspaceDetails, deleteCurrentWorkspace, createProject, 
      createSpace, deleteSpace, saveSpacePermissions, getSpacePermissions, updateUserPermissions,
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