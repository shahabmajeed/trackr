import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { C, inputStyle } from "../lib/theme";
import { WORKFLOW_ICON_OPTIONS } from "../lib/statusIcons";
import StatusMuiIcon from "./StatusMuiIcon";

const PANEL_WIDTH = 220;

export default function StatusIconPicker({ value, onChange, preferUp = false }) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const reposition = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const panelH = panelRef.current?.offsetHeight || 200;
    const panelW = panelRef.current?.offsetWidth || PANEL_WIDTH;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = preferUp || spaceBelow < panelH + 12;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelW - 8);
    const top = openUp ? rect.top - panelH - 6 : rect.bottom + 6;
    setPanelPos({ top, left });
  }, [preferUp]);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (
        rootRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    const onReflow = () => reposition();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open, reposition]);

  const selected = WORKFLOW_ICON_OPTIONS.find((o) => o.name === value) || WORKFLOW_ICON_OPTIONS[0];

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        title="Status icon"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...inputStyle,
          width: 36,
          height: 32,
          padding: 0,
          marginBottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <StatusMuiIcon name={selected.name} size={18} color={C.subtle} />
      </button>
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 1100,
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(9,30,66,0.12), 0 1px 3px rgba(9,30,66,0.08)",
            padding: 8,
            width: PANEL_WIDTH,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, marginBottom: 6 }}>Icon</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {WORKFLOW_ICON_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                type="button"
                title={opt.label}
                onClick={() => {
                  onChange(opt.name);
                  setOpen(false);
                }}
                style={{
                  border:
                    value === opt.name ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: value === opt.name ? C.primarySoft : "#fff",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StatusMuiIcon name={opt.name} size={18} color={C.subtle} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
