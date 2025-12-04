import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Space, Permission, UserRole, SpacePermission } from '../types';
import { Layout, Plus, X, Trash2, Loader2, Box, Settings, LogIn, Shield, Save } from 'lucide-react';

export const Spaces: React.FC = () => {
  const { spaces, createSpace, deleteSpace, checkPermission, activeProject, setActiveSpace, currentUser, getSpacePermissions, saveSpacePermissions, users } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedSpaceForPerms, setSelectedSpaceForPerms] = useState<Space | null>(null);
  
  // Create Form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<Space['type']>('general');
  const [isCreating, setIsCreating] = useState(false);

  // Permissions State
  const [editingPermissions, setEditingPermissions] = useState<Record<string, SpacePermission>>({});

  const canCreateSpace = checkPermission(Permission.CREATE_SPACE);
  const canDeleteSpace = checkPermission(Permission.DELETE_SPACE);
  const isFounder = currentUser?.role === UserRole.FOUNDER;

  const handleCreateSpace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;
      setIsCreating(true);
      const success = await createSpace(newName, newType, newDescription);
      setIsCreating(false);
      if (success) {
          setNewName(''); setNewDescription(''); setShowCreateModal(false);
      }
  };

  const handleDeleteSpace = async (id: string) => {
      if (window.confirm('Delete this space? This cannot be undone.')) {
          await deleteSpace(id);
      }
  };

  const handleEnterSpace = (spaceId: string) => {
      setActiveSpace(spaceId);
  };

  const openPermissionsModal = async (space: Space) => {
      setSelectedSpaceForPerms(space);
      setShowPermissionsModal(true);
      const perms = await getSpacePermissions(space.id);
      
      // Map array to object for easier editing by userId
      const permMap: Record<string, SpacePermission> = {};
      perms.forEach(p => permMap[p.userId] = p);
      setEditingPermissions(permMap);
  };

  const togglePermission = (userId: string, key: keyof SpacePermission) => {
      if (!selectedSpaceForPerms) return;

      setEditingPermissions(prev => {
          const current = prev[userId] || {
              id: `perm-${Date.now()}`, // Placeholder ID for new
              spaceId: selectedSpaceForPerms.id,
              userId: userId,
              canCreateTasks: false,
              canEditTasks: false,
              canDeleteTasks: false,
              canManageBoard: false,
              canManageSprints: false,
              canEditSpace: false,
              canDeleteSpace: false
          };

          return {
              ...prev,
              [userId]: {
                  ...current,
                  [key]: !current[key]
              }
          };
      });
  };

  const handleSavePermissions = async () => {
      // Save all changes
      for (const userId in editingPermissions) {
          await saveSpacePermissions(editingPermissions[userId]);
      }
      setShowPermissionsModal(false);
  };

  if (!activeProject) return <div>Select a project to view spaces.</div>;

  return (
    <div className="h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="w-6 h-6 text-slate-400" />
            Spaces
          </h1>
          <p className="text-sm text-slate-500 mt-1">Organize work streams within {activeProject.name}.</p>
        </div>
        {canCreateSpace && (
            <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Space
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map(space => (
            <div key={space.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group relative flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-800">{space.name}</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{space.type}</span>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 min-h-[40px] line-clamp-2">
                    {space.description || "No description provided."}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                     <button onClick={() => handleEnterSpace(space.id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                         <LogIn className="w-4 h-4" /> Enter Space
                     </button>
                     
                     <div className="flex items-center gap-2">
                         {isFounder && (
                             <button onClick={() => openPermissionsModal(space)} className="text-slate-400 hover:text-slate-600 p-1" title="Permissions">
                                 <Shield className="w-4 h-4" />
                             </button>
                         )}
                         {canDeleteSpace && (
                            <button onClick={() => handleDeleteSpace(space.id)} className="text-slate-400 hover:text-red-600 p-1" title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                     </div>
                </div>
            </div>
        ))}
      </div>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Create New Space</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateSpace} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Space Name</label>
                        <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                            <option value="general">General</option>
                            <option value="development">Development</option>
                            <option value="design">Design</option>
                            <option value="qa">QA & Testing</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isCreating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center">{isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Space</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && selectedSpaceForPerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="font-semibold text-slate-800">Manage Permissions</h3>
                          <p className="text-xs text-slate-500">Space: {selectedSpaceForPerms.name}</p>
                      </div>
                      <button onClick={() => setShowPermissionsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-6">
                      <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                              <tr>
                                  <th className="px-4 py-3 font-medium">User</th>
                                  <th className="px-4 py-3 text-center">Create Tasks</th>
                                  <th className="px-4 py-3 text-center">Edit Tasks</th>
                                  <th className="px-4 py-3 text-center">Delete Tasks</th>
                                  <th className="px-4 py-3 text-center">Manage Board</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {users.map(user => {
                                  // Skip founder (implicit full access)
                                  if (user.role === UserRole.FOUNDER) return null;
                                  
                                  const perm = editingPermissions[user.id] || {};

                                  return (
                                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                              <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
                                              <div>
                                                  <p>{user.name}</p>
                                                  <p className="text-xs text-slate-400 font-normal">{user.role}</p>
                                              </div>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input type="checkbox" checked={!!perm.canCreateTasks} onChange={() => togglePermission(user.id, 'canCreateTasks')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input type="checkbox" checked={!!perm.canEditTasks} onChange={() => togglePermission(user.id, 'canEditTasks')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input type="checkbox" checked={!!perm.canDeleteTasks} onChange={() => togglePermission(user.id, 'canDeleteTasks')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input type="checkbox" checked={!!perm.canManageBoard} onChange={() => togglePermission(user.id, 'canManageBoard')} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                      <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                      <button onClick={handleSavePermissions} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2">
                          <Save className="w-4 h-4" /> Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};