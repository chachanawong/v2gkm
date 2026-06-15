import type { AdminRole, ResourceType } from "./types";

export type PermissionAction =
  | "View Dashboard"
  | "Manage Users"
  | "Manage Staff"
  | "Manage News"
  | "Manage Knowledge"
  | "Manage Profiles"
  | "Manage Categories"
  | "Manage Events"
  | "Manage Learning"
  | "Publish Content"
  | "Delete Content"
  | "View Audit Logs"
  | "Access Account System";

export const permissionActions: PermissionAction[] = [
  "View Dashboard",
  "Manage Users",
  "Manage Staff",
  "Manage News",
  "Manage Knowledge",
  "Manage Profiles",
  "Manage Categories",
  "Manage Events",
  "Manage Learning",
  "Publish Content",
  "Delete Content",
  "View Audit Logs",
  "Access Account System",
];

export const rolePermissions: Record<AdminRole, PermissionAction[]> = {
  Admin: permissionActions,
  Content: ["Manage News", "Manage Knowledge", "Manage Profiles", "Manage Categories", "Manage Events", "Manage Learning", "Publish Content"],
  Account: ["Manage Users", "Access Account System"],
};

export function hasPermission(role: AdminRole, action: PermissionAction) {
  return rolePermissions[role].includes(action);
}

export function canAccessResource(role: AdminRole, resource: ResourceType | "dashboard" | "account" | "permissions") {
  if (role === "Admin") return true;
  const actionByResource: Partial<Record<ResourceType | "dashboard" | "account" | "permissions", PermissionAction>> = {
    dashboard: "View Dashboard",
    users: "Manage Users",
    admins: "Manage Staff",
    news: "Manage News",
    knowledge: "Manage Knowledge",
    profiles: "Manage Profiles",
    categories: "Manage Categories",
    events: "Manage Events",
    learning_paths: "Manage Learning",
    lessons: "Manage Learning",
    account: "Access Account System",
    permissions: "View Audit Logs",
  };
  const action = actionByResource[resource];
  return action ? hasPermission(role, action) : false;
}
