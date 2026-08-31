import { useState, useEffect } from "react";
import { Trash2, UserX, UserCheck, Shield, Pencil } from "lucide-react";
import { C, inputStyle, selStyle, contrastText, STATUS_COLOR_PRESETS } from "../lib/theme";
import { Avatar, Modal, Field } from "./ui";
import PrivilegesPanel from "./PrivilegesPanel";
import {
  ROLES,
  normalizeRole,
  isSuperAdminRole,
  countSuperAdmins,
  canEditMemberRole,
  assignableRolesForEditor,
  inviteRolesForEditor,
  canInactiveMember,
  canRemoveMember,
  resolveRoleDefaults,
  mergeMemberPrivileges,
  defaultPrivilegesForRole,
  displayRoleName,
  getProjectCustomRoleLabel,
} from "../lib/privileges";

const ROLE_BADGE = {
  super_admin: { bg: "#EAE6FF", color: "#6554C0" },
  admin: { bg: "#E3FCEF", color: "#216E4E" },
  manager: { bg: "#DEEBFF", color: "#0C66E4" },
  developer: { bg: "#E3FCEF", color: "#216E4E" },
  custom: { bg: "#F1F2F4", color: "#44546F" },
};

const OWNER_BADGE = { bg: "#FFF7D6", color: "#946200" };

function TabBtn({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent",
        padding: "10px 2px",
        marginRight: 18,
        fontSize: 13,
        fontWeight: 700,
        color: active ? C.primary : C.subtle,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default function ProjectSettingsModal({
  project,
  users,
  caps,
  currentUserId,
  onClose,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onSetMemberStatus,
  onUpdateRoleDefaults,
  onAddStatus,
  onDeleteStatus,
  error,
}) {
  const [tab, setTab] = useState("members");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [inviteRoleLabel, setInviteRoleLabel] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState("developer");
  const [editRoleLabel, setEditRoleLabel] = useState("");
  const [editPrivileges, setEditPrivileges] = useState({});
  const [defaultsRole, setDefaultsRole] = useState("developer");
  const [defaultsPriv, setDefaultsPriv] = useState({});
  const [defaultsCustomLabel, setDefaultsCustomLabel] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [statusColor, setStatusColor] = useState("#EAE6FF");
  const [busy, setBusy] = useState(false);

  const members = users.filter((u) => project.members.includes(u.id));

  const superAdminCount = countSuperAdmins(project, members.map((u) => u.id));
  const editableRoles = assignableRolesForEditor(caps);
  const invitableRoles = inviteRolesForEditor(caps);

  const canEditThisMember = (userId, memberRole, status) => {
    if (status !== "active") return false;
    return canEditMemberRole(caps, currentUserId, userId, memberRole, superAdminCount);
  };

  const canInactiveThisMember = (userId, memberRole) =>
    canInactiveMember(caps, currentUserId, userId, memberRole, superAdminCount);

  const canRemoveThisMember = (userId, memberRole) =>
    canRemoveMember(caps, currentUserId, userId, memberRole, superAdminCount);

  const openEditMember = (userId) => {
    const rec = project.memberRecords?.[userId] || {
      role: project.memberRoles?.[userId] || "developer",
      status: project.memberStatus?.[userId] || "active",
      privileges: project.memberPrivileges?.[userId] || {},
    };
    const normalized = normalizeRole(rec.role);
    const demotableSuperAdmin =
      isSuperAdminRole(normalized) && superAdminCount > 1;
    setEditingUserId(userId);
    setEditRole(demotableSuperAdmin ? "admin" : normalized);
    setEditRoleLabel(rec.roleLabel || project.memberRoleLabels?.[userId] || "");
    setEditPrivileges(
      demotableSuperAdmin
        ? resolveRoleDefaults(project, "admin")
        : mergeMemberPrivileges(project, rec)
    );
    setTab("members");
  };

  const openDefaults = (role) => {
    setDefaultsRole(role);
    setDefaultsPriv(resolveRoleDefaults(project, role));
    if (role === "custom") {
      setDefaultsCustomLabel(getProjectCustomRoleLabel(project));
    }
    setTab("defaults");
  };

  useEffect(() => {
    if (tab === "defaults") {
      setDefaultsPriv(resolveRoleDefaults(project, defaultsRole));
      if (defaultsRole === "custom") {
        setDefaultsCustomLabel(getProjectCustomRoleLabel(project));
      }
    }
  }, [tab, defaultsRole, project.roleDefaults, project.id]);

  const saveMemberEdit = async () => {
    if (!editingUserId) return;
    const memberRole =
      project.memberRecords?.[editingUserId]?.role || project.memberRoles?.[editingUserId];
    if (!canEditMemberRole(caps, currentUserId, editingUserId, memberRole, superAdminCount)) {
      return;
    }
    const nextRole = normalizeRole(editRole);
    if (nextRole !== "super_admin" && !editableRoles.includes(nextRole)) return;
    setBusy(true);
    try {
      const overrides =
        ["custom", "manager", "admin"].includes(normalizeRole(editRole))
          ? editPrivileges
          : {};
      await onUpdateMember(editingUserId, {
        role: editRole,
        privileges: normalizeRole(editRole) === "super_admin" ? {} : overrides,
        roleLabel: normalizeRole(editRole) === "custom" ? editRoleLabel.trim() : "",
      });
      setEditingUserId(null);
    } finally {
      setBusy(false);
    }
  };

  const saveDefaults = async () => {
    setBusy(true);
    try {
      const next = {
        ...project.roleDefaults,
        [defaultsRole]: defaultsPriv,
      };
      if (defaultsRole === "custom") {
        next.custom_label = defaultsCustomLabel.trim();
      }
      await onUpdateRoleDefaults(next);
    } finally {
      setBusy(false);
    }
  };

  const addCustomStatus = () => {
    if (!statusLabel.trim() || !caps?.canManageWorkflow) return;
    onAddStatus(statusLabel.trim(), { bg: statusColor, text: contrastText(statusColor) });
    setStatusLabel("");
  };

  const invite = () => {
    if (!email.trim() || !caps?.canInviteMembers) return;
    const priv =
      inviteRole === "custom"
        ? resolveRoleDefaults(project, "custom")
        : {};
    const roleLabel =
      inviteRole === "custom"
        ? inviteRoleLabel.trim() || getProjectCustomRoleLabel(project)
        : "";
    onAddMember(email.trim(), { role: inviteRole, privileges: priv, roleLabel });
    setEmail("");
    setInviteRoleLabel("");
  };

  return (
    <Modal onClose={onClose} width={620}>
      <div style={{ padding: "18px 22px 0" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: C.text }}>
          {project.name} settings
        </h2>
        <div style={{ fontSize: 12.5, color: C.faint, marginBottom: 12 }}>Key: {project.key}</div>

        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          <TabBtn id="members" label="Members" active={tab === "members"} onClick={setTab} />
          {caps?.isSuperAdmin && (
            <TabBtn id="defaults" label="Role defaults" active={tab === "defaults"} onClick={() => openDefaults("developer")} />
          )}
          {caps?.canManageWorkflow && (
            <TabBtn id="workflow" label="Workflow" active={tab === "workflow"} onClick={setTab} />
          )}
        </div>
      </div>

      <div style={{ padding: "16px 22px 22px", maxHeight: "70vh", overflowY: "auto" }}>
        {tab === "members" && (
          <>
            <Field label="Team members">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((u) => {
                  const rec = project.memberRecords?.[u.id] || {};
                  const role = normalizeRole(rec.role || project.memberRoles?.[u.id]);
                  const status = rec.status || project.memberStatus?.[u.id] || "active";
                  const badge = ROLE_BADGE[role] || ROLE_BADGE.custom;
                  const memberIsSuperAdmin = isSuperAdminRole(role);
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: status === "inactive" ? "#FFEBE6" : C.bg,
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <Avatar user={u} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: C.faint }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {displayRoleName(role, rec.roleLabel || project.memberRoleLabels?.[u.id], project)}
                        </span>
                        {project.ownerId === u.id && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: OWNER_BADGE.bg,
                              color: OWNER_BADGE.color,
                              border: `1px solid #E8C547`,
                            }}
                          >
                            Owner
                          </span>
                        )}
                      </div>
                      {status === "inactive" && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.danger }}>Inactive</span>
                      )}
                      {canEditThisMember(u.id, role, status) && (
                        <button
                          type="button"
                          title="Edit role & privileges"
                          onClick={() => openEditMember(u.id)}
                          style={{
                            border: `1px solid ${C.border}`,
                            background: "#fff",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            color: C.subtle,
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canInactiveThisMember(u.id, role) && (
                        <button
                          type="button"
                          title={status === "inactive" ? "Reactivate" : "Inactive"}
                          onClick={() =>
                            onSetMemberStatus(u.id, status === "inactive" ? "active" : "inactive")
                          }
                          style={{
                            border: `1px solid ${C.border}`,
                            background: "#fff",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            color: status === "inactive" ? C.primary : C.subtle,
                          }}
                        >
                          {status === "inactive" ? <UserCheck size={14} /> : <UserX size={14} />}
                        </button>
                      )}
                      {canRemoveThisMember(u.id, role) && (
                        <button
                          type="button"
                          title="Remove from project"
                          onClick={() => onRemoveMember(u.id)}
                          style={{
                            border: `1px solid ${C.border}`,
                            background: "#fff",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            color: C.danger,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {caps?.canPromoteSuperAdmin && !memberIsSuperAdmin && (
                        <button
                          type="button"
                          title={superAdminCount > 0 ? "Transfer Super Admin" : "Make Super Admin"}
                          onClick={() => onUpdateMember(u.id, { role: "super_admin", privileges: {} })}
                          style={{
                            border: `1px solid ${C.border}`,
                            background: "#fff",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            color: "#6554C0",
                          }}
                        >
                          <Shield size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>

            {caps?.canInviteMembers && (
              <Field label="Invite by email">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    style={{ ...inputStyle, flex: "1 1 160px", marginBottom: 0 }}
                    onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{ ...selStyle, width: "auto", marginBottom: 0 }}
                  >
                    {invitableRoles.map((r) => (
                      <option key={r} value={r}>{ROLES[r]?.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={invite}
                    style={{
                      background: C.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
                {inviteRole === "custom" && (
                  <input
                    style={{ ...inputStyle, marginTop: 8 }}
                    value={inviteRoleLabel}
                    onChange={(e) => setInviteRoleLabel(e.target.value)}
                    placeholder="Role name — e.g. QA, Tester, Customer, SEO"
                  />
                )}
                {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 6 }}>{error}</div>}
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>
                  Only people who already have a Trackr account can be added.
                </div>
              </Field>
            )}

            {editingUserId && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: C.text }}>
                  Edit member
                </div>
                {editingUserId &&
                  isSuperAdminRole(
                    project.memberRecords?.[editingUserId]?.role ||
                      project.memberRoles?.[editingUserId]
                  ) &&
                  superAdminCount > 1 && (
                    <div style={{ fontSize: 12.5, color: C.subtle, marginBottom: 10 }}>
                      Currently Super Admin — choose a new role below.
                    </div>
                  )}
                <Field label="Role">
                  <select
                    style={selStyle}
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value;
                      setEditRole(r);
                      if (r === "super_admin") {
                        setEditPrivileges(defaultPrivilegesForRole("super_admin"));
                      } else {
                        setEditPrivileges(resolveRoleDefaults(project, r));
                      }
                    }}
                  >
                {editableRoles.map((r) => (
                  <option key={r} value={r}>{ROLES[r]?.label}</option>
                ))}
                {caps?.isSuperAdmin && superAdminCount === 0 && (
                  <option value="super_admin">{ROLES.super_admin.label}</option>
                )}
                  </select>
                </Field>
                {editRole === "custom" && (
                  <Field label="Role name">
                    <input
                      style={inputStyle}
                      value={editRoleLabel}
                      onChange={(e) => setEditRoleLabel(e.target.value)}
                      placeholder="e.g. QA, Tester, Customer, SEO"
                    />
                  </Field>
                )}
                <PrivilegesPanel
                  role={editRole}
                  privileges={editPrivileges}
                  onChange={setEditPrivileges}
                  disabled={!canEditMemberRole(
                    caps,
                    currentUserId,
                    editingUserId,
                    project.memberRecords?.[editingUserId]?.role ||
                      project.memberRoles?.[editingUserId],
                    superAdminCount
                  )}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditingUserId(null)}
                    style={{
                      flex: 1,
                      border: `1px solid ${C.border}`,
                      background: "#fff",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      color: C.subtle,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveMemberEdit}
                    style={{
                      flex: 1,
                      border: "none",
                      background: C.primary,
                      color: "#fff",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Save member
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "defaults" && caps?.isSuperAdmin && (
          <>
            <Field label="Role template">
              <select
                style={selStyle}
                value={defaultsRole}
                onChange={(e) => openDefaults(e.target.value)}
              >
                {["admin", "manager", "developer", "custom"].map((r) => (
                  <option key={r} value={r}>{ROLES[r]?.label}</option>
                ))}
              </select>
            </Field>
            {defaultsRole === "custom" && (
              <Field label="Role name">
                <input
                  style={inputStyle}
                  value={defaultsCustomLabel}
                  onChange={(e) => setDefaultsCustomLabel(e.target.value)}
                  placeholder="e.g. QA, Tester, Customer, SEO"
                />
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>
                  Default label for new Custom members on this project.
                </div>
              </Field>
            )}
            <PrivilegesPanel
              role={defaultsRole}
              privileges={defaultsPriv}
              onChange={setDefaultsPriv}
              showRoleNote
              customLabel={defaultsRole === "custom" ? defaultsCustomLabel : ""}
            />
            <button
              type="button"
              disabled={busy}
              onClick={saveDefaults}
              style={{
                marginTop: 12,
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Save role defaults
            </button>
          </>
        )}

        {tab === "workflow" && caps?.canManageWorkflow && (
          <Field label="Workflow statuses">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {project.statuses.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      background: s.bg,
                      color: s.text,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 4,
                      flex: 1,
                    }}
                  >
                    {s.label}
                  </span>
                  {s.fixed ? (
                    <span title="This status can't be removed" style={{ fontSize: 11, color: C.faint }}>fixed</span>
                  ) : (
                    <Trash2
                      size={14}
                      color={C.faint}
                      style={{ cursor: "pointer" }}
                      onClick={() => onDeleteStatus(s.id)}
                      title="Remove status"
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={statusLabel}
                onChange={(e) => setStatusLabel(e.target.value)}
                placeholder="e.g. In Review"
                style={{ ...inputStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomStatus(); }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: "4px 8px",
                  background: "#fff",
                }}
                title="Pick a color"
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: statusColor,
                    border: `1px solid ${C.borderStrong}`,
                    flexShrink: 0,
                  }}
                />
                <input
                  type="color"
                  value={statusColor.length === 7 ? statusColor : "#EAE6FF"}
                  onChange={(e) => setStatusColor(e.target.value)}
                  style={{ width: 28, height: 28, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
                />
              </label>
              <button
                type="button"
                onClick={addCustomStatus}
                style={{
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0 12px",
                  height: 34,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {STATUS_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setStatusColor(hex)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: hex,
                    cursor: "pointer",
                    border:
                      statusColor.toLowerCase() === hex.toLowerCase()
                        ? `2px solid ${C.primary}`
                        : `1px solid ${C.border}`,
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>
              To Do, Reopen, In Progress, and Done are fixed. Add more with any color.
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}
