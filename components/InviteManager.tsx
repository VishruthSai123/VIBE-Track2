import React, { useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  Mail, Send, X, Check, Clock, UserPlus, Building2, Briefcase, 
  Layers, AlertCircle, Loader2, Copy, RefreshCw, Trash2, ChevronDown
} from 'lucide-react';
import { OrgRole, WorkspaceRole, SpaceRole, Invite, InviteType } from '../types';

interface InviteManagerProps {
  type: InviteType;
  targetId: string;
  targetName: string;
  onClose?: () => void;
}

export const InviteManager: React.FC<InviteManagerProps> = ({ type, targetId, targetName, onClose }) => {
  const { createInvite, currentUser, showToast, checkOrgPermission, checkPermission } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Get available roles based on invite type
  const getAvailableRoles = () => {
    switch (type) {
      case 'organization':
        return [
          { value: OrgRole.ADMIN, label: 'Admin', desc: 'Full access except billing & ownership' },
          { value: OrgRole.MANAGER, label: 'Manager', desc: 'Manage workspaces and projects' },
          { value: OrgRole.MEMBER, label: 'Member', desc: 'Basic access to work on tasks' },
          { value: OrgRole.VIEWER, label: 'Viewer', desc: 'Read-only access' },
        ];
      case 'workspace':
        return [
          { value: WorkspaceRole.WORKSPACE_ADMIN, label: 'Workspace Admin', desc: 'Full workspace management' },
          { value: WorkspaceRole.WORKSPACE_MANAGER, label: 'Workspace Manager', desc: 'Create and manage projects' },
          { value: WorkspaceRole.WORKSPACE_MEMBER, label: 'Workspace Member', desc: 'Work on assigned tasks' },
          { value: WorkspaceRole.WORKSPACE_VIEWER, label: 'Workspace Viewer', desc: 'View only' },
        ];
      case 'space':
        return [
          { value: SpaceRole.SPACE_OWNER, label: 'Space Owner', desc: 'Full space control' },
          { value: SpaceRole.SPACE_CONTRIBUTOR, label: 'Contributor', desc: 'Create and edit tasks' },
          { value: SpaceRole.SPACE_VIEWER, label: 'Viewer', desc: 'View only' },
        ];
      default:
        return [];
    }
  };

  const roles = getAvailableRoles();

  useEffect(() => {
    if (roles.length > 0 && !role) {
      setRole(roles[roles.length - 1].value); // Default to lowest role
    }
  }, [roles]);

  const getTypeIcon = () => {
    switch (type) {
      case 'organization': return <Building2 className="w-5 h-5 text-purple-500" />;
      case 'workspace': return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'space': return <Layers className="w-5 h-5 text-green-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role) return;
    
    setIsLoading(true);
    try {
      await createInvite(email.trim(), type, targetId, role);
      setEmail('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.value === role);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Invite to {type}</h3>
            <p className="text-sm text-white/70">{targetName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
            Role
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <div className="flex items-center gap-2">
                {getTypeIcon()}
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedRole?.label || 'Select role'}</p>
                  <p className="text-xs text-slate-500">{selectedRole?.desc}</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showRoleDropdown && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRole(r.value); setShowRoleDropdown(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${role === r.value ? 'bg-indigo-50' : ''}`}
                  >
                    {getTypeIcon()}
                    <div>
                      <p className={`text-sm font-medium ${role === r.value ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-slate-500">{r.desc}</p>
                    </div>
                    {role === r.value && (
                      <Check className="w-4 h-4 text-indigo-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium">Invite expires in 7 days</p>
            <p className="mt-0.5">The invitee will receive an email with a link to accept the invitation.</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            isLoading || !email.trim()
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-200'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Invitation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// Component to display pending invites for the current user
export const PendingInvites: React.FC = () => {
  const { pendingInvites, acceptInvite, rejectInvite, loadPendingInvites, isLoading } = useProject();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingInvites();
  }, []);

  const handleAccept = async (token: string, id: string) => {
    setProcessingId(id);
    await acceptInvite(token);
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await rejectInvite(id);
    setProcessingId(null);
  };

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Mail className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Pending Invitations</h3>
          <p className="text-sm text-slate-500">You have {pendingInvites.length} pending invite(s)</p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingInvites.map((invite) => (
          <div key={invite.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {invite.type === 'organization' && <Building2 className="w-5 h-5 text-purple-500" />}
              {invite.type === 'workspace' && <Briefcase className="w-5 h-5 text-blue-500" />}
              {invite.type === 'space' && <Layers className="w-5 h-5 text-green-500" />}
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Invited to join a {invite.type}
                </p>
                <p className="text-xs text-slate-500">
                  Role: {invite.role} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReject(invite.id)}
                disabled={processingId === invite.id}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => handleAccept(invite.token, invite.id)}
                disabled={processingId === invite.id}
                className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
              >
                {processingId === invite.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InviteManager;
