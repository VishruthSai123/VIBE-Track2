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
  // ... (Existing permissions)
  CREATE_WORKSPACE = 'CREATE_WORKSPACE',
  DELETE_WORKSPACE = 'DELETE_WORKSPACE',
  MANAGE_WORKSPACE_SETTINGS = 'MANAGE_WORKSPACE_SETTINGS',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  
  CREATE_PROJECT = 'CREATE_PROJECT',
  EDIT_PROJECT = 'EDIT_PROJECT',
  DELETE_PROJECT = 'DELETE_PROJECT',
  MANAGE_ACCESS = 'MANAGE_ACCESS',
  
  CREATE_SPACE = 'CREATE_SPACE',
  EDIT_SPACE = 'EDIT_SPACE',
  DELETE_SPACE = 'DELETE_SPACE',
  
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
  VIEW_ONLY = 'VIEW_ONLY'
}

// ... (Existing Interfaces User, Workspace, Project, etc.)
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string; 
  workspaceIds: string[];
}

export interface Workspace {
  id: string;
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