export type Role =
  | "system_administrator"
  | "wasco_manager"
  | "leakage_officer"
  | "field_technician"
  | "reporter";

export type Permission =
  // User & system management
  | "manage_users"
  | "manage_roles"
  | "manage_system_settings"
  | "monitor_platform"
  // Report management
  | "submit_report"
  | "view_own_reports"
  | "view_all_reports"
  | "assign_report"
  | "review_report"
  | "investigate_report"
  | "update_report"
  | "approve_resolution"
  | "close_report"
  // Field work
  | "view_assigned_reports"
  | "record_findings"
  | "upload_photos"
  | "update_repair_progress"
  | "mark_complete"
  // Notifications & reporting
  | "receive_notifications"
  | "view_statistics"
  | "view_reports_dashboard";

export interface RoleDefinition {
  role: Role;
  label: string;
  description: string;
  permissions: Permission[];
}
