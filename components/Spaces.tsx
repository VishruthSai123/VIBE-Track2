import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { Space, Permission, UserRole, SpacePermission, SpaceType, Status, Activity } from '../types';
import { SpaceSettings } from './SpaceSettings';
import { 
    Layout, Plus, X, Trash2, Loader2, Box, Settings, LogIn, Shield, Save, 
    RotateCcw, Archive, ChevronRight, Activity as ActivityIcon, 
    CheckCircle2, Clock, Users, Layers, Code, Palette, TestTube, 
    Megaphone, TrendingUp, Brain, FolderOpen, BarChart3, 
    ArrowRight, Sparkles
} from 'lucide-react';

const SPACE_ICONS: Record<SpaceType, React.ReactNode> = {
    development: <Code className="w-5 h-5" />,
    frontend: <Layout className="w-5 h-5" />,
    backend: <Layers className="w-5 h-5" />,
    design: <Palette className="w-5 h-5" />,
    qa: <TestTube className="w-5 h-5" />,
    marketing: <Megaphone className="w-5 h-5" />,
    growth: <TrendingUp className="w-5 h-5" />,
    ai_research: <Brain className="w-5 h-5" />,
    general: <FolderOpen className="w-5 h-5" />
};

const SPACE_COLORS: Record<SpaceType, string> = {
    development: 'from-blue-500 to-indigo-600',
    frontend: 'from-cyan-500 to-blue-600',
    backend: 'from-violet-500 to-purple-600',
    design: 'from-pink-500 to-rose-600',
    qa: 'from-green-500 to-emerald-600',
    marketing: 'from-orange-500 to-amber-600',
    growth: 'from-teal-500 to-cyan-600',
    ai_research: 'from-purple-500 to-indigo-600',
    general: 'from-slate-500 to-gray-600'
};

export const Spaces: React.FC = () => {
    const { 
        spaces, allIssues, createSpace, softDeleteSpace, restoreSpace, 
        checkPermission, activeProject, setActiveSpace, currentUser, 
        users, activities
    } = useProject();
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
    const [showDeleted, setShowDeleted] = useState(false);
    
    // Create Form
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newType, setNewType] = useState<SpaceType>('general');
    const [isCreating, setIsCreating] = useState(false);

    const canCreateSpace = checkPermission(Permission.CREATE_SPACE);
    const canDeleteSpace = checkPermission(Permission.DELETE_SPACE);
    const isFounder = currentUser?.role === UserRole.FOUNDER;

    // Filter spaces
    const activeSpaces = useMemo(() => 
        spaces.filter(s => !s.deletedAt), 
    [spaces]);
    
    const deletedSpaces = useMemo(() => 
        spaces.filter(s => s.deletedAt), 
    [spaces]);

    // Calculate stats per space
    const spaceStats = useMemo(() => {
        const stats: Record<string, { total: number; done: number; inProgress: number; storyPoints: number }> = {};
        
        activeSpaces.forEach(space => {
            const spaceIssues = allIssues.filter(i => i.spaceId === space.id);
            stats[space.id] = {
                total: spaceIssues.length,
                done: spaceIssues.filter(i => i.status === Status.DONE).length,
                inProgress: spaceIssues.filter(i => i.status === Status.IN_PROGRESS).length,
                storyPoints: spaceIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
            };
        });
        
        return stats;
    }, [activeSpaces, allIssues]);

    // Recent activities across all spaces
    const recentActivities = useMemo(() => {
        return activities.slice(0, 10);
    }, [activities]);

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setIsCreating(true);
        const success = await createSpace(newName, newType, newDescription);
        setIsCreating(false);
        if (success) {
            setNewName(''); 
            setNewDescription(''); 
            setNewType('general');
            setShowCreateModal(false);
        }
    };

    const handleDeleteSpace = async (id: string) => {
        if (window.confirm('Delete this space? It will be moved to trash and can be recovered later.')) {
            await softDeleteSpace(id);
        }
    };

    const handleRestoreSpace = async (id: string) => {
        await restoreSpace(id);
    };

    const handleEnterSpace = (spaceId: string) => {
        setActiveSpace(spaceId);
    };

    const openSettings = (space: Space) => {
        setSelectedSpace(space);
        setShowSettingsModal(true);
    };

    const getUserById = (id: string) => users.find(u => u.id === id);

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

    if (!activeProject) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Select a project to view spaces.</p>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-50 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Box className="w-5 h-5 text-white" />
                                </div>
                                Spaces
                            </h1>
                            <p className="text-slate-500 mt-2 max-w-xl">
                                Organize work into dedicated spaces for better team focus and management.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {isFounder && deletedSpaces.length > 0 && (
                                <button 
                                    onClick={() => setShowDeleted(!showDeleted)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                                        showDeleted 
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <Archive className="w-4 h-4" />
                                    Trash ({deletedSpaces.length})
                                </button>
                            )}
                            
                            {canCreateSpace && (
                                <button 
                                    onClick={() => setShowCreateModal(true)} 
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Create Space
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                <Layers className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Active Spaces</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{activeSpaces.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Tasks Done</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Object.values(spaceStats).reduce((sum, s) => sum + s.done, 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">In Progress</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Object.values(spaceStats).reduce((sum, s) => sum + s.inProgress, 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Story Points</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Object.values(spaceStats).reduce((sum, s) => sum + s.storyPoints, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 md:p-8">
                {/* Deleted Spaces Section */}
                {showDeleted && deletedSpaces.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Archive className="w-5 h-5 text-amber-500" />
                            Deleted Spaces
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {deletedSpaces.map(space => (
                                <div key={space.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5 opacity-75">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {SPACE_ICONS[space.type]}
                                            <h3 className="font-bold text-slate-700">{space.name}</h3>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                            Deleted
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Deleted on {new Date(space.deletedAt!).toLocaleDateString()}
                                    </p>
                                    <button 
                                        onClick={() => handleRestoreSpace(space.id)}
                                        className="text-sm font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Spaces Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSpaces.map(space => {
                        const stats = spaceStats[space.id] || { total: 0, done: 0, inProgress: 0, storyPoints: 0 };
                        const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                        
                        return (
                            <div 
                                key={space.id} 
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                            >
                                {/* Space Header with Gradient */}
                                <div className={`bg-gradient-to-r ${SPACE_COLORS[space.type]} p-5 text-white`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                {SPACE_ICONS[space.type]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{space.name}</h3>
                                                <span className="text-xs opacity-80 capitalize">{space.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        {(isFounder || currentUser?.role === UserRole.CTO) && (
                                            <button 
                                                onClick={() => openSettings(space)}
                                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                title="Settings"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Space Content */}
                                <div className="p-5">
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                                        {space.description || "No description provided."}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <p className="text-lg font-bold text-slate-800">{stats.total}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Tasks</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded-lg">
                                            <p className="text-lg font-bold text-green-600">{stats.done}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Done</p>
                                        </div>
                                        <div className="text-center p-2 bg-indigo-50 rounded-lg">
                                            <p className="text-lg font-bold text-indigo-600">{stats.storyPoints}</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Points</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${SPACE_COLORS[space.type]} transition-all duration-500`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <button 
                                            onClick={() => handleEnterSpace(space.id)} 
                                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogIn className="w-4 h-4" /> Enter Space
                                        </button>
                                        
                                        {canDeleteSpace && (
                                            <button 
                                                onClick={() => handleDeleteSpace(space.id)} 
                                                className="ml-2 p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {activeSpaces.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Layers className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Spaces Yet</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                Create your first space to organize your team's work into focused areas.
                            </p>
                            {canCreateSpace && (
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Create First Space
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Activity Section */}
                {recentActivities.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-indigo-500" />
                            Recent Activity
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                            {recentActivities.map(activity => {
                                const user = getUserById(activity.userId);
                                const space = spaces.find(s => s.id === activity.spaceId);
                                
                                return (
                                    <div key={activity.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                                        <img 
                                            src={user?.avatar || `https://ui-avatars.com/api/?name=U&background=random`} 
                                            className="w-8 h-8 rounded-full" 
                                            alt="" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-800">
                                                <span className="font-medium">{user?.name || 'Unknown'}</span>
                                                {' '}
                                                <span className="text-slate-500">{activity.details}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                <span>{space?.name || 'Unknown Space'}</span>
                                                <span>•</span>
                                                <span>{new Date(activity.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Space Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Create New Space</h3>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleCreateSpace} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Space Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)} 
                                    placeholder="e.g., Frontend Development"
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {spaceTypes.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setNewType(type.value)}
                                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                                                newType === type.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`${newType === type.value ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {SPACE_ICONS[type.value]}
                                            </div>
                                            <span className={`text-xs font-medium ${newType === type.value ? 'text-indigo-600' : 'text-slate-600'}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                <textarea 
                                    value={newDescription} 
                                    onChange={(e) => setNewDescription(e.target.value)} 
                                    placeholder="What is this space for?"
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none transition-all" 
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isCreating} 
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Space
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && selectedSpace && (
                <SpaceSettings 
                    space={selectedSpace} 
                    onClose={() => {
                        setShowSettingsModal(false);
                        setSelectedSpace(null);
                    }} 
                />
            )}
        </div>
    );
};