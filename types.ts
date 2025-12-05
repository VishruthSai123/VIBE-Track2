export enum IssueType {
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
  EPIC = 'EPIC',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum Status {
  BACKLOG = 'BACKLOG', // Added for clarity if needed, though usually handled by sprintId=null
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  QA = 'QA', // New Status
  DONE = 'DONE',
}

// ============================================================
// ORGANIZATION-LEVEL ROLES (Global within an organization)
// ============================================================
export enum OrgRole {
  FOUNDER = 'Founder',       // Super admin - full control, billing, delete org
  ADMIN = 'Admin',           // CTO/CAO/PMO - create workspaces, manage projects
  MANAGER = 'Manager',       // PM/Lead - create sprints, tasks, assign members
  MEMBER = 'Member',         // Developer, Designer - work on tasks
  VIEWER = 'Viewer'          // Read-only access
}

// ============================================================
// WORKSPACE-LEVEL ROLES (Override org roles at workspace level)
// ============================================================
export enum WorkspaceRole {
  WORKSPACE_ADMIN = 'Workspace Admin',
  WORKSPACE_MANAGER = 'Workspace Manager',
  WORKSPACE_MEMBER = 'Workspace Member',
  WORKSPACE_VIEWER = 'Workspace Viewer'
}

// ============================================================
// SPACE-LEVEL ROLES (Granular control within spaces)
// ============================================================
export enum SpaceRole {
  SPACE_OWNER = 'Space Owner',
  SPACE_CONTRIBUTOR = 'Space Contributor',
  SPACE_VIEWER = 'Space Viewer'
}

// Legacy UserRole for backward compatibility
export enum UserRole {
  FOUNDER = 'Founder',
  CTO = 'CTO',
  CAO = 'CAO',
  ADMIN = 'Admin',
  TEAM_LEAD = 'Team Lead',
  PRODUCT_MANAGER = 'Product Manager',
  MEMBER = 'Developer',
  DESIGNER = 'Designer',
  QA = 'QA Engineer',
  OPS = 'Operations'
}

export enum Permission {
  // Organization permissions
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  DELETE_ORGANIZATION = 'DELETE_ORGANIZATION',
  MANAGE_BILLING = 'MANAGE_BILLING',
  TRANSFER_OWNERSHIP = 'TRANSFER_OWNERSHIP',
  INVITE_TO_ORG = 'INVITE_TO_ORG',
  REMOVE_FROM_ORG = 'REMOVE_FROM_ORG',
  
  // Workspace permissions
  CREATE_WORKSPACE = 'CREATE_WORKSPACE',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE',
  EDIT_WORKSPACE = 'EDIT_WORKSPACE',
  MANAGE_WORKSPACE_SETTINGS = 'MANAGE_WORKSPACE_SETTINGS',
  INVITE_TO_WORKSPACE = 'INVITE_TO_WORKSPACE',
  REMOVE_FROM_WORKSPACE = 'REMOVE_FROM_WORKSPACE',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  
  // Project permissions
  CREATE_PROJECT = 'CREATE_PROJECT',
  EDIT_PROJECT = 'EDIT_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  MANAGE_ACCESS = 'MANAGE_ACCESS',
  
  // Space permissions
  CREATE_SPACE = 'CREATE_SPACE',
  EDIT_SPACE = 'EDIT_SPACE',
  DELETE_SPACE = 'DELETE_SPACE',
  INVITE_TO_SPACE = 'INVITE_TO_SPACE',
  REMOVE_FROM_SPACE = 'REMOVE_FROM_SPACE',
  
  // Sprint/Epic/Task permissions
  CREATE_SPRINT = 'CREATE_SPRINT',
  MANAGE_SPRINT = 'MANAGE_SPRINT',
  CREATE_EPIC = 'CREATE_EPIC',
  CREATE_TASK = 'CREATE_TASK',
  EDIT_TASK = 'EDIT_TASK',
  DELETE_TASK = 'DELETE_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS',
  MANAGE_TEAMS = 'MANAGE_TEAMS',
  
  MANAGE_ROADMAP = 'MANAGE_ROADMAP',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_ONLY = 'VIEW_ONLY'
}

// ============================================================
// ORGANIZATION (Company/Tenant)
// ============================================================
export interface Organization {
  id: string;
  name: string;
  slug: string;              // URL-friendly identifier
  ownerId: string;           // Founder's user ID
  logo?: string;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
  billingEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

// User's membership in an organization
export interface OrgMember {
  id?: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
  invitedBy?: string;
}

// User's membership in a workspace
export interface WorkspaceMember {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  invitedBy?: string;
}

// ============================================================
// INVITE SYSTEM
// ============================================================
export type InviteType = 'organization' | 'workspace' | 'space';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Invite {
  id: string;
  email: string;
  type: InviteType;
  targetId: string;          // orgId, workspaceId, or spaceId
  role: string;              // Role to assign upon acceptance
  status: InviteStatus;
  token: string;             // Unique invite token for URL
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  acceptedAt?: string;
}

// ============================================================
// EXISTING ENTITIES (Updated)
// ============================================================
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;              // Legacy global role
  orgIds?: string[];         // Organizations user belongs to
  workspaceIds: string[];
}

export interface Workspace {
  id: string;
  orgId?: string;            // Parent organization (optional for backward compat)
  name: string;
  ownerId: string;
  members: string[];
  description?: string;
  logo?: string;
  colorTheme?: string;
  visibility?: 'private' | 'public';
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  leadId: string;
  type: 'software' | 'marketing' | 'business';
}

export type SpaceType = 'development' | 'frontend' | 'backend' | 'design' | 'qa' | 'marketing' | 'growth' | 'ai_research' | 'general';

export interface Space {
  id: string;
  projectId: string;
  name: string;
  type: SpaceType;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null; // Soft delete
  icon?: string;
  color?: string;
}

export interface SpacePermission {
  id?: string;
  spaceId: string;
  userId: string;
  canView: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageBoard: boolean;
  canManageSprints: boolean;
  canEditSpace: boolean;
  canDeleteSpace: boolean;
  canManageMembers: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default permissions by role
export const DEFAULT_SPACE_PERMISSIONS: Record<UserRole, Partial<SpacePermission>> = {
  [UserRole.FOUNDER]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: true,
    canDeleteSpace: true,
    canManageMembers: true
  },
  [UserRole.CTO]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: true,
    canDeleteSpace: false,
    canManageMembers: true
  },
  [UserRole.CAO]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: true,
    canDeleteSpace: false,
    canManageMembers: true
  },
  [UserRole.ADMIN]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.TEAM_LEAD]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.PRODUCT_MANAGER]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: true,
    canManageSprints: true,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.MEMBER]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: false,
    canManageSprints: false,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.DESIGNER]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: false,
    canDeleteTasks: false,
    canManageBoard: false,
    canManageSprints: false,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.QA]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: false,
    canManageSprints: false,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  },
  [UserRole.OPS]: {
    canView: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageBoard: false,
    canManageSprints: false,
    canEditSpace: false,
    canDeleteSpace: false,
    canManageMembers: false
  }
};

// Space member with role info
export interface SpaceMember {
  userId: string;
  spaceId: string;
  addedAt: string;
  addedBy: string;
}

export interface Team {
  id: string;
  name: string;
  workspaceId: string;
  members: string[];
  leadId: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'PLANNED' | 'COMPLETED';
  goal: string;
  capacity?: number;
}

export interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  status: 'PROGRESS' | 'DONE' | 'TODO';
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'ASSIGNMENT' | 'COMMENT' | 'SYSTEM' | 'SPACE_INVITE' | 'PERMISSION_CHANGE' | 'SPRINT_UPDATE' | 'TASK_UPDATE';
  spaceId?: string;
  entityId?: string;
  entityType?: string;
}

export interface Issue {
  id: string;
  projectId: string;
  spaceId?: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  type: IssueType;
  assigneeId?: string;
  reporterId: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  sprintId?: string | null;
  epicId?: string;
  storyPoints?: number;
  subtasks: Subtask[];
  attachments: Attachment[];
}

export interface Activity {
  id: string;
  spaceId: string;
  projectId?: string;
  userId: string;
  action: ActivityAction;
  entityType: 'space' | 'task' | 'sprint' | 'member' | 'permission' | 'board' | 'comment' | 'attachment';
  entityId?: string;
  details: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type ActivityAction = 
  | 'space_created'
  | 'space_updated'
  | 'space_deleted'
  | 'space_restored'
  | 'member_added'
  | 'member_removed'
  | 'permission_updated'
  | 'task_created'
  | 'task_updated'
  | 'task_moved'
  | 'task_deleted'
  | 'task_assigned'
  | 'sprint_started'
  | 'sprint_completed'
  | 'sprint_task_added'
  | 'comment_added'
  | 'attachment_uploaded';

// Sprint velocity per space
export interface SpaceVelocity {
  spaceId: string;
  spaceName: string;
  tasksTotal: number;
  tasksCompleted: number;
  storyPoints: number;
}

export interface ColumnType {
  id: Status;
  title: string;
}

export const COLUMNS: ColumnType[] = [
  { id: Status.TODO, title: 'To Do' },
  { id: Status.IN_PROGRESS, title: 'In Progress' },
  { id: Status.IN_REVIEW, title: 'Review' },
  { id: Status.QA, title: 'QA' }, // Added QA
  { id: Status.DONE, title: 'Done' },
];

export interface PermissionOverride {
  userId: string;
  workspaceId: string;
  permissions: Partial<Record<Permission, boolean>>;
}