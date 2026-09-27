import type { Role, Permission, RoleDefinition } from "@/types/roles";

export const ROLES: RoleDefinition[] = [
  {
    role: "system_administrator",
    label: "System Administrator",
    description:
      "Manage users, roles, system settings, and monitor the overall platform.",
    permissions: [
      "manage_users",
      "manage_roles",
      "manage_system_settings",
      "monitor_platform",
      "view_all_reports",
      "view_statistics",
      "view_reports_dashboard",
    ],
  },
  {
    role: "wasco_manager",
    label: "WASCO Manager",
    description:
      "View all leakage cases, assign cases, monitor progress, approve/verify resolutions, and view reports.",
    permissions: [
      "view_all_reports",
      "assign_report",
      "approve_resolution",
      "close_report",
      "view_statistics",
      "view_reports_dashboard",
      "monitor_platform",
    ],
  },
  {
    role: "leakage_officer",
    label: "Leakage Officer",
    description:
      "Review reported leaks, investigate cases, update information, and assign/coordinate repairs.",
    permissions: [
      "view_all_reports",
      "review_report",
      "investigate_report",
      "update_report",
      "assign_report",
      "upload_photos",
      "view_reports_dashboard",
    ],
  },
  {
    role: "field_technician",
    label: "Field Technician",
    description:
      "View assigned leaks, investigate on-site, record findings, upload photos, update repair progress, and mark work as completed.",
    permissions: [
      "view_assigned_reports",
      "investigate_report",
      "record_findings",
      "upload_photos",
      "update_repair_progress",
      "mark_complete",
    ],
  },
  {
    role: "reporter",
    label: "Reporter / Public User",
    description:
      "Submit leakage reports, provide location/details/photos, view their submitted reports, and receive in-platform notifications.",
    permissions: [
      "submit_report",
      "view_own_reports",
      "upload_photos",
      "receive_notifications",
    ],
  },
];

export const ROLE_MAP = Object.fromEntries(
  ROLES.map((r) => [r.role, r])
) as Record<Role, RoleDefinition>;

/** Check if a role has a specific permission */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_MAP[role]?.permissions.includes(permission) ?? false;
}

/** Get the human-readable label for a role */
export function getRoleLabel(role: Role): string {
  return ROLE_MAP[role]?.label ?? role;
}
