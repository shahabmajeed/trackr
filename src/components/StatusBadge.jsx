import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { C, statusMeta } from "../lib/theme";
import StatusMuiIcon from "./StatusMuiIcon";

const MENU_RADIUS = 12;
const ITEM_RADIUS = 8;

function triggerStyle(meta, compact) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? 4 : 6,
    background: meta.bg,
    color: meta.text,
    border: "none",
    borderRadius: 6,
    fontSize: compact ? 11 : 12.5,
    fontWeight: 700,
    padding: compact ? "3px 8px" : "5px 12px",
    lineHeight: 1.2,
    cursor: "pointer",
    maxWidth: "100%",
    whiteSpace: "nowrap",
  };
}

function itemRadius(index, total) {
  if (total === 1) return ITEM_RADIUS;
  if (index === 0) return `${ITEM_RADIUS}px ${ITEM_RADIUS}px 4px 4px`;
  if (index === total - 1) return `4px 4px ${ITEM_RADIUS}px ${ITEM_RADIUS}px`;
  return 4;
}

/** Read-only status pill with icon (for lists). */
export function StatusPill({ status, statuses, compact = false, style = {} }) {
  const meta = statusMeta(statuses, status) || { bg: C.todoBg, text: C.todoText, label: "?" };
  return (
    <span style={{ ...triggerStyle(meta, compact), cursor: "default", ...style }}>
      <StatusMuiIcon status={meta} size={compact ? 14 : 16} color={meta.text} />
      <span>{meta.label}</span>
    </span>
  );
}

/** Interactive status picker with icons in dropdown. */
export default function StatusBadge({ status, statuses, onChange, compact = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const rootRef = useRef(null);
  const meta = statusMeta(statuses, status) || { bg: C.todoBg, text: C.todoText, label: "?" };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) setHovered(null);
  }, [open]);

  if (disabled || !onChange) {
    return <StatusPill status={status} statuses={statuses} compact={compact} />;
  }

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          ...triggerStyle(meta, compact),
          appearance: "none",
          fontFamily: "inherit",
        }}
      >
        <StatusMuiIcon status={meta} size={compact ? 14 : 16} color={meta.text} />
        <span>{meta.label}</span>
        <ChevronDown size={compact ? 12 : 14} color={meta.text} style={{ opacity: 0.75, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 200,
            maxWidth: 280,
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: MENU_RADIUS,
            boxShadow: "0 4px 16px rgba(9,30,66,0.12), 0 1px 3px rgba(9,30,66,0.08)",
            zIndex: 50,
            padding: 4,
          }}
        >
          {statuses.map((s, index) => {
            const active = s.id === status;
            const highlighted = hovered === s.id || active;
            return (
              <button
                key={s.id}
                type="button"
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(s.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  border: "none",
                  background: highlighted ? C.bg : "transparent",
                  borderRadius: itemRadius(index, statuses.length),
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  color: C.text,
                }}
              >
                <StatusMuiIcon status={s} size={18} color={C.subtle} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
