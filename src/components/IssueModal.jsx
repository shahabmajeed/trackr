import { useState, useRef, useMemo, useEffect } from "react";
import {
  X, Trash2, MessageSquare, Plus, Clock, Calendar, Paperclip, Link2, Eye, EyeOff, Pencil,
} from "lucide-react";
import {
  C, TYPES, PRIORITIES, LINK_TYPES, inputStyle, selStyle, fmtDate, fmtMinutes, statusMeta,
} from "../lib/theme";
import { Avatar, Modal, Field, Chip } from "./ui";
import * as api from "../lib/api";
import { toastSuccess, toastError } from "../lib/toast";
import {
  allowedChildTypes,
  canHaveChildren,
  childCreatePlaceholder,
  childSectionLabel,
  defaultChildType,
  isSubtaskType,
} from "../lib/issueHierarchy";

function useElapsedLabel(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return null;
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function TypeIcon({ type, size = 15 }) {
  const meta = TYPES[type] || TYPES.task;
  const Icon = meta.icon;
  return (
    <span title={meta.label} style={{
      width: size + 5, height: size + 5, borderRadius: 4, background: meta.color,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={size - 3} color="#fff" strokeWidth={2.5} />
    </span>
  );
}

function StatusBadge({ status, statuses, onChange, compact }) {
  const meta = statusMeta(statuses, status) || { bg: C.todoBg, text: C.todoText, label: "?" };
  return (
    <select
      value={status || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      style={{
        background: meta.bg, color: meta.text, border: "none", borderRadius: 4,
        fontSize: compact ? 11 : 12, fontWeight: 700, padding: compact ? "2px 6px" : "4px 10px",
        cursor: "pointer", appearance: "none", textAlign: "center",
      }}
    >
      {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

function LogTimeForm({ onSave, onCancel, initialMinutes = 0, initialNote = "", saveLabel = "Save" }) {
  const [hours, setHours] = useState(initialMinutes ? String(Math.floor(initialMinutes / 60) || "") : "");
  const [minutes, setMinutes] = useState(initialMinutes ? String(initialMinutes % 60 || "") : "");
  const [note, setNote] = useState(initialNote || "");
  const submit = () => {
    const total = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
    if (total <= 0) return;
    onSave(total, note.trim());
  };
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 10, marginBottom: 10, background: "#fff" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))} placeholder="0" style={{ ...inputStyle, width: 56, textAlign: "center" }} />
        <span style={{ alignSelf: "center", fontSize: 12.5, color: C.subtle }}>h</span>
        <input value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} placeholder="0" style={{ ...inputStyle, width: 56, textAlign: "center" }} />
        <span style={{ alignSelf: "center", fontSize: 12.5, color: C.subtle }}>m</span>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you work on? (optional)" style={{ ...inputStyle, marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button type="button" onClick={submit} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{saveLabel}</button>
      </div>
    </div>
  );
}

function renderMentions(text, users) {
  const parts = text.split(/(@[\w.+-]+(?:\s[\w.+-]+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const mention = part.slice(1);
      const match = users.find((u) =>
        u.name.toLowerCase() === mention.toLowerCase() ||
        u.name.toLowerCase().startsWith(mention.toLowerCase()) ||
        u.email.split("@")[0].toLowerCase() === mention.toLowerCase()
      );
      return (
        <span key={i} style={{ color: C.primary, fontWeight: 700, background: C.primarySoft, borderRadius: 3, padding: "0 3px" }}>
          @{match ? match.name : mention}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function activityLabel(a, users, statuses, issues) {
  const who = users.find((u) => u.id === a.userId)?.name || "Someone";
  const statusName = (id) => statuses.find((s) => s.id === id)?.label || id || "—";
  const userName = (id) => users.find((u) => u.id === id)?.name || id || "Unassigned";
  const issueKey = (id) => issues.find((i) => i.id === id)?.key || id || "—";
  switch (a.action) {
    case "created": return `${who} created this issue`;
    case "status_changed": return `${who} changed status from ${statusName(a.fromValue)} to ${statusName(a.toValue)}`;
    case "assignee_changed": return `${who} changed assignee from ${userName(a.fromValue)} to ${userName(a.toValue)}`;
    case "comment_added": return `${who} commented`;
    case "time_logged": return `${who} logged ${a.toValue}`;
    case "attachment_added": return `${who} attached ${a.toValue}`;
    case "link_added": return `${who} added link (${a.toValue})`;
    case "subtask_added": return `${who} added subtask ${a.toValue}`;
    case "epic_changed": return `${who} moved under epic ${issueKey(a.toValue) || "none"}`;
    case "parent_changed": return `${who} changed parent`;
    case "due_date_changed": return `${who} set due date`;
    case "story_points_changed": return `${who} set story points to ${a.toValue || "—"}`;
    case "estimate_changed": return `${who} set estimate to ${a.toValue || "—"}m`;
    default: return `${who}: ${a.action.replace(/_/g, " ")}`;
  }
}

function allowedTypeOptions(issue, parentIssue) {
  if (isSubtaskType(issue.type)) {
    return Object.entries(TYPES).filter(([k]) => k === "subtask");
  }
  if (issue.parentId && parentIssue) {
    const allowed = allowedChildTypes(parentIssue.type);
    if (allowed.includes(issue.type)) {
      return Object.entries(TYPES).filter(([k]) => allowed.includes(k) || k === issue.type);
    }
  }
  return Object.entries(TYPES).filter(([k]) => k !== "subtask");
}

export default function IssueModal({
  issue, project, users, allIssues, currentUser, onClose, onChanged, onDeleted, onOpenIssue, onCreateChild, onDeleteIssue,
}) {
  const [labelInput, setLabelInput] = useState("");
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState(issue.title || "");
  const [desc, setDesc] = useState(issue.description);
  const [logging, setLogging] = useState(false);
  const [editingTimeLogId, setEditingTimeLogId] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskType, setSubtaskType] = useState("task");
  const [creatingSub, setCreatingSub] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [linkType, setLinkType] = useState("relates_to");
  const [linkTarget, setLinkTarget] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [tab, setTab] = useState("comments");
  const fileRef = useRef(null);

  useEffect(() => {
    setTitle(issue.title || "");
    setDesc(issue.description || "");
    setComment("");
    setSubtaskTitle("");
    setSubtaskType(defaultChildType(issue.type));
    setLogging(false);
    setEditingTimeLogId(null);
    setEditingCommentId(null);
  }, [issue.id, issue.type]);

  // Keep local title in sync when parent updates the same issue (e.g. after save)
  useEffect(() => {
    if (document.activeElement?.dataset?.field !== "issue-title") {
      setTitle(issue.title || "");
    }
  }, [issue.title]);

  const members = users.filter((u) => project.members.includes(u.id));
  const epics = allIssues.filter((i) => i.type === "epic" && i.id !== issue.id && !i.parentId);
  const parentIssue = issue.parentId ? allIssues.find((i) => i.id === issue.parentId) : null;
  const isSubtask = isSubtaskType(issue.type);
  const childIssues = allIssues.filter((i) => i.parentId === issue.id);
  const legacyEpicLinks = issue.type === "epic"
    ? allIssues.filter((i) => i.epicId === issue.id && !i.parentId && i.id !== issue.id)
    : [];
  const displayChildren = [
    ...childIssues,
    ...legacyEpicLinks.filter((l) => !childIssues.some((c) => c.id === l.id)),
  ];
  const childTypesAllowed = allowedChildTypes(issue.type);
  const showChildSection = canHaveChildren(issue.type);
  const doneStatusIds = new Set(
    project.statuses.filter((s) => s.label.toLowerCase() === "done").map((s) => s.id)
  );
  const childDoneCount = displayChildren.filter((c) => doneStatusIds.has(c.status)).length;
  const timeLogs = issue.timeLogs || [];
  const totalMinutes = timeLogs.reduce((a, l) => a + l.minutes, 0);
  const watching = (issue.watchers || []).includes(currentUser.id);
  const tracking = api.isInProgressStatus(project.statuses, issue.status);
  const elapsedLabel = useElapsedLabel(issue.timerStartedAt);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tracking || issue.timerStartedAt) return;
      try {
        const updated = await api.ensureTimerRunning(issue, project.statuses, currentUser.id);
        if (!cancelled && updated) onChanged({ ...issue, ...updated });
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [issue.id, tracking]);

  const mentionCandidates = useMemo(() => {
    const at = comment.lastIndexOf("@");
    if (at < 0) return [];
    const q = comment.slice(at + 1).toLowerCase();
    if (q.includes(" ")) return [];
    return members.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 6);
  }, [comment, members]);

  const patchLocal = (partial) => onChanged({ ...issue, ...partial });

  const changeStatus = async (newStatusId) => {
    if (newStatusId === issue.status) return;
    const prev = { ...issue };
    try {
      const { updated, newLog } = await api.applyStatusChangeWithTimer({
        issue,
        newStatusId,
        statuses: project.statuses,
        userId: currentUser.id,
      });
      onChanged({
        ...issue,
        ...updated,
        comments: issue.comments,
        timeLogs: newLog ? [...(issue.timeLogs || []), newLog] : issue.timeLogs,
        attachments: issue.attachments,
        links: issue.links,
        watchers: issue.watchers,
        activity: issue.activity,
      });
      if (newLog) toastSuccess(`Status updated · ${fmtMinutes(newLog.minutes)} auto-logged`);
      else if (api.isInProgressStatus(project.statuses, newStatusId)) toastSuccess("Status updated · timer started");
      else toastSuccess("Status updated");
    } catch (e) {
      patchLocal(prev);
      toastError(e.message);
    }
  };

  const update = async (patch) => {
    if (patch.status != null) {
      await changeStatus(patch.status);
      return;
    }
    const prev = { ...issue };
    patchLocal(patch);
    try {
      const updated = await api.updateIssue(issue.id, patch, currentUser.id, prev);
      onChanged({
        ...issue,
        ...patch,
        ...updated,
        comments: issue.comments,
        timeLogs: issue.timeLogs,
        attachments: issue.attachments,
        links: issue.links,
        watchers: issue.watchers,
        activity: issue.activity,
      });
      const field = Object.keys(patch)[0];
      const labels = {
        status: "Status updated",
        title: "Title updated",
        description: "Description updated",
        assignee: "Assignee updated",
        priority: "Priority updated",
        type: "Type updated",
        labels: "Labels updated",
        epicId: "Epic updated",
        dueDate: "Due date updated",
        storyPoints: "Story points updated",
        estimatedMinutes: "Estimate updated",
      };
      toastSuccess(labels[field] || "Issue updated");
    } catch (e) {
      patchLocal(prev);
      toastError(e.message);
    }
  };

  const addLabel = () => {
    const v = labelInput.trim();
    if (v && !issue.labels.includes(v)) update({ labels: [...issue.labels, v] });
    setLabelInput("");
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      const c = await api.addComment(issue.id, currentUser.id, comment.trim());
      patchLocal({ comments: [...issue.comments, c] });
      setComment("");
      setMentionOpen(false);
      toastSuccess("Comment added");
    } catch (e) {
      toastError(e.message);
    }
  };

  const saveEditComment = async (id) => {
    try {
      const c = await api.updateComment(id, editCommentText.trim());
      patchLocal({ comments: issue.comments.map((x) => (x.id === id ? c : x)) });
      setEditingCommentId(null);
    } catch (e) {
      toastError(e.message);
    }
  };

  const removeComment = async (id) => {
    try {
      await api.deleteComment(id);
      patchLocal({ comments: issue.comments.filter((x) => x.id !== id) });
    } catch (e) {
      toastError(e.message);
    }
  };

  const onLogTime = async (mins, note) => {
    try {
      const log = await api.addTimeLog(issue.id, currentUser.id, mins, note, null);
      patchLocal({ timeLogs: [...timeLogs, log] });
      setLogging(false);
      toastSuccess("Time logged");
    } catch (e) {
      toastError(e.message);
    }
  };

  const saveEditTimeLog = async (id, mins, note) => {
    try {
      const updated = await api.updateTimeLog(id, { minutes: mins, note });
      patchLocal({ timeLogs: timeLogs.map((t) => (t.id === id ? updated : t)) });
      setEditingTimeLogId(null);
      toastSuccess("Time log updated");
    } catch (e) {
      toastError(e.message);
    }
  };

  const removeTimeLog = async (id) => {
    try {
      await api.deleteTimeLog(id);
      patchLocal({ timeLogs: timeLogs.filter((t) => t.id !== id) });
      if (editingTimeLogId === id) setEditingTimeLogId(null);
      toastSuccess("Time log deleted");
    } catch (e) {
      toastError(e.message);
    }
  };

  const addChild = async () => {
    if (!subtaskTitle.trim() || !showChildSection || creatingSub) return;
    if (!childTypesAllowed.includes(subtaskType)) {
      toastError(`${TYPES[subtaskType]?.label || subtaskType} cannot be added here.`);
      return;
    }
    setCreatingSub(true);
    try {
      await onCreateChild({
        title: subtaskTitle.trim(),
        type: subtaskType,
        parentId: issue.id,
        sprintId: issue.sprintId,
        epicId: issue.type === "epic" ? issue.id : issue.epicId,
      });
      setSubtaskTitle("");
      setSubtaskType(defaultChildType(issue.type));
    } catch (e) {
      toastError(e.message);
    } finally {
      setCreatingSub(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const att = await api.uploadAttachment(issue.id, currentUser.id, file);
      patchLocal({ attachments: [...(issue.attachments || []), att] });
    } catch (err) {
      toastError(err.message);
    }
    e.target.value = "";
  };

  const removeAtt = async (att) => {
    try {
      await api.deleteAttachment(att);
      patchLocal({ attachments: issue.attachments.filter((a) => a.id !== att.id) });
    } catch (e) {
      toastError(e.message);
    }
  };

  const addLink = async () => {
    if (!linkTarget) return;
    try {
      const link = await api.addIssueLink(issue.id, linkTarget, linkType, currentUser.id);
      patchLocal({ links: [...(issue.links || []), link] });
      setLinkTarget("");
    } catch (e) {
      toastError(e.message);
    }
  };

  const removeLink = async (id) => {
    try {
      await api.deleteIssueLink(id);
      patchLocal({ links: issue.links.filter((l) => l.id !== id) });
    } catch (e) {
      toastError(e.message);
    }
  };

  const toggleWatch = async () => {
    try {
      const nowWatching = await api.toggleWatcher(issue.id, currentUser.id, watching);
      const watchers = nowWatching
        ? [...(issue.watchers || []), currentUser.id]
        : (issue.watchers || []).filter((id) => id !== currentUser.id);
      patchLocal({ watchers });
    } catch (e) {
      toastError(e.message);
    }
  };

  const insertMention = (u) => {
    const at = comment.lastIndexOf("@");
    const next = `${comment.slice(0, at)}@${u.name} `;
    setComment(next);
    setMentionOpen(false);
  };

  const dueValue = issue.dueDate
    ? new Date(issue.dueDate).toISOString().slice(0, 10)
    : "";

  const linkRows = (issue.links || []).map((l) => {
    const otherId = l.sourceIssueId === issue.id ? l.targetIssueId : l.sourceIssueId;
    const other = allIssues.find((i) => i.id === otherId);
    return { ...l, other };
  });

  return (
    <Modal onClose={onClose} width={860}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TypeIcon type={issue.type} />
          <span style={{ fontSize: 12.5, color: C.faint, fontWeight: 700 }}>{issue.key}</span>
          {isSubtask && parentIssue && (
            <span
              onClick={() => onOpenIssue?.(parentIssue.id)}
              style={{ fontSize: 12, color: C.primary, fontWeight: 600, cursor: "pointer" }}
              title="Open parent"
            >
              ↳ {parentIssue.key}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={toggleWatch} title={watching ? "Unwatch" : "Watch"} style={{ background: "transparent", border: "none", cursor: "pointer", color: watching ? C.primary : C.faint, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
            {watching ? <Eye size={16} /> : <EyeOff size={16} />}
            {watching ? "Watching" : "Watch"}
          </button>
          <Trash2
            size={16}
            color={C.faint}
            style={{ cursor: "pointer" }}
            title="Delete issue"
            onClick={async () => {
              const ok = await onDeleteIssue?.();
              if (ok) {
                onDeleted?.();
                onClose();
              }
            }}
          />
          <X size={18} color={C.faint} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
      </div>

      <div style={{ display: "flex", maxHeight: "78vh" }}>
        <div style={{ flex: 1.65, padding: "16px 20px", overflowY: "auto" }}>
          <input
            data-field="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "transparent";
              const next = e.target.value.trim();
              if (!next) {
                setTitle(issue.title || "");
                return;
              }
              setTitle(next);
              if (next !== issue.title) update({ title: next });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="Issue title"
            style={{
              width: "100%", border: `1px solid transparent`, borderRadius: 4, outline: "none",
              fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 16, padding: "6px 8px",
              background: "transparent", boxSizing: "border-box",
            }}
          />

          <Field label="Description">
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => update({ description: desc })}
              placeholder="Add a description..." rows={4}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </Field>

          {issue.parentId && (
            <Field label="Parent">
              <div
                onClick={() => parentIssue && onOpenIssue?.(parentIssue.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
                  border: `1px solid ${C.border}`, background: C.bg, cursor: parentIssue ? "pointer" : "default",
                }}
              >
                {parentIssue ? (
                  <>
                    <TypeIcon type={parentIssue.type} size={12} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.faint }}>{parentIssue.key}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{parentIssue.title}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: C.faint }}>Parent issue unavailable</span>
                )}
              </div>
              {isSubtask && (
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>Subtasks cannot have children.</div>
              )}
            </Field>
          )}

          {showChildSection && (
            <Field label={`${childSectionLabel(issue.type)} (${childDoneCount}/${displayChildren.length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                {displayChildren.map((c) => {
                  const st = statusMeta(project.statuses, c.status);
                  return (
                    <div
                      key={c.id}
                      onClick={() => onOpenIssue?.(c.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5,
                        border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer",
                      }}
                    >
                      <TypeIcon type={c.type} size={12} />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: C.faint, width: 56 }}>{c.key}</span>
                      <span style={{ flex: 1, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                      <span style={{ background: st?.bg, color: st?.text, fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>{st?.label}</span>
                      <Avatar user={users.find((u) => u.id === c.assignee)} size={20} />
                    </div>
                  );
                })}
                {displayChildren.length === 0 && (
                  <div style={{ fontSize: 12.5, color: C.faint, padding: "4px 0" }}>
                    No {childSectionLabel(issue.type).toLowerCase()} yet.
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {childTypesAllowed.length > 1 && (
                  <select value={subtaskType} onChange={(e) => setSubtaskType(e.target.value)} style={{ ...selStyle, width: 110 }}>
                    {childTypesAllowed.map((k) => <option key={k} value={k}>{TYPES[k].label}</option>)}
                  </select>
                )}
                <input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChild()}
                  placeholder={childCreatePlaceholder(issue.type)} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addChild} disabled={creatingSub}
                  style={{ border: "none", background: C.primary, color: "#fff", borderRadius: 4, padding: "0 12px", height: 34, cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: creatingSub ? 0.6 : 1 }}>
                  Create
                </button>
              </div>
            </Field>
          )}

          <Field label="Labels">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {issue.labels.map((l) => <Chip key={l} onRemove={() => update({ labels: issue.labels.filter((x) => x !== l) })}>{l}</Chip>)}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLabel()}
                placeholder="Add a label and press Enter" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addLabel} style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 4, padding: "0 12px", cursor: "pointer", fontSize: 13 }}>Add</button>
            </div>
          </Field>

          <Field label="Attachments">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {(issue.attachments || []).map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <Paperclip size={13} color={C.faint} />
                  <a href={api.attachmentPublicUrl(a.filePath)} target="_blank" rel="noreferrer" style={{ color: C.primary, flex: 1 }}>{a.fileName}</a>
                  <Trash2 size={13} color={C.faint} style={{ cursor: "pointer" }} onClick={() => removeAtt(a)} />
                </div>
              ))}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Upload file
            </button>
            <input ref={fileRef} type="file" hidden onChange={onFile} />
          </Field>

          <Field label="Linked issues">
            {linkRows.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 4 }}>
                <Link2 size={12} color={C.faint} />
                <span style={{ color: C.subtle }}>{LINK_TYPES.find((t) => t.value === l.linkType)?.label || l.linkType}</span>
                <span
                  style={{ fontWeight: 600, color: C.primary, cursor: l.other ? "pointer" : "default" }}
                  onClick={() => l.other && onOpenIssue?.(l.other.id)}
                >{l.other?.key || "?"}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.other?.title}</span>
                <Trash2 size={12} color={C.faint} style={{ cursor: "pointer" }} onClick={() => removeLink(l.id)} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <select value={linkType} onChange={(e) => setLinkType(e.target.value)} style={{ ...selStyle, width: 140 }}>
                {LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} style={{ ...selStyle, flex: 1 }}>
                <option value="">Select issue…</option>
                {allIssues.filter((i) => i.id !== issue.id).map((i) => (
                  <option key={i.id} value={i.id}>{i.key} — {i.title}</option>
                ))}
              </select>
              <button onClick={addLink} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "0 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Link</button>
            </div>
          </Field>

          <div style={{ display: "flex", gap: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
            {["comments", "activity"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: "transparent", border: "none", borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent",
                padding: "8px 4px", fontSize: 13, fontWeight: 700, color: tab === t ? C.primary : C.subtle, cursor: "pointer", textTransform: "capitalize",
              }}>{t} {t === "comments" ? `(${issue.comments.length})` : `(${(issue.activity || []).length})`}</button>
            ))}
          </div>

          {tab === "comments" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 10 }}>
                {issue.comments.map((c) => {
                  const author = users.find((u) => u.id === c.authorId);
                  const mine = c.authorId === currentUser.id;
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 8 }}>
                      <Avatar user={author} size={26} />
                      <div style={{ flex: 1, background: C.bg, borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{author ? author.name : "Unknown"}</span>
                          <span style={{ fontSize: 11, color: C.faint }}>{new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          {mine && (
                            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                              <Pencil size={12} color={C.faint} style={{ cursor: "pointer" }} onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }} />
                              <Trash2 size={12} color={C.faint} style={{ cursor: "pointer" }} onClick={() => removeComment(c.id)} />
                            </span>
                          )}
                        </div>
                        {editingCommentId === c.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input style={{ ...inputStyle, flex: 1 }} value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} />
                            <button onClick={() => saveEditComment(c.id)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "0 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            <button onClick={() => setEditingCommentId(null)} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "0 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: C.text }}>{renderMentions(c.text, members)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <Avatar user={currentUser} size={26} />
                  <div style={{ flex: 1, display: "flex", gap: 6 }}>
                    <input value={comment} onChange={(e) => { setComment(e.target.value); setMentionOpen(e.target.value.includes("@")); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && comment.trim()) submitComment(); }}
                      placeholder="Add a comment… use @name to mention" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={submitComment}
                      style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "0 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>
                {mentionOpen && mentionCandidates.length > 0 && (
                  <div style={{ position: "absolute", left: 34, right: 50, bottom: "100%", marginBottom: 4, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: "0 4px 12px rgba(9,30,66,0.12)", zIndex: 5 }}>
                    {mentionCandidates.map((u) => (
                      <div key={u.id} onClick={() => insertMention(u)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13 }}>
                        <Avatar user={u} size={22} /> {u.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(issue.activity || []).length === 0 && <div style={{ fontSize: 13, color: C.faint }}>No activity yet.</div>}
              {(issue.activity || []).map((a) => (
                <div key={a.id} style={{ fontSize: 12.5, color: C.text, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>{activityLabel(a, users, project.statuses, allIssues)}</div>
                  <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, padding: "16px 20px", background: C.bg, overflowY: "auto" }}>
          <Field label="Status">
            <StatusBadge status={issue.status} statuses={project.statuses} onChange={changeStatus} />
          </Field>
          <Field label="Type">
            <select value={issue.type} onChange={(e) => update({ type: e.target.value })} style={selStyle}>
              {allowedTypeOptions(issue, parentIssue).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          {!issue.parentId && issue.type !== "epic" && !isSubtask && (
            <Field label="Epic">
              <select value={issue.epicId || ""} onChange={(e) => update({ epicId: e.target.value || null })} style={selStyle}>
                <option value="">No epic</option>
                {epics.map((e) => <option key={e.id} value={e.id}>{e.key} — {e.title}</option>)}
              </select>
            </Field>
          )}
          <Field label="Assignee">
            <select value={issue.assignee || ""} onChange={(e) => update({ assignee: e.target.value || null })} style={selStyle}>
              <option value="">Unassigned</option>
              {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={issue.priority} onChange={(e) => update({ priority: e.target.value })} style={selStyle}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={dueValue} onChange={(e) => update({ dueDate: e.target.value ? new Date(e.target.value).getTime() : null })} style={inputStyle} />
          </Field>
          <Field label="Story points">
            <input type="number" min="0" step="0.5" value={issue.storyPoints ?? ""} onChange={(e) => update({ storyPoints: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="e.g. 3" style={inputStyle} />
          </Field>
          <Field label="Original estimate">
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" min="0" value={issue.estimatedMinutes != null ? Math.floor(issue.estimatedMinutes / 60) : ""}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10) || 0;
                  const m = (issue.estimatedMinutes || 0) % 60;
                  update({ estimatedMinutes: h * 60 + m || null });
                }}
                placeholder="h" style={{ ...inputStyle, width: 70 }} />
              <span style={{ fontSize: 12, color: C.subtle }}>h</span>
              <input type="number" min="0" max="59" value={issue.estimatedMinutes != null ? issue.estimatedMinutes % 60 : ""}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10) || 0;
                  const h = Math.floor((issue.estimatedMinutes || 0) / 60);
                  update({ estimatedMinutes: h * 60 + m || null });
                }}
                placeholder="m" style={{ ...inputStyle, width: 70 }} />
              <span style={{ fontSize: 12, color: C.subtle }}>m</span>
            </div>
            {issue.estimatedMinutes != null && (
              <div style={{ fontSize: 11.5, color: C.subtle, marginTop: 6 }}>
                Estimate {fmtMinutes(issue.estimatedMinutes)} · Logged {fmtMinutes(totalMinutes)}
                {totalMinutes > issue.estimatedMinutes ? " (over)" : totalMinutes > 0 ? ` · Remaining ${fmtMinutes(Math.max(0, issue.estimatedMinutes - totalMinutes))}` : ""}
              </div>
            )}
          </Field>

          <Field label="Time tracking">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, color: C.text, fontWeight: 600 }}>
              <Clock size={14} color={C.subtle} /> {totalMinutes > 0 ? `${fmtMinutes(totalMinutes)} logged` : "No time logged yet"}
            </div>
            {tracking && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 10px",
                background: C.progBg, borderRadius: 6, border: `1px solid ${C.primary}33`,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.primary,
                  boxShadow: `0 0 0 3px ${C.primary}33`, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.progText }}>Auto-tracking</div>
                  <div style={{ fontSize: 11.5, color: C.subtle }}>
                    {elapsedLabel ? `Running ${elapsedLabel}` : "Starting…"} · saved when you leave In Progress
                  </div>
                </div>
              </div>
            )}
            {logging ? (
              <LogTimeForm onCancel={() => setLogging(false)} onSave={onLogTime} />
            ) : (
              <button
                type="button"
                onClick={() => { setEditingTimeLogId(null); setLogging(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}
              >
                <Plus size={13} /> Log time
              </button>
            )}
            {timeLogs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...timeLogs].reverse().map((l) => {
                  const author = users.find((u) => u.id === l.userId);
                  const isOwner = l.userId === currentUser.id;
                  if (editingTimeLogId === l.id) {
                    return (
                      <div key={l.id}>
                        <LogTimeForm
                          key={l.id}
                          initialMinutes={l.minutes}
                          initialNote={l.note || ""}
                          saveLabel="Update"
                          onCancel={() => setEditingTimeLogId(null)}
                          onSave={(mins, note) => saveEditTimeLog(l.id, mins, note)}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={l.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Avatar user={author} size={20} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text }}>
                          <span style={{ fontWeight: 700 }}>{fmtMinutes(l.minutes)}</span> by {author ? author.name.split(" ")[0] : "Unknown"}
                        </div>
                        {l.note && <div style={{ fontSize: 11.5, color: C.subtle }}>{l.note}</div>}
                        <div style={{ fontSize: 10.5, color: C.faint }}>{fmtDate(l.date)}</div>
                      </div>
                      {isOwner && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                          <Pencil
                            size={12}
                            color={C.faint}
                            style={{ cursor: "pointer" }}
                            title="Edit time log"
                            onClick={() => { setLogging(false); setEditingTimeLogId(l.id); }}
                          />
                          <Trash2
                            size={12}
                            color={C.faint}
                            style={{ cursor: "pointer" }}
                            title="Delete time log"
                            onClick={() => removeTimeLog(l.id)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="Watchers">
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(issue.watchers || []).map((id) => (
                <Avatar key={id} user={users.find((u) => u.id === id)} size={24} />
              ))}
              {(issue.watchers || []).length === 0 && <span style={{ fontSize: 12, color: C.faint }}>None yet</span>}
            </div>
          </Field>

          <Field label="Reporter">
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Avatar user={users.find((u) => u.id === issue.reporter)} size={22} />
              {users.find((u) => u.id === issue.reporter)?.name || "Unknown"}
            </div>
          </Field>
          <Field label="Created">
            <div style={{ fontSize: 12.5, color: C.subtle, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={13} /> {new Date(issue.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export { TypeIcon, StatusBadge, LogTimeForm };
