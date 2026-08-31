import { useState } from "react";
import { C } from "../lib/theme";
import { IosToggle } from "./ui";
import {
  PRIVILEGE_TABS,
  PRIVILEGE_META,
  ROLES,
  isSuperAdminRole,
  isAdminRole,
} from "../lib/privileges";

function PrivilegeRow({ keyId, privileges, onChange, disabled }) {
  const meta = PRIVILEGE_META[keyId];
  if (!meta) return null;
  const parentOff =
    keyId.startsWith("issues.create.") &&
    keyId !== "issues.create" &&
    !privileges["issues.create"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        padding: "12px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{meta.label}</div>
        {meta.hint && (
          <div style={{ fontSize: 12, color: C.faint, marginTop: 2, lineHeight: 1.35 }}>{meta.hint}</div>
        )}
      </div>
      <IosToggle
        checked={Boolean(privileges[keyId])}
        disabled={disabled || parentOff}
        onChange={(v) => onChange(keyId, v)}
      />
    </div>
  );
}

function TabBtn({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent",
        padding: "8px 4px",
        marginRight: 14,
        fontSize: 12.5,
        fontWeight: 700,
        color: active ? C.primary : C.subtle,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function PrivilegesPanel({
  privileges,
  onChange,
  disabled = false,
  role,
  showRoleNote = false,
  customLabel = "",
}) {
  const [tab, setTab] = useState(PRIVILEGE_TABS[0].id);
  const activeTab = PRIVILEGE_TABS.find((t) => t.id === tab) || PRIVILEGE_TABS[0];

  if (isSuperAdminRole(role) || isAdminRole(role)) {
    const label = isSuperAdminRole(role) ? "Super Admins" : "Admins";
    return (
      <div
        style={{
          padding: 16,
          background: C.primarySoft,
          borderRadius: 8,
          fontSize: 13,
          color: C.primary,
          fontWeight: 600,
        }}
      >
        {label} have full access to all privileges.
      </div>
    );
  }

  return (
    <div>
      {showRoleNote && role && (
        <div style={{ fontSize: 12.5, color: C.subtle, marginBottom: 12 }}>
          Defaults for{" "}
          <strong style={{ color: C.text }}>
            {role === "custom" && customLabel.trim()
              ? customLabel.trim()
              : ROLES[role]?.label || role}
          </strong>
          — new members get these unless overridden.
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 4,
          gap: 4,
        }}
      >
        {PRIVILEGE_TABS.map((t) => (
          <TabBtn key={t.id} id={t.id} label={t.label} active={tab === t.id} onClick={setTab} />
        ))}
      </div>
      <div style={{ paddingTop: 4 }}>
        {activeTab.keys.map((keyId) => (
          <PrivilegeRow
            key={keyId}
            keyId={keyId}
            privileges={privileges}
            disabled={disabled}
            onChange={(k, v) => onChange({ ...privileges, [k]: v })}
          />
        ))}
      </div>
    </div>
  );
}
