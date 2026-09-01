import { LogOut, Settings, LayoutGrid, ListTodo, Rocket, Clock, FileText, Plus, User, ClipboardList } from "lucide-react";
import { Avatar } from "./ui";
import Logo from "./Logo";
import ProjectPicker from "./ProjectPicker";

export const SIDEBAR = {
  bg: "#1C2536",
  surface: "#28323D",
  text: "#F3F4F6",
  muted: "#9DA4AE",
  section: "#6C737F",
  hover: "rgba(255,255,255,0.06)",
  active: "#5C6BC0",
  border: "rgba(255,255,255,0.08)",
};

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: SIDEBAR.section,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        padding: "12px 16px 6px",
      }}
    >
      {children}
    </div>
  );
}

function NavBtn({ active, onClick, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "calc(100% - 24px)",
        margin: "0 12px 2px",
        padding: "9px 12px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13.5,
        fontWeight: 600,
        background: active ? SIDEBAR.active : "transparent",
        color: active ? "#fff" : SIDEBAR.muted,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = SIDEBAR.hover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </button>
  );
}

function MenuBtn({ onClick, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "calc(100% - 24px)",
        margin: "0 12px 2px",
        padding: "8px 12px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        background: "transparent",
        color: SIDEBAR.muted,
        textAlign: "left",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = SIDEBAR.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </button>
  );
}

export default function Sidebar({
  currentUser,
  projects,
  projectId,
  onProjectChange,
  onAddProject,
  onProjectSettings,
  showProjectSettings,
  view,
  onNavigate,
  caps,
  onProfile,
  onSignOut,
}) {
  return (
    <div
      style={{
        width: 240,
        background: SIDEBAR.bg,
        borderRight: `1px solid ${SIDEBAR.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div style={{ padding: "16px 16px 12px" }}>
        <Logo height={36} white />
      </div>

      <button
        type="button"
        onClick={onProfile}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "0 12px 8px",
          padding: "10px 12px",
          border: `1px solid ${SIDEBAR.border}`,
          borderRadius: 10,
          background: SIDEBAR.surface,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          width: "calc(100% - 24px)",
        }}
      >
        <Avatar user={currentUser} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: SIDEBAR.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentUser.name}
          </div>
          <div style={{ fontSize: 11.5, color: SIDEBAR.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentUser.email}
          </div>
        </div>
        <User size={15} color={SIDEBAR.muted} style={{ flexShrink: 0 }} />
      </button>

      <SectionLabel>Workspace</SectionLabel>
      <div style={{ padding: "0 12px 4px" }}>
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={onProjectChange}
          sidebar={SIDEBAR}
        />
      </div>
      <MenuBtn onClick={onAddProject} Icon={Plus} label="Add new project" />
      {showProjectSettings && (
        <MenuBtn onClick={onProjectSettings} Icon={Settings} label="Project settings" />
      )}
      <NavBtn active={view === "myissues"} onClick={() => onNavigate("myissues")} Icon={ClipboardList} label="My issues" />

      <SectionLabel>Overview</SectionLabel>
      <NavBtn active={view === "board"} onClick={() => onNavigate("board")} Icon={LayoutGrid} label="Board" />
      <NavBtn active={view === "backlog"} onClick={() => onNavigate("backlog")} Icon={ListTodo} label="Backlog" />
      <NavBtn active={view === "sprints"} onClick={() => onNavigate("sprints")} Icon={Rocket} label="Sprints" />
      {caps.canViewScope && (
        <NavBtn active={view === "scope"} onClick={() => onNavigate("scope")} Icon={FileText} label="Scope" />
      )}
      {caps.canViewReports && (
        <NavBtn active={view === "reports"} onClick={() => onNavigate("reports")} Icon={Clock} label="Reports" />
      )}

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: `1px solid ${SIDEBAR.border}`, padding: "12px" }}>
        <button
          type="button"
          onClick={onSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 12px",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            background: "transparent",
            color: SIDEBAR.muted,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = SIDEBAR.hover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  );
}
