import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { Issue, Status, COLUMNS, Priority, IssueType, SpacePermission, UserRole } from '../types';
import { IssueCard } from './IssueCard';
import { IssueModal } from './IssueModal';
import { 
    Plus, Filter, LayoutGrid, List, Users, Clock, AlertTriangle, 
    CheckCircle2, ArrowUpCircle, Circle, ChevronDown, X, Search,
    Sparkles, Loader2, BarChart3, Activity
} from 'lucide-react';

interface SpaceBoardProps {
    onCreateIssue?: () => void;
}

export const SpaceBoard: React.FC<SpaceBoardProps> = ({ onCreateIssue }) => {
    const { 
        issues, activeSpace, users, sprints, activeSprint, 
        updateIssue, currentUser, checkSpacePermission
    } = useProject();

    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

    // Space permission check
    const canEditTasks = checkSpacePermission('canEditTasks');
    const canCreateTasks = checkSpacePermission('canCreateTasks');
    const canManageBoard = checkSpacePermission('canManageBoard');

    // Filter issues for this space
    const spaceIssues = useMemo(() => {
        if (!activeSpace) return issues;
        return issues.filter(i => i.spaceId === activeSpace.id);
    }, [issues, activeSpace]);

    // Apply filters
    const filteredIssues = useMemo(() => {
        return spaceIssues.filter(issue => {
            if (filterAssignee !== 'all' && issue.assigneeId !== filterAssignee) return false;
            if (filterPriority !== 'all' && issue.priority !== filterPriority) return false;
            if (filterType !== 'all' && issue.type !== filterType) return false;
            if (searchTerm && !issue.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [spaceIssues, filterAssignee, filterPriority, filterType, searchTerm]);

    // Group by status
    const issuesByStatus = useMemo(() => {
        const grouped: Record<Status, Issue[]> = {
            [Status.BACKLOG]: [],
            [Status.TODO]: [],
            [Status.IN_PROGRESS]: [],
            [Status.IN_REVIEW]: [],
            [Status.QA]: [],
            [Status.DONE]: []
        };
        filteredIssues.forEach(issue => {
            if (grouped[issue.status]) {
                grouped[issue.status].push(issue);
            }
        });
        return grouped;
    }, [filteredIssues]);

    // Stats
    const stats = useMemo(() => ({
        total: spaceIssues.length,
        todo: spaceIssues.filter(i => i.status === Status.TODO).length,
        inProgress: spaceIssues.filter(i => i.status === Status.IN_PROGRESS).length,
        inReview: spaceIssues.filter(i => i.status === Status.IN_REVIEW).length,
        qa: spaceIssues.filter(i => i.status === Status.QA).length,
        done: spaceIssues.filter(i => i.status === Status.DONE).length,
        storyPoints: spaceIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
        completedPoints: spaceIssues.filter(i => i.status === Status.DONE).reduce((sum, i) => sum + (i.storyPoints || 0), 0)
    }), [spaceIssues]);

    const handleDragStart = (e: React.DragEvent, issue: Issue) => {
        if (!canEditTasks && !canManageBoard) return;
        setDraggedIssue(issue);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, status: Status) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, newStatus: Status) => {
        e.preventDefault();
        if (draggedIssue && draggedIssue.status !== newStatus) {
            updateIssue(draggedIssue.id, { status: newStatus });
        }
        setDraggedIssue(null);
        setDragOverColumn(null);
    };

    const clearFilters = () => {
        setFilterAssignee('all');
        setFilterPriority('all');
        setFilterType('all');
        setSearchTerm('');
    };

    const hasActiveFilters = filterAssignee !== 'all' || filterPriority !== 'all' || filterType !== 'all' || searchTerm;

    if (!activeSpace) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Select a space to view its board</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-4 md:p-6 bg-white border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                            {activeSpace.name} Board
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {stats.total} tasks • {stats.storyPoints} story points total
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                                showFilters || hasActiveFilters
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                            )}
                        </button>

                        {/* Create Task */}
                        {canCreateTasks && onCreateIssue && (
                            <button
                                onClick={onCreateIssue}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Task
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-up">
                        <div className="flex flex-wrap gap-4 items-center">
                            <select
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value)}
                                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Assignees</option>
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Priorities</option>
                                {Object.values(Priority).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Types</option>
                                {Object.values(IssueType).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="mt-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                        <Circle className="w-3 h-3 text-slate-400" />
                        <span>To Do: {stats.todo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                        <ArrowUpCircle className="w-3 h-3" />
                        <span>In Progress: {stats.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Review: {stats.inReview}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        <span>QA: {stats.qa}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done: {stats.done}</span>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto p-4 md:p-6">
                <div className="flex gap-4 h-full min-w-max">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className={`w-72 flex flex-col bg-slate-100 rounded-xl transition-all ${
                                dragOverColumn === column.id ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''
                            }`}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-700">{column.title}</h3>
                                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                        {issuesByStatus[column.id]?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                {issuesByStatus[column.id]?.map(issue => (
                                    <div
                                        key={issue.id}
                                        draggable={canEditTasks || canManageBoard}
                                        onDragStart={(e) => handleDragStart(e, issue)}
                                        onClick={() => setSelectedIssue(issue)}
                                        className={`cursor-pointer transition-transform ${
                                            draggedIssue?.id === issue.id ? 'opacity-50 scale-95' : ''
                                        } ${canEditTasks || canManageBoard ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    >
                                        <IssueCard issue={issue} onClick={() => setSelectedIssue(issue)} />
                                    </div>
                                ))}

                                {issuesByStatus[column.id]?.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Issue Modal */}
            {selectedIssue && (
                <IssueModal 
                    issue={selectedIssue} 
                    onClose={() => setSelectedIssue(null)} 
                />
            )}
        </div>
    );
};
