import { UserRole, Permission, OrgRole, WorkspaceRole, SpaceRole } from '../types';

// ============================================================
// ORGANIZATION-LEVEL PERMISSIONS
// ============================================================
const ORG_ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  [OrgRole.FOUNDER]: Object.values(Permission), // All permissions
  [OrgRole.ADMIN]: [
    Permission.CREATE_WORKSPACE,
    Permission.EDIT_WORKSPACE,
    Permission.DELETE_WORKSPACE,
    Permission.INVITE_TO_ORG,
    Permission.INVITE_TO_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.MANAGE_ROADMAP,
    Permission.VIEW_ANALYTICS,
  ],
  [OrgRole.MANAGER]: [
    Permission.INVITE_TO_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.INVITE_TO_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_ANALYTICS,
  ],
  [OrgRole.MEMBER]: [
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.VIEW_ANALYTICS,
  ],
  [OrgRole.VIEWER]: [
    Permission.VIEW_ONLY,
  ],
};

// ============================================================
// WORKSPACE-LEVEL PERMISSIONS (Override org-level)
// ============================================================
const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WorkspaceRole.WORKSPACE_ADMIN]: [
    Permission.EDIT_WORKSPACE,
    Permission.INVITE_TO_WORKSPACE,
    Permission.REMOVE_FROM_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.DELETE_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_ANALYTICS,
  ],
  [WorkspaceRole.WORKSPACE_MANAGER]: [
    Permission.INVITE_TO_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
  ],
  [WorkspaceRole.WORKSPACE_MEMBER]: [
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [WorkspaceRole.WORKSPACE_VIEWER]: [
    Permission.VIEW_ONLY,
  ],
};

// ============================================================
// SPACE-LEVEL PERMISSIONS (Most granular)
// ============================================================
const SPACE_ROLE_PERMISSIONS: Record<SpaceRole, Permission[]> = {
  [SpaceRole.SPACE_OWNER]: [
    Permission.EDIT_SPACE,
    Permission.DELETE_SPACE,
    Permission.INVITE_TO_SPACE,
    Permission.REMOVE_FROM_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [SpaceRole.SPACE_CONTRIBUTOR]: [
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [SpaceRole.SPACE_VIEWER]: [
    Permission.VIEW_ONLY,
  ],
};

// Legacy Role Definitions (for backward compatibility)
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.FOUNDER]: Object.values(Permission), // All permissions
  [UserRole.CTO]: [
    Permission.CREATE_WORKSPACE,
    Permission.EDIT_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.MANAGE_ROADMAP,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.CAO]: [
    Permission.CREATE_WORKSPACE,
    Permission.EDIT_WORKSPACE,
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.MANAGE_ROADMAP,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_PROJECT,
    Permission.EDIT_PROJECT,
    Permission.CREATE_SPACE,
    Permission.EDIT_SPACE,
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
  ],
  [UserRole.PRODUCT_MANAGER]: [
    Permission.CREATE_SPRINT,
    Permission.MANAGE_SPRINT,
    Permission.CREATE_EPIC,
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
    Permission.MANAGE_TEAMS,
    Permission.MANAGE_ROADMAP,
  ],
  [UserRole.TEAM_LEAD]: [
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.ASSIGN_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.MEMBER]: [
    Permission.CREATE_TASK,
    Permission.EDIT_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.DESIGNER]: [
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.QA]: [
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.OPS]: [
    Permission.UPDATE_TASK_STATUS,
  ],
};

// Mock overrides storage (In real app, this comes from DB/Context)
let PERMISSION_OVERRIDES: Record<string, Partial<Record<Permission, boolean>>> = {};

export const setPermissionOverrides = (userId: string, overrides: Partial<Record<Permission, boolean>>) => {
    PERMISSION_OVERRIDES[userId] = overrides;
};

export const clearPermissionOverrides = (userId: string) => {
    delete PERMISSION_OVERRIDES[userId];
};

// ============================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================

// Check organization-level permission
export const hasOrgPermission = (orgRole: OrgRole, permission: Permission): boolean => {
  if (orgRole === OrgRole.FOUNDER) return true;
  return ORG_ROLE_PERMISSIONS[orgRole]?.includes(permission) || false;
};

// Check workspace-level permission
export const hasWorkspacePermission = (workspaceRole: WorkspaceRole, permission: Permission): boolean => {
  return WORKSPACE_ROLE_PERMISSIONS[workspaceRole]?.includes(permission) || false;
};

// Check space-level permission
export const hasSpacePermission = (spaceRole: SpaceRole, permission: Permission): boolean => {
  return SPACE_ROLE_PERMISSIONS[spaceRole]?.includes(permission) || false;
};

// Legacy function for backward compatibility
export const hasPermission = (userRole: string, permission: Permission, userId?: string): boolean => {
  // 1. Founder Override (God Mode)
  if (userRole === UserRole.FOUNDER || userRole === OrgRole.FOUNDER) return true;

  // 2. Specific User Overrides (Granular Control)
  if (userId && PERMISSION_OVERRIDES[userId] && PERMISSION_OVERRIDES[userId][permission] !== undefined) {
      return PERMISSION_OVERRIDES[userId][permission]!;
  }

  // 3. Check new org roles first
  if (Object.values(OrgRole).includes(userRole as OrgRole)) {
    return hasOrgPermission(userRole as OrgRole, permission);
  }

  // 4. Check workspace roles
  if (Object.values(WorkspaceRole).includes(userRole as WorkspaceRole)) {
    return hasWorkspacePermission(userRole as WorkspaceRole, permission);
  }

  // 5. Check space roles
  if (Object.values(SpaceRole).includes(userRole as SpaceRole)) {
    return hasSpacePermission(userRole as SpaceRole, permission);
  }

  // 6. Legacy role-based defaults
  const role = Object.values(UserRole).find(r => r === userRole) || UserRole.MEMBER;
  const allowedPermissions = ROLE_PERMISSIONS[role] || [];

  return allowedPermissions.includes(permission);
};

// Combined permission check with hierarchy
export interface PermissionContext {
  orgRole?: OrgRole;
  workspaceRole?: WorkspaceRole;
  spaceRole?: SpaceRole;
  userId?: string;
}

export const checkPermissionWithContext = (
  permission: Permission, 
  context: PermissionContext
): boolean => {
  const { orgRole, workspaceRole, spaceRole, userId } = context;

  // 1. User-specific overrides always take precedence
  if (userId && PERMISSION_OVERRIDES[userId]?.[permission] !== undefined) {
    return PERMISSION_OVERRIDES[userId][permission]!;
  }

  // 2. Founder always has full access
  if (orgRole === OrgRole.FOUNDER) return true;

  // 3. Check space-level first (most specific)
  if (spaceRole && hasSpacePermission(spaceRole, permission)) return true;

  // 4. Check workspace-level
  if (workspaceRole && hasWorkspacePermission(workspaceRole, permission)) return true;

  // 5. Check org-level (least specific)
  if (orgRole && hasOrgPermission(orgRole, permission)) return true;

  return false;
};