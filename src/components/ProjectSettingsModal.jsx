import { useState, useEffect } from "react";
import { Trash2, UserX, UserCheck, Shield, Pencil } from "lucide-react";
import { C, inputStyle, selStyle, contrastText, STATUS_COLOR_PRESETS } from "../lib/theme";
import { Avatar, Modal, Field } from "./ui";
import StatusIconPicker from "./StatusIconPicker";
import StatusMuiIcon from "./StatusMuiIcon";
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
  onUpdateStatus,
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
  const [statusIcon, setStatusIcon] = useState("Label");
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editStatusLabel, setEditStatusLabel] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("#EAE6FF");
  const [editStatusIcon, setEditStatusIcon] = useState("Label");
  const [busy, setBusy] = useState(false);

  const members = users.filter((u) => project.members.includes(u.id));

  useEffect(() => {
    if (tab !== "workflow") setEditingStatusId(null);
  }, [tab]);

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
    onAddStatus(statusLabel.trim(), { bg: statusColor, text: contrastText(statusColor) }, statusIcon);
    setStatusLabel("");
    setStatusIcon("Label");
  };

  const openEditStatus = (s) => {
    setEditingStatusId(s.id);
    setEditStatusLabel(s.label);
    setEditStatusColor(s.bg || "#EAE6FF");
    setEditStatusIcon(s.icon || "Label");
  };

  const cancelEditStatus = () => {
    setEditingStatusId(null);
    setEditStatusLabel("");
    setEditStatusColor("#EAE6FF");
    setEditStatusIcon("Label");
  };

  const saveEditStatus = async () => {
    if (!editingStatusId || !editStatusLabel.trim() || !caps?.canManageWorkflow) return;
    setBusy(true);
    try {
      await onUpdateStatus(
        editingStatusId,
        editStatusLabel.trim(),
        { bg: editStatusColor, text: contrastText(editStatusColor) },
        editStatusIcon
      );
      cancelEditStatus();
    } finally {
      setBusy(false);
    }
  };

  const applyPresetColor = (hex) => {
    if (editingStatusId) setEditStatusColor(hex);
    else setStatusColor(hex);
  };

  const workflowActionBtn = {
    border: `1px solid ${C.border}`,
    background: "#fff",
    borderRadius: 6,
    padding: 5,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
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
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {project.statuses.map((s) => {
                if (!s.fixed && editingStatusId === s.id) {
                  return (
                    <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 2 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          value={editStatusLabel}
                          onChange={(e) => setEditStatusLabel(e.target.value)}
                          placeholder="Status name"
                          style={{ ...inputStyle, flex: "1 1 120px", minWidth: 120, marginBottom: 0, padding: "5px 10px", fontSize: 13 }}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEditStatus(); }}
                        />
                        <StatusIconPicker value={editStatusIcon} onChange={setEditStatusIcon} preferUp />
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                            border: `1px solid ${C.border}`,
                            borderRadius: 4,
                            padding: "2px 6px",
                            background: "#fff",
                            height: 32,
                            boxSizing: "border-box",
                          }}
                          title="Pick a color"
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 3,
                              background: editStatusColor,
                              border: `1px solid ${C.borderStrong}`,
                              flexShrink: 0,
                            }}
                          />
                          <input
                            type="color"
                            value={editStatusColor.length === 7 ? editStatusColor : "#EAE6FF"}
                            onChange={(e) => setEditStatusColor(e.target.value)}
                            style={{ width: 24, height: 24, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={saveEditStatus}
                          disabled={busy || !editStatusLabel.trim()}
                          style={{
                            background: C.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "0 10px",
                            height: 32,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: busy ? "default" : "pointer",
                            opacity: busy || !editStatusLabel.trim() ? 0.6 : 1,
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditStatus}
                          style={{
                            background: "#fff",
                            color: C.subtle,
                            border: `1px solid ${C.border}`,
                            borderRadius: 4,
                            padding: "0 10px",
                            height: 32,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: editStatusColor,
                          minHeight: 28,
                        }}
                      >
                        <StatusMuiIcon name={editStatusIcon} size={16} color={contrastText(editStatusColor)} />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: contrastText(editStatusColor), lineHeight: 1.2 }}>
                          {editStatusLabel.trim() || "Preview"}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: s.bg,
                        minHeight: 28,
                      }}
                    >
                      <StatusMuiIcon status={s} size={16} color={s.text} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: s.text, lineHeight: 1.2 }}>{s.label}</span>
                    </div>
                    {s.fixed ? (
                      <span title="This status can't be edited or removed" style={{ fontSize: 10.5, color: C.faint, paddingRight: 2, flexShrink: 0 }}>fixed</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          title="Edit status"
                          onClick={() => openEditStatus(s)}
                          style={workflowActionBtn}
                        >
                          <Pencil size={13} color={C.faint} />
                        </button>
                        <button
                          type="button"
                          title="Remove status"
                          onClick={() => {
                            if (editingStatusId === s.id) cancelEditStatus();
                            onDeleteStatus(s.id);
                          }}
                          style={workflowActionBtn}
                        >
                          <Trash2 size={13} color={C.faint} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={statusLabel}
                onChange={(e) => setStatusLabel(e.target.value)}
                placeholder="e.g. In Review"
                style={{ ...inputStyle, flex: "1 1 140px", minWidth: 140, marginBottom: 0, padding: "5px 10px", fontSize: 13 }}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomStatus(); }}
              />
              <StatusIconPicker value={statusIcon} onChange={setStatusIcon} preferUp />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  background: "#fff",
                  height: 32,
                  boxSizing: "border-box",
                }}
                title="Pick a color"
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    background: statusColor,
                    border: `1px solid ${C.borderStrong}`,
                    flexShrink: 0,
                  }}
                />
                <input
                  type="color"
                  value={statusColor.length === 7 ? statusColor : "#EAE6FF"}
                  onChange={(e) => setStatusColor(e.target.value)}
                  style={{ width: 24, height: 24, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
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
                  height: 32,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
              {STATUS_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => applyPresetColor(hex)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: hex,
                    cursor: "pointer",
                    border:
                      (editingStatusId ? editStatusColor : statusColor).toLowerCase() === hex.toLowerCase()
                        ? `2px solid ${C.primary}`
                        : `1px solid ${C.border}`,
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>
              To Do, Reopen, In Progress, and Done are fixed. Custom statuses can be edited or removed.
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}
