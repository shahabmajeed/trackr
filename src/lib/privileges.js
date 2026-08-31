/** Project roles and granular privileges (v1). */

export const ROLES = {
  super_admin: { label: "Super Admin", short: "SA" },
  admin: { label: "Admin", short: "ADM" },
  manager: { label: "Manager", short: "MGR" },
  developer: { label: "Developer", short: "DEV" },
  custom: { label: "Custom", short: "Custom" },
};

export const INVITE_ROLES = ["admin", "manager", "developer", "custom"];

/** Roles an Admin may assign when inviting or editing others (not self). */
export const ADMIN_ASSIGNABLE_ROLES = ["manager", "developer", "custom"];

export const PRIVILEGE_META = {
  "scope.view": { label: "View Scope", hint: "Summary, Project, Client, and Files tabs" },
  "scope.edit": { label: "Edit Scope", hint: "Edit brief, client details, and files" },
  "project.edit_meta": { label: "Edit project name & key", hint: "Change title and project key" },
  "members.view": { label: "View members", hint: "See who is on the project" },
  "members.invite": { label: "Invite users", hint: "Add people by email" },
  "members.edit_privileges": { label: "Edit privileges", hint: "Change roles and toggles for others" },
  "issues.create": { label: "Create issues", hint: "Master switch for new issues" },
  "issues.create.epic": { label: "Create epics", hint: "Requires Create issues" },
  "issues.create.story": { label: "Create stories", hint: "Requires Create issues" },
  "issues.create.task": { label: "Create tasks", hint: "Requires Create issues" },
  "issues.create.bug": { label: "Create bugs", hint: "Requires Create issues" },
  "issues.create.subtask": { label: "Create subtasks", hint: "Requires Create issues" },
  "issues.edit": { label: "Edit issues", hint: "Title, description, labels, assignee, etc." },
  "issues.change_status": { label: "Change status", hint: "Move cards on board and backlog" },
  "issues.comment": { label: "Comments", hint: "Add and edit comments" },
  "issues.time_log": { label: "Time logs", hint: "Log, edit, and delete time" },
  "issues.attach": { label: "Attachments", hint: "Upload and remove files on issues" },
  "issues.delete": { label: "Delete issues", hint: "Permanently remove issues" },
  "sprints.view": { label: "View sprints", hint: "See sprint list and boards" },
  "sprints.manage": { label: "Manage sprints", hint: "Create, start, complete, reopen, edit" },
  "workflow.manage": { label: "Manage workflow", hint: "Add or remove custom statuses" },
  "reports.view": { label: "View reports", hint: "Open the Reports tab" },
  "reports.export": { label: "Export reports", hint: "Download or export report data" },
  "settings.open": { label: "Open project settings", hint: "Members, privileges, workflow UI" },
};

export const PRIVILEGE_TABS = [
  { id: "scope", label: "Scope", keys: ["scope.view", "scope.edit", "project.edit_meta"] },
  { id: "members", label: "Members", keys: ["members.view", "members.invite", "members.edit_privileges"] },
  {
    id: "issues",
    label: "Issues",
    keys: [
      "issues.create",
      "issues.create.epic",
      "issues.create.story",
      "issues.create.task",
      "issues.create.bug",
      "issues.create.subtask",
      "issues.edit",
      "issues.change_status",
      "issues.comment",
      "issues.time_log",
      "issues.attach",
      "issues.delete",
    ],
  },
  { id: "sprints", label: "Sprints", keys: ["sprints.view", "sprints.manage"] },
  { id: "workflow", label: "Workflow", keys: ["workflow.manage"] },
  { id: "reports", label: "Reports", keys: ["reports.view", "reports.export"] },
  { id: "settings", label: "Settings", keys: ["settings.open"] },
];

const ALL_KEYS = Object.keys(PRIVILEGE_META);

export function privilegeKeysOnly(obj) {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => ALL_KEYS.includes(k))
  );
}

export function getProjectCustomRoleLabel(project) {
  return String(project?.roleDefaults?.custom_label || "").trim();
}

export function displayRoleName(role, roleLabel, project) {
  const r = normalizeRole(role);
  if (r === "custom") {
    const label = String(roleLabel || "").trim() || getProjectCustomRoleLabel(project);
    return label || ROLES.custom.label;
  }
  return ROLES[r]?.label || role;
}

function allTrue() {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, true]));
}

export function normalizeRole(role) {
  const r = (role || "").toLowerCase();
  if (r === "owner" || r === "super_admin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "manager") return "manager";
  if (r === "custom") return "custom";
  if (r === "member" || r === "developer") return "developer";
  return "developer";
}

export function isSuperAdminRole(role) {
  return normalizeRole(role) === "super_admin";
}

export function isAdminRole(role) {
  return normalizeRole(role) === "admin";
}

export function countSuperAdmins(project, memberIds = []) {
  let n = 0;
  for (const id of memberIds) {
    const r = project?.memberRecords?.[id]?.role || project?.memberRoles?.[id];
    if (isSuperAdminRole(r)) n += 1;
  }
  return n;
}

export function inviteRolesForEditor(caps) {
  if (caps?.isSuperAdmin) return INVITE_ROLES;
  if (caps?.isAdmin) return ADMIN_ASSIGNABLE_ROLES;
  return [];
}

export function assignableRolesForEditor(caps) {
  if (caps?.isSuperAdmin) return ["admin", "manager", "developer", "custom"];
  if (caps?.isAdmin) return ADMIN_ASSIGNABLE_ROLES;
  return [];
}

/** Whether the current user may open role/privilege edit for a target member. */
export function canEditMemberRole(caps, currentUserId, targetUserId, targetMemberRole, superAdminCount) {
  if (!caps?.isSuperAdmin && !caps?.isAdmin) return false;
  if (targetUserId === currentUserId && !caps?.isSuperAdmin) return false;

  const targetRole = normalizeRole(targetMemberRole);

  if (isSuperAdminRole(targetRole)) {
    if (!caps?.isSuperAdmin) return false;
    return superAdminCount > 1;
  }

  if (isAdminRole(targetRole)) return caps?.isSuperAdmin;

  if (caps?.isSuperAdmin) return true;

  return ADMIN_ASSIGNABLE_ROLES.includes(targetRole);
}

/** Whether the current user may inactive or reactivate a target member. */
export function canInactiveMember(caps, currentUserId, targetUserId, targetMemberRole, superAdminCount) {
  if (!caps?.isSuperAdmin && !caps?.isAdmin) return false;
  if (targetUserId === currentUserId) return false;

  const targetRole = normalizeRole(targetMemberRole);

  if (isSuperAdminRole(targetRole)) {
    if (!caps?.isSuperAdmin) return false;
    return superAdminCount > 1;
  }

  if (isAdminRole(targetRole)) return caps?.isSuperAdmin;

  if (caps?.isSuperAdmin) return true;

  return ADMIN_ASSIGNABLE_ROLES.includes(targetRole);
}

/** Whether the current user may remove a target member from the project. */
export function canRemoveMember(caps, currentUserId, targetUserId, targetMemberRole, superAdminCount) {
  return canInactiveMember(caps, currentUserId, targetUserId, targetMemberRole, superAdminCount);
}

export function defaultPrivilegesForRole(role) {
  const r = normalizeRole(role);
  if (r === "super_admin") return allTrue();

  if (r === "admin") return allTrue();

  if (r === "manager") {
    return {
      ...allTrue(),
      "members.edit_privileges": true,
      "members.invite": true,
    };
  }

  if (r === "developer") {
    return {
      "scope.view": true,
      "scope.edit": false,
      "project.edit_meta": false,
      "members.view": false,
      "members.invite": false,
      "members.edit_privileges": false,
      "issues.create": true,
      "issues.create.epic": true,
      "issues.create.story": true,
      "issues.create.task": true,
      "issues.create.bug": true,
      "issues.create.subtask": true,
      "issues.edit": true,
      "issues.change_status": true,
      "issues.comment": true,
      "issues.time_log": true,
      "issues.attach": true,
      "issues.delete": false,
      "sprints.view": true,
      "sprints.manage": false,
      "workflow.manage": false,
      "reports.view": true,
      "reports.export": false,
      "settings.open": false,
    };
  }

  // custom — start minimal, SA fills in
  return {
    "scope.view": true,
    "scope.edit": false,
    "project.edit_meta": false,
    "members.view": false,
    "members.invite": false,
    "members.edit_privileges": false,
    "issues.create": true,
    "issues.create.epic": true,
    "issues.create.story": true,
    "issues.create.task": true,
    "issues.create.bug": true,
    "issues.create.subtask": true,
    "issues.edit": true,
    "issues.change_status": true,
    "issues.comment": true,
    "issues.time_log": true,
    "issues.attach": true,
    "issues.delete": false,
    "sprints.view": true,
    "sprints.manage": false,
    "workflow.manage": false,
    "reports.view": true,
    "reports.export": false,
    "settings.open": false,
  };
}

export function resolveRoleDefaults(project, role) {
  const r = normalizeRole(role);
  const stored = project?.roleDefaults?.[r];
  const base = defaultPrivilegesForRole(r);
  if (!stored || typeof stored !== "object") return { ...base };
  return { ...base, ...privilegeKeysOnly(stored) };
}

export function mergeMemberPrivileges(project, member) {
  const role = normalizeRole(member?.role);
  if (role === "super_admin") return allTrue();
  const base = resolveRoleDefaults(project, role);
  const overrides = member?.privileges || {};
  return { ...base, ...overrides };
}

export function getMemberRecord(project, userId) {
  if (!project || !userId) return null;
  const rec = project.memberRecords?.[userId];
  if (rec) return rec;
  const role = project.memberRoles?.[userId];
  if (!role) return null;
  return {
    role: normalizeRole(role),
    status: project.memberStatus?.[userId] || "active",
    privileges: project.memberPrivileges?.[userId] || {},
    roleLabel: project.memberRoleLabels?.[userId] || "",
  };
}

export function hasPrivilege(privileges, key) {
  if (!privileges) return false;
  if (key.startsWith("issues.create.") && key !== "issues.create") {
    if (!privileges["issues.create"]) return false;
  }
  return Boolean(privileges[key]);
}

export function getProjectCapabilities(project, userId) {
  const member = getMemberRecord(project, userId);
  const isOwner = project?.ownerId === userId;

  if (!member && !isOwner) {
    return inactiveCapabilities(false);
  }

  const role = member ? normalizeRole(member.role) : "super_admin";
  const status = member?.status || "active";

  if (status === "inactive") {
    return inactiveCapabilities(true);
  }

  if (isSuperAdminRole(role) || isOwner) {
    return {
      role: "super_admin",
      status: "active",
      isInactive: false,
      isReadOnly: false,
      isSuperAdmin: true,
      canViewScope: true,
      canEditScope: true,
      canEditProjectMeta: true,
      canViewMembers: true,
      canInviteMembers: true,
      canEditPrivileges: true,
      canRemoveMembers: true,
      canInactiveMembers: true,
      canPromoteSuperAdmin: true,
      canCreateIssue: true,
      canCreateEpic: true,
      canCreateStory: true,
      canCreateTask: true,
      canCreateBug: true,
      canCreateSubtask: true,
      canEditIssue: true,
      canChangeStatus: true,
      canComment: true,
      canTimeLog: true,
      canAttach: true,
      canDeleteIssue: true,
      canManageSprints: true,
      canManageWorkflow: true,
      canViewReports: true,
      canExportReports: true,
      canOpenSettings: true,
    };
  }

  const priv = mergeMemberPrivileges(project, member);

  if (normalizeRole(member.role) === "admin") {
    return {
      role: "admin",
      status: "active",
      isInactive: false,
      isReadOnly: false,
      isSuperAdmin: false,
      isAdmin: true,
      canViewScope: hasPrivilege(priv, "scope.view"),
      canEditScope: hasPrivilege(priv, "scope.edit"),
      canEditProjectMeta: hasPrivilege(priv, "project.edit_meta"),
      canViewMembers: hasPrivilege(priv, "members.view"),
      canInviteMembers: hasPrivilege(priv, "members.invite"),
      canEditPrivileges: hasPrivilege(priv, "members.edit_privileges"),
      canRemoveMembers: true,
      canInactiveMembers: true,
      canPromoteSuperAdmin: false,
      canCreateIssue: hasPrivilege(priv, "issues.create"),
      canCreateEpic: hasPrivilege(priv, "issues.create.epic"),
      canCreateStory: hasPrivilege(priv, "issues.create.story"),
      canCreateTask: hasPrivilege(priv, "issues.create.task"),
      canCreateBug: hasPrivilege(priv, "issues.create.bug"),
      canCreateSubtask: hasPrivilege(priv, "issues.create.subtask"),
      canEditIssue: hasPrivilege(priv, "issues.edit"),
      canChangeStatus: hasPrivilege(priv, "issues.change_status"),
      canComment: hasPrivilege(priv, "issues.comment"),
      canTimeLog: hasPrivilege(priv, "issues.time_log"),
      canAttach: hasPrivilege(priv, "issues.attach"),
      canDeleteIssue: hasPrivilege(priv, "issues.delete"),
      canManageSprints: hasPrivilege(priv, "sprints.manage"),
      canManageWorkflow: hasPrivilege(priv, "workflow.manage"),
      canViewReports: hasPrivilege(priv, "reports.view"),
      canExportReports: hasPrivilege(priv, "reports.export"),
      canOpenSettings: hasPrivilege(priv, "settings.open"),
    };
  }

  return {
    role,
    status: "active",
    isInactive: false,
    isReadOnly: false,
    isSuperAdmin: false,
    canViewScope: hasPrivilege(priv, "scope.view"),
    canEditScope: hasPrivilege(priv, "scope.edit"),
    canEditProjectMeta: hasPrivilege(priv, "project.edit_meta"),
    canViewMembers: hasPrivilege(priv, "members.view"),
    canInviteMembers: hasPrivilege(priv, "members.invite"),
    canEditPrivileges: hasPrivilege(priv, "members.edit_privileges"),
    canRemoveMembers: false,
    canInactiveMembers: false,
    canPromoteSuperAdmin: false,
    canCreateIssue: hasPrivilege(priv, "issues.create"),
    canCreateEpic: hasPrivilege(priv, "issues.create.epic"),
    canCreateStory: hasPrivilege(priv, "issues.create.story"),
    canCreateTask: hasPrivilege(priv, "issues.create.task"),
    canCreateBug: hasPrivilege(priv, "issues.create.bug"),
    canCreateSubtask: hasPrivilege(priv, "issues.create.subtask"),
    canEditIssue: hasPrivilege(priv, "issues.edit"),
    canChangeStatus: hasPrivilege(priv, "issues.change_status"),
    canComment: hasPrivilege(priv, "issues.comment"),
    canTimeLog: hasPrivilege(priv, "issues.time_log"),
    canAttach: hasPrivilege(priv, "issues.attach"),
    canDeleteIssue: hasPrivilege(priv, "issues.delete"),
    canManageSprints: hasPrivilege(priv, "sprints.manage"),
    canManageWorkflow: hasPrivilege(priv, "workflow.manage"),
    canViewReports: hasPrivilege(priv, "reports.view"),
    canExportReports: hasPrivilege(priv, "reports.export"),
    canOpenSettings: hasPrivilege(priv, "settings.open"),
  };
}

function inactiveCapabilities(isMember) {
  return {
    role: null,
    status: "inactive",
    isInactive: isMember,
    isReadOnly: true,
    isSuperAdmin: false,
    canViewScope: isMember,
    canEditScope: false,
    canEditProjectMeta: false,
    canViewMembers: false,
    canInviteMembers: false,
    canEditPrivileges: false,
    canRemoveMembers: false,
    canInactiveMembers: false,
    canPromoteSuperAdmin: false,
    canCreateIssue: false,
    canCreateEpic: false,
    canCreateStory: false,
    canCreateTask: false,
    canCreateBug: false,
    canCreateSubtask: false,
    canEditIssue: false,
    canChangeStatus: false,
    canComment: false,
    canTimeLog: false,
    canAttach: false,
    canDeleteIssue: false,
    canManageSprints: false,
    canManageWorkflow: false,
    canViewReports: isMember,
    canExportReports: false,
    canOpenSettings: false,
  };
}

export function canCreateIssueType(caps, type) {
  if (!caps || caps.isReadOnly) return false;
  if (type === "epic") return caps.canCreateEpic;
  if (type === "story") return caps.canCreateStory;
  if (type === "task") return caps.canCreateTask;
  if (type === "bug") return caps.canCreateBug;
  if (type === "subtask") return caps.canCreateSubtask;
  return caps.canCreateIssue;
}
