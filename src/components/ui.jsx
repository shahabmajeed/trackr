import { UserCircle2 } from "lucide-react";
import { C, avatarColor, initials } from "../lib/theme";

export function Avatar({ user, size = 26 }) {
  if (!user) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "#EBECF0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <UserCircle2 size={size - 6} color={C.faint} />
      </div>
    );
  }
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        title={user.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div title={user.name} style={{
      width: size, height: size, borderRadius: "50%", background: avatarColor(user.name),
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, flexShrink: 0,
    }}>{initials(user.name)}</div>
  );
}

export function Modal({ children, onClose, width = 520 }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(9,30,66,0.45)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 8, width: "100%", maxWidth: width,
        boxShadow: "0 8px 24px rgba(9,30,66,0.2)",
      }}>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.subtle, marginBottom: 5, letterSpacing: 0.2 }}>{label}</div>
      {children}
    </div>
  );
}

export function Chip({ children, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600,
      background: C.primarySoft, color: C.primary, borderRadius: 3, padding: "2px 7px",
    }}>
      {children}
      {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7 }}>×</span>}
    </span>
  );
}

export function IosToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        border: "none",
        padding: 0,
        background: disabled ? C.border : checked ? C.primary : C.border,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.55 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.22)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}
