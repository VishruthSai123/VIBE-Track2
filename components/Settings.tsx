import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { Save, Settings as SettingsIcon, Shield, Trash2, Mail, X, Briefcase, Eye, EyeOff, Palette, Image as ImageIcon } from 'lucide-react';
import { Permission } from '../types';

interface SettingsProps {
    view: 'project' | 'workspace';
}

export const Settings: React.FC<SettingsProps> = ({ view }) => {
  const { 
      activeProject, activeWorkspace, updateProjectInfo, updateWorkspaceDetails, deleteCurrentWorkspace, 
      users, checkPermission, inviteUser, currentUser 
  } = useProject();
  
  // --- Project State ---
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  
  // --- Workspace State ---
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [wsLogo, setWsLogo] = useState('');
  const [wsColorTheme, setWsColorTheme] = useState('');
  const [wsVisibility, setWsVisibility] = useState<'private' | 'public'>('private');
  
  // --- UI State ---
  const [isSaved, setIsSaved] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // RBAC Checks
  const canDeleteProject = checkPermission(Permission.DELETE_PROJECT);
  const canManageAccess = checkPermission(Permission.MANAGE_ACCESS);
  const isReadOnly = !checkPermission(Permission.CREATE_PROJECT);
  
  const isWorkspaceOwner = activeWorkspace?.ownerId === currentUser?.id;

  // Sync state when props/context changes
  useEffect(() => {
    if (activeProject && view === 'project') {
      setName(activeProject.name);
      setKey(activeProject.key);
      setDescription(activeProject.description);
      setLeadId(activeProject.leadId);
    }
  }, [activeProject, view]);

  useEffect(() => {
      if (activeWorkspace && view === 'workspace') {
          setWsName(activeWorkspace.name);
          setWsDescription(activeWorkspace.description || '');
          setWsLogo(activeWorkspace.logo || '');
          setWsColorTheme(activeWorkspace.colorTheme || '');
          setWsVisibility(activeWorkspace.visibility || 'private');
      }
  }, [activeWorkspace, view]);

  if (!activeProject && view === 'project') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50">
              <SettingsIcon className="w-12 h-12 text-slate-300 mb-4" />
              <h2 className="text-lg font-semibold text-slate-700 mb-2">No Project Selected</h2>
              <p>Please select a project from the sidebar to view its settings.</p>
          </div>
      );
  }

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if(isReadOnly || !activeProject) return;
    
    updateProjectInfo({ 
        ...activeProject,
        name, 
        key, 
        description, 
        leadId 
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeWorkspace) return;

      updateWorkspaceDetails({
          ...activeWorkspace,
          name: isWorkspaceOwner ? wsName : activeWorkspace.name, // Only owner can change name
          description: wsDescription,
          logo: wsLogo,
          colorTheme: wsColorTheme,
          visibility: wsVisibility
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteWorkspace = async () => {
      if (deleteConfirmation === activeWorkspace?.name) {
          await deleteCurrentWorkspace();
          setShowDeleteModal(false);
      }
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;
      await inviteUser(inviteEmail);
      setInviteEmail('');
      setShowInviteModal(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                {view === 'workspace' ? (
                    <>
                        <Briefcase className="w-6 h-6 text-slate-400" />
                        Workspace Settings
                    </>
                ) : (
                    <>
                        <SettingsIcon className="w-6 h-6 text-slate-400" />
                        Project Settings
                    </>
                )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
                {view === 'workspace' 
                    ? `Manage configuration for ${activeWorkspace?.name}` 
                    : `Manage configuration for ${activeProject?.name}`
                }
            </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
            {view === 'project' && activeProject && (
                <form onSubmit={handleSaveProject} className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Key</label>
                    <div className="relative">
                        <input
                        type="text"
                        value={key}
                        maxLength={5}
                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase font-mono disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">Prefix for issues</span>
                    </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isReadOnly}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Project Lead</label>
                    <div className="relative">
                    <select 
                        value={leadId}
                        onChange={(e) => setLeadId(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                    <Shield className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                        type="submit"
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                        >
                        <Save className="w-4 h-4" />
                        <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
                        </button>
                        
                        {canDeleteProject && (
                            <button type="button" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete Project
                            </button>
                        )}
                    </div>
                )}
                </form>
            )}

            {view === 'workspace' && activeWorkspace && (
                <div className="space-y-8 animate-fade-in-up">
                    <form onSubmit={handleSaveWorkspace} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Workspace Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={wsName}
                                        onChange={(e) => setWsName(e.target.value)}
                                        disabled={!isWorkspaceOwner}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    <Briefcase className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                </div>
                                {!isWorkspaceOwner && <p className="text-xs text-slate-400 mt-1">Only the founder can change the name.</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Visibility</label>
                                <div className="relative">
                                    <select
                                        value={wsVisibility}
                                        onChange={(e) => setWsVisibility(e.target.value as 'private' | 'public')}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="private">Private (Invite Only)</option>
                                        <option value="public">Public (Visible to Organization)</option>
                                    </select>
                                    {wsVisibility === 'private' ? (
                                        <EyeOff className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    ) : (
                                        <Eye className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                            <textarea
                                value={wsDescription}
                                onChange={(e) => setWsDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="What is this workspace for?"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={wsLogo}
                                        onChange={(e) => setWsLogo(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="https://..."
                                    />
                                    <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Theme Color</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={wsColorTheme}
                                        onChange={(e) => setWsColorTheme(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="#6366f1"
                                    />
                                    <Palette className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    {wsColorTheme && (
                                        <div 
                                            className="absolute right-3 top-3 w-4 h-4 rounded-full border border-slate-200" 
                                            style={{ backgroundColor: wsColorTheme }} 
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="submit"
                                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSaved ? 'Saved!' : 'Save Workspace'}</span>
                            </button>
                        </div>
                    </form>

                    {isWorkspaceOwner && (
                        <div className="border border-red-200 bg-red-50 rounded-xl p-6 mt-8">
                            <h3 className="text-red-800 font-bold text-lg mb-2">Danger Zone</h3>
                            <p className="text-red-600 text-sm mb-4">
                                Deleting this workspace is irreversible. It will delete all projects, sprints, tasks, and remove all member associations.
                            </p>
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                Delete Workspace
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Invite Team Member</h3>
                        <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleInvite} className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button 
                                type="button" 
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            >
                                Send Invitation
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border-2 border-red-100">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Workspace?</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            This action cannot be undone. This will permanently delete the 
                            <span className="font-bold"> {activeWorkspace?.name} </span> 
                            workspace, along with all associated projects, tasks, and data.
                        </p>
                        
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Type <span className="font-mono bg-slate-100 px-1 rounded select-all">{activeWorkspace?.name}</span> to confirm
                        </label>
                        <input 
                            type="text" 
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-6"
                            placeholder="Type workspace name"
                        />

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteWorkspace}
                                disabled={deleteConfirmation !== activeWorkspace?.name}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete Workspace
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};