import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "../lib/theme";

const MENU_RADIUS = 12;
const ITEM_RADIUS = 8;

function itemRadius(index, total) {
  if (total === 1) return ITEM_RADIUS;
  if (index === 0) return `${ITEM_RADIUS}px ${ITEM_RADIUS}px 4px 4px`;
  if (index === total - 1) return `4px 4px ${ITEM_RADIUS}px ${ITEM_RADIUS}px`;
  return 4;
}

export default function ProjectPicker({ projects, value, onChange, sidebar }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const current = projects.find((p) => p.id === value) || projects[0];

  const reposition = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const panelH = panelRef.current?.offsetHeight || 120;
    const panelW = Math.max(rect.width, 220);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelH + 12;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelW - 8);
    const top = openUp ? rect.top - panelH - 6 : rect.bottom + 6;
    setPanelPos({ top, left, width: panelW });
  }, []);

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
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

  useEffect(() => {
    if (!open) setHovered(null);
  }, [open]);

  if (!current) return null;

  return (
    <div ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: `1px solid ${sidebar.border}`,
          borderRadius: 10,
          background: sidebar.surface,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: sidebar.muted, letterSpacing: 0.3, marginBottom: 2 }}>
            Workspace
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: sidebar.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.name}
          </div>
        </div>
        <ChevronDown size={16} color={sidebar.muted} style={{ flexShrink: 0, opacity: 0.85 }} />
      </button>
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            zIndex: 1100,
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: MENU_RADIUS,
            boxShadow: "0 4px 16px rgba(9,30,66,0.12), 0 1px 3px rgba(9,30,66,0.08)",
            padding: 4,
          }}
        >
          {projects.map((p, index) => {
            const active = p.id === value;
            const highlighted = hovered === p.id || active;
            return (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  border: "none",
                  background: highlighted ? C.bg : "transparent",
                  borderRadius: itemRadius(index, projects.length),
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  color: C.text,
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 11.5, color: C.faint }}>{p.key}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
