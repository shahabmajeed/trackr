import {
  Bug, Bookmark, CheckSquare, Zap, CornerDownRight,
  ChevronsUp, ArrowUp, Minus, ArrowDown, ChevronsDown,
} from "lucide-react";

export const C = {
  primary: "#0C66E4",
  primaryHover: "#0055CC",
  primarySoft: "#E9F2FF",
  bg: "#F7F8F9",
  panel: "#FFFFFF",
  border: "#DCDFE4",
  borderStrong: "#B6C2CF",
  text: "#172B4D",
  subtle: "#44546F",
  faint: "#8590A2",
  danger: "#E2483D",
  todoBg: "#DCDFE4", todoText: "#44546F",
  reopenBg: "#FFF7D6", reopenText: "#946F00",
  progBg: "#DEEBFF", progText: "#0C66E4",
  doneBg: "#E3FCEF", doneText: "#216E4E",
  bug: "#E2483D", story: "#2ABB7F", task: "#4BADE8", epic: "#8F7EE7",
};

/** Four fixed statuses every project starts with (cannot be removed). */
export const DEFAULT_STATUSES = [
  { label: "To Do", bg: C.todoBg, text_color: C.todoText, is_fixed: true, sort_order: 0 },
  { label: "Reopen", bg: C.reopenBg, text_color: C.reopenText, is_fixed: true, sort_order: 1 },
  { label: "In Progress", bg: C.progBg, text_color: C.progText, is_fixed: true, sort_order: 2 },
  { label: "Done", bg: C.doneBg, text_color: C.doneText, is_fixed: true, sort_order: 3 },
];

/** Pick readable text color for a hex background. */
export function contrastText(bg) {
  const hex = (bg || "#DCDFE4").replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#172B4D" : "#FFFFFF";
}

export const STATUS_COLOR_PRESETS = [
  "#DCDFE4", "#FFF7D6", "#DEEBFF", "#E3FCEF", "#EAE6FF",
  "#FFECF8", "#CCF5F3", "#FFE2D9", "#FFEBE6", "#E6FCFF",
];

export const TYPES = {
  epic: { label: "Epic", icon: Zap, color: C.epic },
  story: { label: "Story", icon: Bookmark, color: C.story },
  task: { label: "Task", icon: CheckSquare, color: C.task },
  bug: { label: "Bug", icon: Bug, color: C.bug },
  subtask: { label: "Subtask", icon: CornerDownRight, color: C.faint },
};

export const PRIORITIES = {
  highest: { label: "Highest", icon: ChevronsUp, color: "#CD1317" },
  high: { label: "High", icon: ArrowUp, color: "#E97F33" },
  medium: { label: "Medium", icon: Minus, color: "#E2B203" },
  low: { label: "Low", icon: ArrowDown, color: "#2ABB7F" },
  lowest: { label: "Lowest", icon: ChevronsDown, color: "#4BADE8" },
};

export const LINK_TYPES = [
  { value: "relates_to", label: "relates to" },
  { value: "blocks", label: "blocks" },
  { value: "is_blocked_by", label: "is blocked by" },
  { value: "duplicates", label: "duplicates" },
  { value: "is_duplicated_by", label: "is duplicated by" },
];

export const AVATAR_COLORS = ["#0C66E4", "#2ABB7F", "#E97F33", "#8F7EE7", "#E2483D", "#00A3BF", "#6554C0"];

export const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

export const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

export const fmtDateRange = (start, end) => {
  if (start && end) return `${fmtDate(start)} – ${fmtDate(end)}`;
  if (start) return `From ${fmtDate(start)}`;
  if (end) return `Until ${fmtDate(end)}`;
  return "No dates set";
};

export const toDateInputValue = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromDateInputValue = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
};

export const defaultEndDateInput = (startStr) => {
  const start = fromDateInputValue(startStr) || Date.now();
  return toDateInputValue(start + 14 * 86400000);
};

export const fmtMinutes = (mins) => {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? `${h}h ` : ""}${m ? `${m}m` : h ? "" : "0m"}`.trim();
};

export const statusMeta = (statuses, id) =>
  statuses.find((s) => s.id === id) || statuses[0];

export const inputStyle = {
  width: "100%",
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: "7px 10px",
  fontSize: 13.5,
  color: C.text,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

export const selStyle = {
  ...inputStyle,
  cursor: "pointer",
};
