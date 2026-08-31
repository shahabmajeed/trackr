import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, X, Tag, Rocket, Play, CheckCircle2, ChevronRight, ChevronDown, Trash2, Clock, RotateCcw, Pencil,
} from "lucide-react";
import { C, TYPES, PRIORITIES, inputStyle, selStyle, fmtDate, fmtDateRange, fmtMinutes, contrastText, STATUS_COLOR_PRESETS, toDateInputValue, fromDateInputValue, defaultEndDateInput } from "../lib/theme";
import { ROOT_CREATE_TYPES } from "../lib/issueHierarchy";
import { Avatar, Modal, Field, Chip } from "./ui";
import { TypeIcon, StatusBadge } from "./IssueModal";
import { ReportsChartsPanel } from "./ReportsCharts";
import { ReportsTimesheet } from "./ReportsTimesheet";
import {
  ReportsDetailsEmpty,
  ReportsActivityAgenda,
  ReportsTicketAgenda,
  ReportsPeopleAgenda,
} from "./ReportsDetailsList";

export function FilterBar({ search, setSearch, allLabels, labelFilter, toggleLabel, onlyMine, setOnlyMine, currentUser }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "#fff" }}>
      <div style={{ position: "relative" }}>
        <Search size={14} color={C.faint} style={{ position: "absolute", left: 9, top: 9 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues"
          style={{ ...inputStyle, width: 200, paddingLeft: 28, height: 32, boxSizing: "border-box" }} />
      </div>
      <button onClick={() => setOnlyMine((v) => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, border: `1px solid ${onlyMine ? C.primary : C.border}`,
        background: onlyMine ? C.primarySoft : "#fff", color: onlyMine ? C.primary : C.text,
        borderRadius: 20, padding: "4px 10px 4px 4px", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
      }}>
        <Avatar user={currentUser} size={22} /> Only my issues
      </button>
      {allLabels.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {allLabels.map((l) => (
            <span key={l} onClick={() => toggleLabel(l)} style={{
              cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 12,
              border: `1px solid ${labelFilter.includes(l) ? C.primary : C.border}`,
              background: labelFilter.includes(l) ? C.primarySoft : "#fff",
              color: labelFilter.includes(l) ? C.primary : C.subtle,
            }}>
              <Tag size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateIssueInline({ onCreate, onCancel, defaultStatus }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("task");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const submit = () => {
    if (!title.trim()) { onCancel(); return; }
    onCreate({ title: title.trim(), type, status: defaultStatus });
    setTitle("");
    inputRef.current && inputRef.current.focus();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `2px solid ${C.primary}`, borderRadius: 6, background: "#fff" }}>
      <select value={type} onChange={(e) => setType(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 13, cursor: "pointer" }}>
        {ROOT_CREATE_TYPES.map((k) => <option key={k} value={k}>{TYPES[k].label}</option>)}
      </select>
      <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder="What needs to be done?"
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5 }} />
      <button onClick={submit} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Create</button>
      <X size={16} style={{ cursor: "pointer", color: C.faint }} onClick={onCancel} />
    </div>
  );
}

function PriorityIcon({ priority, size = 15 }) {
  const meta = PRIORITIES[priority] || PRIORITIES.medium;
  const Icon = meta.icon;
  return <Icon size={size} color={meta.color} title={meta.label} style={{ flexShrink: 0 }} />;
}

function IssueCard({ issue, users, allIssues, onClick }) {
  const assignee = users.find((u) => u.id === issue.assignee);
  const parent = issue.parentId ? allIssues?.find((i) => i.id === issue.parentId) : null;
  const totalMinutes = (issue.timeLogs || []).reduce((a, l) => a + l.minutes, 0);
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 10px 8px",
      marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 2px rgba(9,30,66,0.06)",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
    >
      {parent && (
        <div style={{ fontSize: 11, color: C.primary, fontWeight: 600, marginBottom: 4 }}>↳ {parent.key}</div>
      )}
      <div style={{ fontSize: 13.5, color: C.text, fontWeight: 500, marginBottom: 8, lineHeight: 1.35 }}>{issue.title}</div>
      {issue.labels.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {issue.labels.map((l) => <Chip key={l}>{l}</Chip>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TypeIcon type={issue.type} />
          <span style={{ fontSize: 11.5, color: C.faint, fontWeight: 600 }}>{issue.key}</span>
          <PriorityIcon priority={issue.priority} size={14} />
          {issue.storyPoints != null && <span style={{ fontSize: 11, color: C.faint, fontWeight: 700 }}>{issue.storyPoints} SP</span>}
          {issue.dueDate && <span style={{ fontSize: 11, color: C.faint }}>{fmtDate(issue.dueDate)}</span>}
          {totalMinutes > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.faint }}>
              <Clock size={11} /> {fmtMinutes(totalMinutes)}
            </span>
          )}
        </div>
        <Avatar user={assignee} size={24} />
      </div>
    </div>
  );
}

export function BoardView({ issues, users, allIssues, sprint, statuses, onOpen, onCreate }) {
  const [creatingIn, setCreatingIn] = useState(null);
  if (!sprint) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.subtle }}>
        <Rocket size={32} color={C.faint} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No active sprint</div>
        <div style={{ fontSize: 13.5 }}>Start a sprint from the Backlog view to see work here.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 14, padding: 20, overflowX: "auto", alignItems: "flex-start" }}>
      {statuses.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.id);
        const isFirstCol = col.id === statuses[0]?.id;
        return (
          <div key={col.id} style={{ minWidth: 280, flex: "1 1 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle, letterSpacing: 0.4 }}>{col.label.toUpperCase()}</span>
              <span style={{ fontSize: 12, color: C.faint }}>{colIssues.length}</span>
            </div>
            <div style={{ background: C.bg, borderRadius: 6, padding: 8, minHeight: 80 }}>
              {colIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} users={users} allIssues={allIssues || issues} onClick={() => onOpen(issue.id)} />
              ))}
              {isFirstCol && onCreate && (
                creatingIn === col.id ? (
                  <CreateIssueInline defaultStatus={col.id} onCancel={() => setCreatingIn(null)}
                    onCreate={(data) => { onCreate(data); setCreatingIn(null); }} />
                ) : (
                  <button onClick={() => setCreatingIn(col.id)} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
                    color: C.subtle, fontSize: 13, cursor: "pointer", padding: "6px 4px", width: "100%",
                  }}><Plus size={15} /> Create issue</button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssueRow({ issue, users, sprints, statuses, allIssues, onOpen, onStatusChange, onMoveSprint, onDelete }) {
  const assignee = users.find((u) => u.id === issue.assignee);
  const parent = issue.parentId ? allIssues?.find((i) => i.id === issue.parentId) : null;
  return (
    <div onClick={onOpen} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 5,
      cursor: "pointer", border: `1px solid transparent`,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
    >
      <TypeIcon type={issue.type} />
      <span style={{ fontSize: 11.5, color: C.faint, fontWeight: 600, width: 56, flexShrink: 0 }}>{issue.key}</span>
      {parent && <span style={{ fontSize: 11, color: C.primary, fontWeight: 600, flexShrink: 0 }}>↳ {parent.key}</span>}
      <span style={{ fontSize: 13.5, color: C.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.title}</span>
      <div style={{ display: "flex", gap: 4 }}>{issue.labels.slice(0, 2).map((l) => <Chip key={l}>{l}</Chip>)}</div>
      <PriorityIcon priority={issue.priority} />
      <StatusBadge status={issue.status} statuses={statuses} onChange={(s) => onStatusChange(s)} compact />
      <select value={issue.sprintId || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => onMoveSprint(e.target.value || null)}
        style={{ fontSize: 11.5, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 4px", color: C.subtle, background: "#fff" }}>
        <option value="">Backlog</option>
        {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <Avatar user={assignee} size={24} />
      <Trash2 size={14} color={C.faint} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onDelete(); }} />
    </div>
  );
}

function SprintDateFields({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Field label="Start date">
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            onStartChange(e.target.value);
            if (endDate && e.target.value && endDate < e.target.value) {
              onEndChange(defaultEndDateInput(e.target.value));
            }
          }}
          style={inputStyle}
        />
      </Field>
      <Field label="End date">
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndChange(e.target.value)}
          style={inputStyle}
        />
      </Field>
    </div>
  );
}

function SprintEditForm({ sprint, onSave, onCancel, compact }) {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal || "");
  const [startDate, setStartDate] = useState(toDateInputValue(sprint.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(sprint.endDate));

  const submit = () => {
    if (!name.trim()) return;
    if ((startDate && !endDate) || (!startDate && endDate)) return;
    if (startDate && endDate && endDate < startDate) return;
    onSave({
      name: name.trim(),
      goal: goal.trim(),
      startDate: startDate ? fromDateInputValue(startDate) : null,
      endDate: endDate ? fromDateInputValue(endDate) : null,
    });
  };

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 6, padding: compact ? 10 : 12,
      background: C.bg, marginBottom: compact ? 8 : 10,
    }}>
      <Field label="Sprint name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Sprint goal (optional)">
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What will this sprint achieve?" style={inputStyle} />
      </Field>
      <SprintDateFields startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
        <button type="button" onClick={onCancel} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button type="button" onClick={submit} disabled={!name.trim() || Boolean(startDate && !endDate) || Boolean(!startDate && endDate)}
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: !name.trim() ? 0.5 : 1 }}>
          Save
        </button>
      </div>
    </div>
  );
}

function SprintMeta({ sprint }) {
  return (
    <div style={{ padding: "0 14px 8px", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
      {sprint.goal && (
        <div style={{ fontSize: 12.5, color: C.subtle, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: C.faint }}>Goal: </span>{sprint.goal}
        </div>
      )}
      <div style={{ fontSize: 12, color: C.faint }}>{fmtDateRange(sprint.startDate, sprint.endDate)}</div>
    </div>
  );
}

export function BacklogView({ issues, sprints, users, statuses, onOpen, onStatusChange, onMoveSprint, onDelete, onCreate, onStartSprint, onCompleteSprint, onReopenSprint, onUpdateSprint, onCreateSprint }) {
  const [creatingIn, setCreatingIn] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [editingSprintId, setEditingSprintId] = useState(null);
  const ordered = [...sprints].sort((a, b) => (a.status === "active" ? -1 : b.status === "active" ? 1 : 0));

  const Section = ({ id, title, headerRight, children, count }) => (
    <div style={{ marginBottom: 18, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6 }}>
      <div onClick={() => setCollapsed((c) => ({ ...c, [id]: !c[id] }))} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", userSelect: "none",
      }}>
        {collapsed[id] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{title}</span>
        <span style={{ fontSize: 12.5, color: C.faint }}>{count} issue{count !== 1 ? "s" : ""}</span>
        <div style={{ flex: 1 }} />
        {headerRight}
      </div>
      {!collapsed[id] && <div style={{ padding: "4px 8px 10px" }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      {ordered.map((sprint) => {
        const sIssues = issues.filter((i) => i.sprintId === sprint.id);
        return (
          <Section key={sprint.id} id={sprint.id} count={sIssues.length}
            title={<>{sprint.name}
              {sprint.status === "active" && <span style={{ color: C.doneText, fontSize: 11, fontWeight: 700, marginLeft: 4 }}>ACTIVE</span>}
              {sprint.status === "completed" && <span style={{ color: C.faint, fontSize: 11, fontWeight: 700, marginLeft: 4 }}>COMPLETED</span>}
              <span style={{ color: C.faint, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>{fmtDateRange(sprint.startDate, sprint.endDate)}</span></>}
            headerRight={
              <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingSprintId((id) => (id === sprint.id ? null : sprint.id))}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", color: C.subtle, border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Pencil size={12} /> Edit
                </button>
                {sprint.status === "future" && (
                  <button onClick={() => onStartSprint(sprint.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Play size={12} /> Start sprint
                  </button>
                )}
                {sprint.status === "active" && (
                  <button onClick={() => onCompleteSprint(sprint.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: C.doneText, border: `1px solid ${C.doneText}`, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <CheckCircle2 size={12} /> Complete sprint
                  </button>
                )}
                {sprint.status === "completed" && (
                  <button onClick={() => onReopenSprint(sprint.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <RotateCcw size={12} /> Reopen sprint
                  </button>
                )}
              </div>
            }>
            {!collapsed[sprint.id] && editingSprintId !== sprint.id && (
              <SprintMeta sprint={sprint} />
            )}
            {!collapsed[sprint.id] && editingSprintId === sprint.id && (
              <div style={{ padding: "8px 8px 0" }}>
                <SprintEditForm
                  sprint={sprint}
                  compact
                  onCancel={() => setEditingSprintId(null)}
                  onSave={async (patch) => {
                    await onUpdateSprint(sprint.id, patch);
                    setEditingSprintId(null);
                  }}
                />
              </div>
            )}
            {sIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} users={users} sprints={sprints} statuses={statuses} allIssues={issues}
                onOpen={() => onOpen(issue.id)} onStatusChange={(s) => onStatusChange(issue.id, s)}
                onMoveSprint={(sid) => onMoveSprint(issue.id, sid)} onDelete={() => onDelete(issue.id)} />
            ))}
            {sIssues.length === 0 && <div style={{ fontSize: 12.5, color: C.faint, padding: "6px 12px" }}>No issues yet.</div>}
            {creatingIn === sprint.id ? (
              <div style={{ padding: "6px 4px" }}>
                <CreateIssueInline onCancel={() => setCreatingIn(null)} onCreate={(data) => { onCreate({ ...data, sprintId: sprint.id }); setCreatingIn(null); }} />
              </div>
            ) : onCreate ? (
              <button onClick={() => setCreatingIn(sprint.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.subtle, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
                <Plus size={14} /> Create issue
              </button>
            ) : null}
          </Section>
        );
      })}

      {onCreateSprint && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={onCreateSprint} style={{ fontSize: 12.5, color: C.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 0 12px" }}>
            + Create sprint
          </button>
        </div>
      )}

      {(() => {
        const backlogIssues = issues.filter((i) => !i.sprintId);
        return (
          <Section id="backlog" count={backlogIssues.length} title="Backlog">
            {backlogIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} users={users} sprints={sprints} statuses={statuses} allIssues={issues}
                onOpen={() => onOpen(issue.id)} onStatusChange={(s) => onStatusChange(issue.id, s)}
                onMoveSprint={(sid) => onMoveSprint(issue.id, sid)} onDelete={() => onDelete(issue.id)} />
            ))}
            {backlogIssues.length === 0 && <div style={{ fontSize: 12.5, color: C.faint, padding: "6px 12px" }}>Backlog is empty.</div>}
            {creatingIn === "backlog" ? (
              <div style={{ padding: "6px 4px" }}>
                <CreateIssueInline onCancel={() => setCreatingIn(null)} onCreate={(data) => { onCreate({ ...data, sprintId: null }); setCreatingIn(null); }} />
              </div>
            ) : onCreate ? (
              <button onClick={() => setCreatingIn("backlog")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.subtle, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
                <Plus size={14} /> Create issue
              </button>
            ) : null}
          </Section>
        );
      })()}
    </div>
  );
}

export function SprintsView({ sprints, issues, onStartSprint, onCompleteSprint, onReopenSprint, onUpdateSprint, onCreateSprint }) {
  const [editingSprintId, setEditingSprintId] = useState(null);
  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Sprints</h2>
        {onCreateSprint && (
          <button onClick={onCreateSprint} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Sprint</button>
        )}
      </div>
      {sprints.length === 0 && <div style={{ color: C.faint, fontSize: 13.5 }}>No sprints yet.</div>}
      {sprints.map((s) => {
        const count = issues.filter((i) => i.sprintId === s.id).length;
        const editing = editingSprintId === s.id;
        return (
          <div key={s.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
            {editing ? (
              <SprintEditForm
                sprint={s}
                onCancel={() => setEditingSprintId(null)}
                onSave={async (patch) => {
                  await onUpdateSprint(s.id, patch);
                  setEditingSprintId(null);
                }}
              />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {s.name}{" "}
                      <span style={{ fontSize: 11, color: s.status === "active" ? C.doneText : C.faint, fontWeight: 600, textTransform: "uppercase" }}>{s.status}</span>
                    </div>
                    {s.goal && <div style={{ fontSize: 12.5, color: C.subtle, marginTop: 4 }}><span style={{ fontWeight: 700, color: C.faint }}>Goal: </span>{s.goal}</div>}
                    <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{count} issues · {fmtDateRange(s.startDate, s.endDate)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button type="button" onClick={() => setEditingSprintId(s.id)} style={{ background: "#fff", color: C.subtle, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <Pencil size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Edit
                    </button>
                    {s.status === "future" && <button type="button" onClick={() => onStartSprint(s.id)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Start</button>}
                    {s.status === "active" && <button type="button" onClick={() => onCompleteSprint(s.id)} style={{ background: "#fff", color: C.doneText, border: `1px solid ${C.doneText}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Complete</button>}
                    {s.status === "completed" && <button type="button" onClick={() => onReopenSprint(s.id)} style={{ background: "#fff", color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reopen</button>}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ReportsView({ issues, users, sprints, project, onOpenIssue }) {
  const [period, setPeriod] = useState("week"); // day | week | month | all | custom | range
  const [reportTab, setReportTab] = useState("overview"); // overview | details | timesheet
  const [section, setSection] = useState("tickets"); // tickets | people | activity
  const [customDate, setCustomDate] = useState(toDateInputValue(Date.now()));
  const [rangeFrom, setRangeFrom] = useState(toDateInputValue(Date.now() - 6 * 86400000));
  const [rangeTo, setRangeTo] = useState(toDateInputValue(Date.now()));

  const allLogs = issues.flatMap((i) =>
    (i.timeLogs || []).map((l) => ({ ...l, issue: i }))
  );

  const startOfLocalDay = (ts) => {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const endOfLocalDay = (ts) => startOfLocalDay(ts) + 86400000 - 1;

  const inPeriod = (ts) => {
    const t = new Date(ts).getTime();
    const now = new Date();
    if (period === "all") return true;
    if (period === "day") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return t >= start;
    }
    if (period === "week") {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).getTime();
      return t >= start;
    }
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return t >= start;
    }
    if (period === "custom") {
      if (!customDate) return false;
      const dayStart = fromDateInputValue(customDate);
      return t >= startOfLocalDay(dayStart) && t <= endOfLocalDay(dayStart);
    }
    if (period === "range") {
      if (!rangeFrom || !rangeTo) return false;
      const fromTs = startOfLocalDay(fromDateInputValue(rangeFrom));
      const toTs = endOfLocalDay(fromDateInputValue(rangeTo));
      if (fromTs > toTs) return false;
      return t >= fromTs && t <= toTs;
    }
    return true;
  };

  const logs = allLogs.filter((l) => inPeriod(l.date)).sort((a, b) => b.date - a.date);
  const projectTotal = logs.reduce((a, l) => a + l.minutes, 0);
  const allProjectTotal = allLogs.reduce((a, l) => a + l.minutes, 0);

  const byIssue = {};
  for (const l of logs) {
    const id = l.issue.id;
    if (!byIssue[id]) byIssue[id] = { issue: l.issue, minutes: 0, count: 0 };
    byIssue[id].minutes += l.minutes;
    byIssue[id].count += 1;
  }
  const issueRows = Object.values(byIssue).sort((a, b) => b.minutes - a.minutes);

  const byUser = {};
  for (const l of logs) {
    byUser[l.userId] = (byUser[l.userId] || 0) + l.minutes;
  }
  const userRows = Object.entries(byUser).sort((a, b) => b[1] - a[1]);

  const periodSubtitle = () => {
    if (period === "custom" && customDate) {
      return new Date(fromDateInputValue(customDate)).toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
      });
    }
    if (period === "range" && rangeFrom && rangeTo) {
      return `${fmtDate(fromDateInputValue(rangeFrom))} – ${fmtDate(fromDateInputValue(rangeTo))}`;
    }
    return ({ day: "today", week: "this week", month: "this month", all: "all time" })[period] || period;
  };

  const issuesWithTime = issueRows.length;
  const contributors = userRows.length;
  const rangeInvalid = period === "range" && rangeFrom && rangeTo && rangeFrom > rangeTo;
  const statuses = project?.statuses || [];

  const selectPeriod = (id) => {
    setPeriod(id);
    if (id === "custom" && !customDate) setCustomDate(toDateInputValue(Date.now()));
    if (id === "range") {
      if (!rangeFrom) setRangeFrom(toDateInputValue(Date.now() - 6 * 86400000));
      if (!rangeTo) setRangeTo(toDateInputValue(Date.now()));
    }
  };

  const tabBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => selectPeriod(id)}
      style={{
        background: period === id ? C.primary : "#fff",
        color: period === id ? "#fff" : C.subtle,
        border: `1px solid ${period === id ? C.primary : C.border}`,
        borderRadius: 20, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const sectionBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setSection(id)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: section === id ? `2px solid ${C.primary}` : "2px solid transparent",
        padding: "8px 4px", fontSize: 13, fontWeight: 700,
        color: section === id ? C.primary : C.subtle, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const reportTabBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setReportTab(id)}
      style={{
        background: reportTab === id ? C.primarySoft : "transparent",
        color: reportTab === id ? C.primary : C.subtle,
        border: `1px solid ${reportTab === id ? C.primary : C.border}`,
        borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const StatCard = ({ label, value, sub }) => (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px",
      boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.subtle, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "20px 24px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: C.text }}>Time reports</h2>
        <p style={{ fontSize: 13, color: C.subtle, margin: 0 }}>
          {project?.name || "Project"} · {periodSubtitle()}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {tabBtn("day", "Today")}
        {tabBtn("week", "This week")}
        {tabBtn("month", "This month")}
        {tabBtn("custom", "By date")}
        {tabBtn("range", "Date range")}
        {tabBtn("all", "All time")}
      </div>

      {period === "custom" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px",
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.subtle }}>Date</span>
          <input
            type="date"
            value={customDate}
            max={toDateInputValue(Date.now())}
            onChange={(e) => setCustomDate(e.target.value)}
            style={{ ...inputStyle, width: 160 }}
          />
        </div>
      )}

      {period === "range" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap",
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px",
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.subtle }}>From</span>
          <input
            type="date"
            value={rangeFrom}
            max={rangeTo || toDateInputValue(Date.now())}
            onChange={(e) => {
              setRangeFrom(e.target.value);
              if (rangeTo && e.target.value > rangeTo) setRangeTo(e.target.value);
            }}
            style={{ ...inputStyle, width: 160 }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.subtle }}>To</span>
          <input
            type="date"
            value={rangeTo}
            min={rangeFrom || undefined}
            max={toDateInputValue(Date.now())}
            onChange={(e) => setRangeTo(e.target.value)}
            style={{ ...inputStyle, width: 160 }}
          />
          {rangeInvalid && (
            <span style={{ fontSize: 12, color: C.danger }}>End date must be on or after start date</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {reportTabBtn("overview", "Overview")}
        {reportTabBtn("details", "Details")}
        {reportTabBtn("timesheet", "Timesheet")}
      </div>

      {reportTab !== "timesheet" && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Project total"
          value={fmtMinutes(projectTotal)}
          sub={period !== "all" && allProjectTotal !== projectTotal ? `${fmtMinutes(allProjectTotal)} all time` : `${issues.length} issues`}
        />
        <StatCard label="Tickets tracked" value={issuesWithTime} sub={issuesWithTime === 1 ? "with time logged" : "with time logged"} />
        <StatCard label="Contributors" value={contributors || "—"} sub={contributors ? `${logs.length} log entries` : "No logs yet"} />
        <StatCard
          label="Avg per ticket"
          value={issuesWithTime ? fmtMinutes(Math.round(projectTotal / issuesWithTime)) : "—"}
          sub={issuesWithTime ? "in selected period" : undefined}
        />
      </div>
      )}

      {reportTab === "overview" && (
        <ReportsChartsPanel
          logs={logs}
          allLogs={allLogs}
          issues={issues}
          statuses={statuses}
          periodLabel={periodSubtitle()}
          onOpenIssue={onOpenIssue}
          showCalendar={false}
        />
      )}

      {reportTab === "timesheet" && (
        <div style={{ marginBottom: 32 }}>
          <ReportsTimesheet
            allLogs={allLogs}
            users={users}
            project={project}
            onOpenIssue={onOpenIssue}
          />
        </div>
      )}

      {reportTab === "details" && (
        <>
      <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {sectionBtn("tickets", `By ticket (${issueRows.length})`)}
        {sectionBtn("people", `By person (${userRows.length})`)}
        {sectionBtn("activity", `Activity (${logs.length})`)}
      </div>

      {logs.length === 0 && (
        <ReportsDetailsEmpty periodLabel={periodSubtitle()} />
      )}

      {section === "tickets" && issueRows.length > 0 && (
        <ReportsTicketAgenda
          issueRows={issueRows}
          projectTotal={projectTotal}
          onOpenIssue={onOpenIssue}
        />
      )}

      {section === "people" && logs.length > 0 && (
        <ReportsPeopleAgenda
          userRows={userRows}
          logs={logs}
          projectTotal={projectTotal}
          users={users}
          onOpenIssue={onOpenIssue}
        />
      )}

      {section === "activity" && logs.length > 0 && (
        <ReportsActivityAgenda logs={logs} users={users} onOpenIssue={onOpenIssue} />
      )}
        </>
      )}

      {reportTab !== "timesheet" && (
        <div style={{ marginTop: 16, fontSize: 12, color: C.faint }}>
          {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {project?.key || ""} project
        </div>
      )}
    </div>
  );
}

export function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Create project</h2>
        <Field label="Project name">
          <input style={inputStyle} value={name} onChange={(e) => {
            setName(e.target.value);
            if (!key || key === name.slice(0, name.length - 1).replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()) {
              setKey(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase());
            }
          }} placeholder="Marketing Site" />
        </Field>
        <Field label="Key">
          <input style={inputStyle} value={key} onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 6))} placeholder="MKT" />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button disabled={!name.trim() || !key.trim() || busy} onClick={async () => { setBusy(true); try { await onCreate(name.trim(), key.trim()); } finally { setBusy(false); } }}
            style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: (!name.trim() || !key.trim() || busy) ? 0.5 : 1 }}>Create project</button>
        </div>
      </div>
    </Modal>
  );
}

export function CreateSprintModal({ onClose, onCreate, nextNum }) {
  const [name, setName] = useState(`Sprint ${nextNum}`);
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(toDateInputValue(Date.now()));
  const [endDate, setEndDate] = useState(defaultEndDateInput(toDateInputValue(Date.now())));

  const submit = () => {
    if (!name.trim() || !startDate || !endDate || endDate < startDate) return;
    onCreate(name.trim(), goal.trim(), fromDateInputValue(startDate), fromDateInputValue(endDate));
  };

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: C.text }}>Create sprint</h2>
        <Field label="Sprint name">
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Sprint goal (optional)">
          <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What will this sprint achieve?" />
        </Field>
        <SprintDateFields startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button type="button" disabled={!name.trim() || !startDate || !endDate || endDate < startDate} onClick={submit}
            style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: (!name.trim() || !startDate || !endDate || endDate < startDate) ? 0.5 : 1 }}>Create sprint</button>
        </div>
      </div>
    </Modal>
  );
}

export function StartSprintModal({ sprint, onClose, onStart }) {
  const [startDate, setStartDate] = useState(toDateInputValue(sprint.startDate) || toDateInputValue(Date.now()));
  const [endDate, setEndDate] = useState(toDateInputValue(sprint.endDate) || defaultEndDateInput(toDateInputValue(sprint.startDate) || toDateInputValue(Date.now())));

  const submit = () => {
    if (!startDate || !endDate || endDate < startDate) return;
    onStart(sprint.id, fromDateInputValue(startDate), fromDateInputValue(endDate));
  };

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: C.text }}>Start {sprint.name}</h2>
        <p style={{ fontSize: 13, color: C.subtle, margin: "0 0 16px" }}>Set the sprint dates before it goes active.</p>
        <SprintDateFields startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button type="button" disabled={!startDate || !endDate || endDate < startDate} onClick={submit}
            style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: (!startDate || !endDate || endDate < startDate) ? 0.5 : 1 }}>Start sprint</button>
        </div>
      </div>
    </Modal>
  );
}

export { default as ProjectSettingsModal } from "./ProjectSettingsModal";
