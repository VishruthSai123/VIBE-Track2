import { UserRole, Permission } from '../types';

// Base Role Definitions
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.FOUNDER]: Object.values(Permission), // All permissions
  [UserRole.CTO]: [
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
    Permission.EDIT_TASK, // Usually devs can edit their own tasks or tasks in general
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.QA]: [
    Permission.CREATE_TASK, // Bug reports
    Permission.UPDATE_TASK_STATUS,
  ],
  [UserRole.OPS]: [
    Permission.UPDATE_TASK_STATUS,
  ],
  // Others...
};

// Mock overrides storage (In real app, this comes from DB/Context)
let PERMISSION_OVERRIDES: Record<string, Partial<Record<Permission, boolean>>> = {};

export const setPermissionOverrides = (userId: string, overrides: Partial<Record<Permission, boolean>>) => {
    PERMISSION_OVERRIDES[userId] = overrides;
};

export const hasPermission = (userRole: string, permission: Permission, userId?: string): boolean => {
  // 1. Founder Override (God Mode)
  if (userRole === UserRole.FOUNDER) return true;

  // 2. Specific User Overrides (Granular Control)
  if (userId && PERMISSION_OVERRIDES[userId] && PERMISSION_OVERRIDES[userId][permission] !== undefined) {
      return PERMISSION_OVERRIDES[userId][permission]!;
  }

  // 3. Role-based Defaults
  const role = Object.values(UserRole).find(r => r === userRole) || UserRole.MEMBER;
  const allowedPermissions = ROLE_PERMISSIONS[role] || [];

  return allowedPermissions.includes(permission);
};