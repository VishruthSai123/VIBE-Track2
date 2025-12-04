import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { Space, SpacePermission, UserRole, User, DEFAULT_SPACE_PERMISSIONS, SpaceType } from '../types';
import { 
    Settings, Save, Trash2, RotateCcw, Users, Shield, 
    Activity, X, AlertTriangle, Check, Edit2, Loader2,
    UserPlus, UserMinus, ChevronDown, Info
} from 'lucide-react';

interface SpaceSettingsProps {
    space: Space;
    onClose: () => void;
}

export const SpaceSettings: React.FC<SpaceSettingsProps> = ({ space, onClose }) => {
    const { 
        users, currentUser, updateSpace, softDeleteSpace, restoreSpace, 
        getSpacePermissions, saveSpacePermissions, deleteSpacePermission,
        getSpaceMembers, addSpaceMember, removeSpaceMember, showToast,
        logSpaceActivity
    } = useProject();

    const [activeTab, setActiveTab] = useState<'general' | 'members' | 'permissions' | 'danger'>('general');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // General settings
    const [name, setName] = useState(space.name);
    const [description, setDescription] = useState(space.description || '');
    const [spaceType, setSpaceType] = useState<SpaceType>(space.type);

    // Members
    const [members, setMembers] = useState<string[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);

    // Permissions
    const [permissions, setPermissions] = useState<Record<string, SpacePermission>>({});

    const isFounder = currentUser?.role === UserRole.FOUNDER;
    const isCTO = currentUser?.role === UserRole.CTO;
    const canManage = isFounder || isCTO;

    useEffect(() => {
        loadData();
    }, [space.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [perms, mems] = await Promise.all([
                getSpacePermissions(space.id),
                getSpaceMembers(space.id)
            ]);
            
            const permMap: Record<string, SpacePermission> = {};
            perms.forEach(p => permMap[p.userId] = p);
            setPermissions(permMap);
            setMembers(mems.map(m => m.userId));
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleSaveGeneral = async () => {
        if (!name.trim()) {
            showToast('Space name is required', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await updateSpace({ id: space.id, name, description, type: spaceType });
            showToast('Space updated successfully', 'success');
            await logSpaceActivity('space_updated', `Updated space settings for "${name}"`);
        } catch (e: any) {
            showToast(e.message || 'Failed to update', 'error');
        }
        setIsSaving(false);
    };

    const handleAddMember = async (userId: string) => {
        if (members.includes(userId)) return;
        try {
            await addSpaceMember(space.id, userId);
            setMembers(prev => [...prev, userId]);
            
            // Set default permissions based on user's role
            const user = users.find(u => u.id === userId);
            if (user) {
                const defaults = DEFAULT_SPACE_PERMISSIONS[user.role as UserRole] || {};
                const newPerm: SpacePermission = {
                    spaceId: space.id,
                    userId,
                    canView: true,
                    canCreateTasks: defaults.canCreateTasks || false,
                    canEditTasks: defaults.canEditTasks || false,
                    canDeleteTasks: defaults.canDeleteTasks || false,
                    canManageBoard: defaults.canManageBoard || false,
                    canManageSprints: defaults.canManageSprints || false,
                    canEditSpace: defaults.canEditSpace || false,
                    canDeleteSpace: defaults.canDeleteSpace || false,
                    canManageMembers: defaults.canManageMembers || false
                };
                await saveSpacePermissions(newPerm);
                setPermissions(prev => ({ ...prev, [userId]: newPerm }));
            }
            
            showToast('Member added', 'success');
            await logSpaceActivity('member_added', `Added ${user?.name} to space`);
        } catch (e: any) {
            showToast(e.message, 'error');
        }
        setShowAddMember(false);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm('Remove this member from the space?')) return;
        try {
            await removeSpaceMember(space.id, userId);
            await deleteSpacePermission(space.id, userId);
            setMembers(prev => prev.filter(id => id !== userId));
            setPermissions(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
            });
            
            const user = users.find(u => u.id === userId);
            showToast('Member removed', 'success');
            await logSpaceActivity('member_removed', `Removed ${user?.name} from space`);
        } catch (e: any) {
            showToast(e.message, 'error');
        }
    };

    const togglePermission = (userId: string, key: keyof SpacePermission) => {
        if (!isFounder) return; // Only founder can change permissions
        
        setPermissions(prev => {
            const current = prev[userId] || {
                spaceId: space.id,
                userId,
                canView: true,
                canCreateTasks: false,
                canEditTasks: false,
                canDeleteTasks: false,
                canManageBoard: false,
                canManageSprints: false,
                canEditSpace: false,
                canDeleteSpace: false,
                canManageMembers: false
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
        setIsSaving(true);
        try {
            for (const userId in permissions) {
                await saveSpacePermissions(permissions[userId]);
            }
            showToast('Permissions saved', 'success');
            await logSpaceActivity('permission_updated', 'Updated space permissions');
        } catch (e: any) {
            showToast(e.message, 'error');
        }
        setIsSaving(false);
    };

    const handleSoftDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this space? It can be recovered later.')) return;
        try {
            await softDeleteSpace(space.id);
            showToast('Space deleted. It can be recovered from the trash.', 'success');
            onClose();
        } catch (e: any) {
            showToast(e.message, 'error');
        }
    };

    const handleRestore = async () => {
        try {
            await restoreSpace(space.id);
            showToast('Space restored successfully', 'success');
        } catch (e: any) {
            showToast(e.message, 'error');
        }
    };

    const nonMemberUsers = users.filter(u => !members.includes(u.id) && u.role !== UserRole.FOUNDER);

    const spaceTypes: { value: SpaceType; label: string }[] = [
        { value: 'development', label: 'Development' },
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
        { value: 'design', label: 'Design' },
        { value: 'qa', label: 'QA & Testing' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'growth', label: 'Growth' },
        { value: 'ai_research', label: 'AI Research' },
        { value: 'general', label: 'General' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-600" />
                            Space Settings
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{space.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-6">
                        {[
                            { id: 'general', label: 'General', icon: Edit2 },
                            { id: 'members', label: 'Members', icon: Users },
                            { id: 'permissions', label: 'Permissions', icon: Shield },
                            { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* General Tab */}
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Space Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={!canManage}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                        <select
                                            value={spaceType}
                                            onChange={(e) => setSpaceType(e.target.value as SpaceType)}
                                            disabled={!canManage}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 bg-white"
                                        >
                                            {spaceTypes.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            disabled={!canManage}
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 resize-none"
                                        />
                                    </div>

                                    {canManage && (
                                        <button
                                            onClick={handleSaveGeneral}
                                            disabled={isSaving}
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Members Tab */}
                            {activeTab === 'members' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-800">Space Members</h3>
                                        {canManage && (
                                            <button
                                                onClick={() => setShowAddMember(true)}
                                                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Add Member
                                            </button>
                                        )}
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        {members.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p>No members in this space yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {members.map(userId => {
                                                    const user = users.find(u => u.id === userId);
                                                    if (!user) return null;
                                                    return (
                                                        <div key={userId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{user.name}</p>
                                                                    <p className="text-sm text-slate-500">{user.role}</p>
                                                                </div>
                                                            </div>
                                                            {canManage && user.role !== UserRole.FOUNDER && (
                                                                <button
                                                                    onClick={() => handleRemoveMember(userId)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <UserMinus className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Member Modal */}
                                    {showAddMember && (
                                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                                                <h4 className="text-lg font-semibold mb-4">Add Member to Space</h4>
                                                <div className="max-h-60 overflow-y-auto space-y-2">
                                                    {nonMemberUsers.length === 0 ? (
                                                        <p className="text-slate-500 text-center py-4">All users are already members</p>
                                                    ) : (
                                                        nonMemberUsers.map(user => (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => handleAddMember(user.id)}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                                                            >
                                                                <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                                                                <div>
                                                                    <p className="font-medium text-slate-800">{user.name}</p>
                                                                    <p className="text-xs text-slate-500">{user.role}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowAddMember(false)}
                                                    className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Permissions Tab */}
                            {activeTab === 'permissions' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <p className="text-sm text-amber-800">
                                            Only Founders can modify permissions. Permissions are applied per user per space.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">View</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">Create</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">Edit</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">Delete</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">Board</th>
                                                    <th className="text-center py-3 px-2 font-medium text-slate-600">Sprints</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {members.map(userId => {
                                                    const user = users.find(u => u.id === userId);
                                                    if (!user) return null;
                                                    const perm = permissions[userId] || {};
                                                    const isUserFounder = user.role === UserRole.FOUNDER;

                                                    return (
                                                        <tr key={userId} className={isUserFounder ? 'bg-indigo-50' : 'hover:bg-slate-50'}>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
                                                                    <div>
                                                                        <p className="font-medium text-slate-800">{user.name}</p>
                                                                        <p className="text-xs text-slate-400">{user.role}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            {['canView', 'canCreateTasks', 'canEditTasks', 'canDeleteTasks', 'canManageBoard', 'canManageSprints'].map(key => (
                                                                <td key={key} className="text-center py-3 px-2">
                                                                    {isUserFounder ? (
                                                                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                                                                    ) : (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!(perm as any)[key]}
                                                                            onChange={() => togglePermission(userId, key as keyof SpacePermission)}
                                                                            disabled={!isFounder}
                                                                            className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                                        />
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {isFounder && (
                                        <button
                                            onClick={handleSavePermissions}
                                            disabled={isSaving}
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Permissions
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Danger Zone Tab */}
                            {activeTab === 'danger' && canManage && (
                                <div className="space-y-6">
                                    <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50">
                                        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Delete Space
                                        </h3>
                                        <p className="text-sm text-red-700 mb-4">
                                            Deleting this space will move it to trash. All tasks will be preserved but hidden. 
                                            You can restore it within 30 days.
                                        </p>
                                        {space.deletedAt ? (
                                            <button
                                                onClick={handleRestore}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Restore Space
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleSoftDelete}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Space
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
