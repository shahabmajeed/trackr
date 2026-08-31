import { useMemo, useState } from "react";
import { Clock, Search } from "lucide-react";
import { C, fmtMinutes, inputStyle } from "../lib/theme";
import { Avatar } from "./ui";
import { TypeIcon } from "./IssueModal";

const DATE_HEADER_BG = "#E9F2FF";

function fmtAgendaDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function fmtAgendaTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function fmtTimeRange(ts, minutes) {
  const start = new Date(ts);
  const end = new Date(start.getTime() + minutes * 60000);
  return `${fmtAgendaTime(start)} – ${fmtAgendaTime(end)}`;
}

function groupLogsByDate(logList) {
  const groups = {};
  for (const l of logList) {
    const d = new Date(l.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        sort: d.getTime(),
        label: fmtAgendaDate(l.date),
        logs: [],
        minutes: 0,
      };
    }
    groups[key].logs.push(l);
    groups[key].minutes += l.minutes;
  }
  return Object.values(groups).sort((a, b) => b.sort - a.sort);
}

function AgendaShell({ children }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
    }}>
      {children}
    </div>
  );
}

function AgendaDateHeader({ label, sub }) {
  return (
    <div style={{
      background: DATE_HEADER_BG,
      borderBottom: `1px solid ${C.border}`,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{label}</span>
      {sub && <span style={{ fontSize: 12, fontWeight: 600, color: C.subtle }}>{sub}</span>}
    </div>
  );
}

function AgendaRow({ timePrimary, timeSecondary, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        padding: "12px 16px",
        borderBottom: `1px solid ${C.border}`,
        cursor: onClick ? "pointer" : "default",
        background: "#fff",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = C.bg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
    >
      <div style={{ width: 108, flexShrink: 0, textAlign: "left" }}>
        <div style={{ fontSize: 12.5, color: C.subtle, lineHeight: 1.35 }}>{timePrimary}</div>
        {timeSecondary && (
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{timeSecondary}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function LogRowContent({ log, users, onOpenIssue, showUser }) {
  const u = users.find((x) => x.id === log.userId);
  const isAuto = (log.note || "").toLowerCase().includes("auto-tracked");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      {showUser && <Avatar user={u} size={28} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
          <TypeIcon type={log.issue.type} size={12} />
          <span
            style={{ fontSize: 12, fontWeight: 700, color: C.primary }}
            onClick={(e) => { e.stopPropagation(); onOpenIssue?.(log.issue.id); }}
          >
            {log.issue.key}
          </span>
          <span style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{log.issue.title}</span>
        </div>
        {log.note && (
          <div style={{ fontSize: 12, color: C.subtle, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            {isAuto && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: C.progBg, color: C.progText,
                padding: "1px 6px", borderRadius: 3,
              }}>
                AUTO
              </span>
            )}
            {log.note}
          </div>
        )}
        {showUser && u && (
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>{u.name}</div>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, flexShrink: 0 }}>{fmtMinutes(log.minutes)}</div>
    </div>
  );
}

function AgendaByDate({ logs, users, onOpenIssue, showUser = false }) {
  const groups = groupLogsByDate(logs);
  if (groups.length === 0) return null;

  return (
    <AgendaShell>
      {groups.map((g) => (
        <div key={g.key}>
          <AgendaDateHeader label={g.label} sub={fmtMinutes(g.minutes)} />
          {g.logs.sort((a, b) => b.date - a.date).map((l) => (
            <AgendaRow
              key={l.id}
              timePrimary={fmtTimeRange(l.date, l.minutes)}
              timeSecondary={fmtMinutes(l.minutes)}
              onClick={onOpenIssue ? () => onOpenIssue(l.issue.id) : undefined}
            >
              <LogRowContent log={l} users={users} onOpenIssue={onOpenIssue} showUser={showUser} />
            </AgendaRow>
          ))}
        </div>
      ))}
    </AgendaShell>
  );
}

function SectionHeader({ title, sub, right, icon }) {
  return (
    <div style={{
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ minWidth: 0, display: "flex", alignItems: "flex-start", gap: 8 }}>
        {icon}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      {right && <div style={{ fontSize: 14, fontWeight: 800, color: C.text, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export function ReportsDetailsEmpty({ periodLabel }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 48,
      textAlign: "center", color: C.subtle,
    }}>
      <Clock size={32} color={C.faint} style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No time logged for {periodLabel}</div>
      <div style={{ fontSize: 13 }}>Move issues to In Progress for auto-tracking, or log time manually on a ticket.</div>
    </div>
  );
}

export function ReportsActivityAgenda({ logs, users, onOpenIssue }) {
  return <AgendaByDate logs={logs} users={users} onOpenIssue={onOpenIssue} showUser />;
}

export function ReportsTicketAgenda({ issueRows, projectTotal, onOpenIssue }) {
  if (issueRows.length === 0) return null;

  return (
    <AgendaShell>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 88px 64px 48px",
        gap: 12,
        padding: "10px 16px",
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        fontSize: 11,
        fontWeight: 700,
        color: C.faint,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      }}>
        <span>Ticket</span>
        <span>Time</span>
        <span>Share</span>
        <span>Logs</span>
      </div>
      {issueRows.map(({ issue, minutes, count }) => {
        const share = projectTotal ? Math.round((minutes / projectTotal) * 100) : 0;
        return (
          <div
            key={issue.id}
            onClick={() => onOpenIssue?.(issue.id)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 88px 64px 48px",
              gap: 12,
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: `1px solid ${C.border}`,
              cursor: onOpenIssue ? "pointer" : "default",
              background: "#fff",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <div style={{ minWidth: 0, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <TypeIcon type={issue.type} size={14} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 3 }}>{issue.key}</div>
                <div style={{
                  fontSize: 13.5,
                  color: C.text,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {issue.title}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{fmtMinutes(minutes)}</span>
            <span style={{ fontSize: 12, color: C.subtle }}>{share}%</span>
            <span style={{ fontSize: 12, color: C.faint }}>{count}</span>
          </div>
        );
      })}
    </AgendaShell>
  );
}

export function ReportsPeopleAgenda({ userRows, logs, projectTotal, users, onOpenIssue }) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return userRows;
    return userRows.filter(([uid]) => {
      const u = users.find((x) => x.id === uid);
      const name = (u?.name || "unknown").toLowerCase();
      return name.includes(q);
    });
  }, [userRows, users, search]);

  if (userRows.length === 0) return null;

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "10px 14px",
      }}>
        <Search size={15} color={C.faint} style={{ flexShrink: 0 }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{
            ...inputStyle,
            border: "none",
            padding: 0,
            fontSize: 13,
            background: "transparent",
          }}
        />
        {search.trim() && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{
              background: "transparent",
              border: "none",
              color: C.primary,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <div style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          color: C.subtle,
          fontSize: 13,
        }}>
          No people match &ldquo;{search.trim()}&rdquo;
        </div>
      ) : (
    <AgendaShell>
      {filteredRows.map(([uid, mins]) => {
        const u = users.find((x) => x.id === uid);
        const userLogs = logs.filter((l) => l.userId === uid);
        const tickets = new Set(userLogs.map((l) => l.issue.id)).size;
        const share = projectTotal ? Math.round((mins / projectTotal) * 100) : 0;
        const dateGroups = groupLogsByDate(userLogs);

        return (
          <div key={uid}>
            <SectionHeader
              icon={<Avatar user={u} size={32} />}
              title={u?.name || "Unknown"}
              sub={`${tickets} ticket${tickets !== 1 ? "s" : ""} · ${share}% of period`}
              right={fmtMinutes(mins)}
            />
            {dateGroups.map((g) => (
              <div key={g.key}>
                <AgendaDateHeader label={g.label} sub={fmtMinutes(g.minutes)} />
                {g.logs.sort((a, b) => b.date - a.date).map((l) => (
                  <AgendaRow
                    key={l.id}
                    timePrimary={fmtTimeRange(l.date, l.minutes)}
                    timeSecondary={fmtMinutes(l.minutes)}
                    onClick={onOpenIssue ? () => onOpenIssue(l.issue.id) : undefined}
                  >
                    <LogRowContent log={l} users={users} onOpenIssue={onOpenIssue} showUser={false} />
                  </AgendaRow>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </AgendaShell>
      )}
    </div>
  );
}
