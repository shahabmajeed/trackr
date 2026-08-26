import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, X, Tag, Rocket, Play, CheckCircle2, ChevronRight, ChevronDown, Trash2, Clock, RotateCcw, Pencil,
} from "lucide-react";
import { C, TYPES, PRIORITIES, inputStyle, selStyle, fmtDate, fmtDateRange, fmtMinutes, contrastText, STATUS_COLOR_PRESETS, toDateInputValue, fromDateInputValue, defaultEndDateInput } from "../lib/theme";
import { ROOT_CREATE_TYPES } from "../lib/issueHierarchy";
import { Avatar, Modal, Field, Chip } from "./ui";
import { TypeIcon, StatusBadge } from "./IssueModal";

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
              {isFirstCol && (
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
            ) : (
              <button onClick={() => setCreatingIn(sprint.id)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.subtle, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
                <Plus size={14} /> Create issue
              </button>
            )}
          </Section>
        );
      })}

      <div style={{ marginBottom: 10 }}>
        <button onClick={onCreateSprint} style={{ fontSize: 12.5, color: C.primary, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 0 12px" }}>
          + Create sprint
        </button>
      </div>

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
            ) : (
              <button onClick={() => setCreatingIn("backlog")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.subtle, fontSize: 13, cursor: "pointer", padding: "6px 12px" }}>
                <Plus size={14} /> Create issue
              </button>
            )}
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
        <button onClick={onCreateSprint} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Sprint</button>
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

  const byDay = {};
  for (const l of logs) {
    const d = new Date(l.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDay[key]) {
      byDay[key] = {
        sort: d.getTime(),
        label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        minutes: 0,
      };
    }
    byDay[key].minutes += l.minutes;
  }
  const dayRows = Object.values(byDay).sort((a, b) => b.sort - a.sort);

  const maxIssueMins = issueRows[0]?.minutes || 1;
  const maxUserMins = userRows[0]?.[1] || 1;
  const maxDayMins = dayRows[0]?.minutes || 1;

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
  const showDailyBreakdown = dayRows.length > 0 && period !== "day" && period !== "custom";
  const rangeInvalid = period === "range" && rangeFrom && rangeTo && rangeFrom > rangeTo;

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

  const Bar = ({ pct, color = C.primary }) => (
    <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden", flex: 1, minWidth: 60 }}>
      <div style={{ width: `${Math.max(4, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );

  return (
    <div style={{ padding: "20px 24px 32px", maxWidth: 960 }}>
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

      {showDailyBreakdown && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Daily breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dayRows.slice(0, 31).map((row) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: C.subtle, width: 100, flexShrink: 0 }}>{row.label}</span>
                <Bar pct={(row.minutes / maxDayMins) * 100} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, width: 52, textAlign: "right" }}>{fmtMinutes(row.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        {sectionBtn("tickets", `By ticket (${issueRows.length})`)}
        {sectionBtn("people", `By person (${userRows.length})`)}
        {sectionBtn("activity", `Activity (${logs.length})`)}
      </div>

      {logs.length === 0 && (
        <div style={{
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 48,
          textAlign: "center", color: C.subtle,
        }}>
          <Clock size={32} color={C.faint} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>No time logged for {periodSubtitle()}</div>
          <div style={{ fontSize: 13 }}>Move issues to In Progress for auto-tracking, or log time manually on a ticket.</div>
        </div>
      )}

      {section === "tickets" && issueRows.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 80px 48px", gap: 12,
            padding: "10px 16px", background: C.bg, borderBottom: `1px solid ${C.border}`,
            fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.3,
          }}>
            <span>Ticket</span>
            <span>Time</span>
            <span>Share</span>
            <span>Logs</span>
          </div>
          {issueRows.map(({ issue, minutes, count }) => (
            <div
              key={issue.id}
              onClick={() => onOpenIssue?.(issue.id)}
              style={{
                display: "grid", gridTemplateColumns: "1fr 120px 80px 48px", gap: 12, alignItems: "center",
                padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: onOpenIssue ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <TypeIcon type={issue.type} size={12} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{issue.key}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.title}</div>
                </div>
                <Bar pct={(minutes / maxIssueMins) * 100} color={C.primary} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{fmtMinutes(minutes)}</span>
              <span style={{ fontSize: 12, color: C.subtle }}>
                {projectTotal ? `${Math.round((minutes / projectTotal) * 100)}%` : "—"}
              </span>
              <span style={{ fontSize: 12, color: C.faint }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {section === "people" && userRows.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {userRows.map(([uid, mins]) => {
            const u = users.find((x) => x.id === uid);
            const userLogs = logs.filter((l) => l.userId === uid);
            const tickets = new Set(userLogs.map((l) => l.issue.id)).size;
            return (
              <div key={uid} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <Avatar user={u} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{u?.name || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: C.subtle, marginBottom: 6 }}>
                    {fmtMinutes(mins)} · {tickets} ticket{tickets !== 1 ? "s" : ""} · {Math.round((mins / projectTotal) * 100)}% of project
                  </div>
                  <Bar pct={(mins / maxUserMins) * 100} color="#8F7EE7" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{fmtMinutes(mins)}</div>
              </div>
            );
          })}
        </div>
      )}

      {section === "activity" && logs.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8 }}>
          {logs.map((l) => {
            const u = users.find((x) => x.id === l.userId);
            const isAuto = (l.note || "").toLowerCase().includes("auto-tracked");
            return (
              <div key={l.id} style={{
                display: "flex", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start",
              }}>
                <Avatar user={u} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text }}>
                    <span style={{ fontWeight: 800 }}>{fmtMinutes(l.minutes)}</span>
                    {" on "}
                    <span
                      style={{ color: C.primary, fontWeight: 700, cursor: onOpenIssue ? "pointer" : "default" }}
                      onClick={() => onOpenIssue?.(l.issue.id)}
                    >
                      {l.issue.key}
                    </span>
                    {" · "}
                    <span style={{ color: C.subtle }}>{l.issue.title}</span>
                  </div>
                  {l.note && (
                    <div style={{ fontSize: 12, color: C.subtle, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      {isAuto && <span style={{ fontSize: 10, fontWeight: 700, background: C.progBg, color: C.progText, padding: "1px 6px", borderRadius: 3 }}>AUTO</span>}
                      {l.note}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>
                    {new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 11, color: C.faint }}>
                    {new Date(l.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: C.faint }}>
        {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {project?.key || ""} project
      </div>
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

export function ProjectSettingsModal({ project, users, onClose, onAddMember, error, onAddStatus, onDeleteStatus }) {
  const [email, setEmail] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [statusColor, setStatusColor] = useState("#EAE6FF");
  const members = users.filter((u) => project.members.includes(u.id));

  const addCustomStatus = () => {
    if (!statusLabel.trim()) return;
    onAddStatus(statusLabel.trim(), { bg: statusColor, text: contrastText(statusColor) });
    setStatusLabel("");
  };

  return (
    <Modal onClose={onClose} width={460}>
      <div style={{ padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px", color: C.text }}>{project.name} settings</h2>
        <div style={{ fontSize: 12.5, color: C.faint, marginBottom: 16 }}>Key: {project.key}</div>

        <Field label="Members">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar user={u} size={26} /><span style={{ fontSize: 13.5 }}>{u.name}</span>
                <span style={{ fontSize: 12, color: C.faint }}>{u.email}</span>
              </div>
            ))}
          </div>
        </Field>
        <Field label="Invite by email">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) { onAddMember(email.trim()); setEmail(""); } }} />
            <button onClick={() => { if (email.trim()) { onAddMember(email.trim()); setEmail(""); } }}
              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "0 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
          {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 6 }}>{error}</div>}
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>Only people who already have a Trackr account can be added.</div>
        </Field>

        <Field label="Workflow statuses">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {project.statuses.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: s.bg, color: s.text, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 4, flex: 1 }}>{s.label}</span>
                {s.fixed ? (
                  <span title="This status can't be removed" style={{ fontSize: 11, color: C.faint }}>fixed</span>
                ) : (
                  <Trash2 size={14} color={C.faint} style={{ cursor: "pointer" }} onClick={() => onDeleteStatus(s.id)} title="Remove status" />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={statusLabel} onChange={(e) => setStatusLabel(e.target.value)} placeholder="e.g. In Review"
              style={{ ...inputStyle, flex: 1, minWidth: 140 }}
              onKeyDown={(e) => { if (e.key === "Enter") addCustomStatus(); }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", background: "#fff" }} title="Pick a color">
              <span style={{ width: 22, height: 22, borderRadius: 4, background: statusColor, border: `1px solid ${C.borderStrong}`, flexShrink: 0 }} />
              <input
                type="color"
                value={statusColor.length === 7 ? statusColor : "#EAE6FF"}
                onChange={(e) => setStatusColor(e.target.value)}
                style={{ width: 28, height: 28, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
              />
            </label>
            <button onClick={addCustomStatus}
              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "0 12px", height: 34, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {STATUS_COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => setStatusColor(hex)}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: hex, cursor: "pointer",
                  border: statusColor.toLowerCase() === hex.toLowerCase() ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  padding: 0,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>
            To Do, Reopen, In Progress, and Done are fixed. Add more with any color.
          </div>
        </Field>
      </div>
    </Modal>
  );
}
