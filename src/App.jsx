import { useState, useEffect, useCallback } from "react";
import { LogOut, Settings, LayoutGrid, ListTodo, Rocket, Clock, User } from "lucide-react";
import { supabase } from "./lib/supabase";
import * as api from "./lib/api";
import { C, selStyle, fmtMinutes, TYPES } from "./lib/theme";
import { typeLabel } from "./lib/issueHierarchy";
import { BuildVersion } from "./lib/version";
import { toastSuccess, toastError, toastInfo, toastConfirm } from "./lib/toast";
import { Avatar } from "./components/ui";
import AuthScreen from "./components/AuthScreen";
import ProfileModal from "./components/ProfileModal";
import IssueModal from "./components/IssueModal";
import {
  FilterBar, BoardView, BacklogView, SprintsView, ReportsView,
  CreateProjectModal, CreateSprintModal, StartSprintModal, ProjectSettingsModal,
} from "./components/Views";

const VIEW_LABELS = {
  board: "Board",
  backlog: "Backlog",
  sprints: "Sprints",
  reports: "Reports",
};
export default function App() {
  const [session, setSession] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [view, setView] = useState("board");
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [startSprintTarget, setStartSprintTarget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [memberError, setMemberError] = useState("");

  const refreshWorkspace = useCallback(async (userId) => {
    const ws = await api.loadWorkspace(userId);
    setWorkspace(ws);
    setCurrentProjectId((prev) => {
      if (prev && ws.projects.some((p) => p.id === prev)) return prev;
      return ws.projects[0]?.id || null;
    });
    return ws;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await api.getSession();
        if (!mounted) return;
        setSession(s);
        if (s?.user) {
          let profile = await api.fetchProfile(s.user.id);
          if (!profile) {
            await supabase.from("profiles").upsert({
              id: s.user.id,
              name: s.user.user_metadata?.name || s.user.email,
              email: s.user.email,
            });
            profile = await api.fetchProfile(s.user.id);
          }
          setCurrentUser(profile);
          await refreshWorkspace(s.user.id);
        }
      } catch (e) {
        setLoadError(e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s?.user) {
        const profile = await api.fetchProfile(s.user.id);
        setCurrentUser(profile);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (event === "SIGNED_IN") setWorkspace(null);
          try { await refreshWorkspace(s.user.id); } catch (_) {}
        }
      } else {
        setCurrentUser(null);
        setWorkspace(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshWorkspace]);

  if (loading || session === undefined || (session && currentUser && workspace === null)) {
  return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontFamily: "-apple-system,sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!session || !currentUser) {
  return (
      <AuthScreen
        onAuthed={async (s) => {
          setSession(s);
          setWorkspace(null);
          const profile = await api.fetchProfile(s.user.id);
          setCurrentUser(profile);
          setLoading(true);
          try {
            await refreshWorkspace(s.user.id);
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (loadError) {
  return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: C.danger, padding: 24, textAlign: "center" }}>
        {loadError}
        <br />
        <span style={{ color: C.subtle, fontSize: 13 }}>Make sure you ran the SQL schema + extensions in Supabase.</span>
    </div>
  );
}

  const projects = workspace?.projects || [];
  const issues = workspace?.issues || [];
  const sprints = workspace?.sprints || [];
  const users = workspace?.users || [];
  const project = projects.find((p) => p.id === currentProjectId) || projects[0];

  if (!project) {
  return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: C.subtle, marginBottom: 12 }}>You don't have any projects yet.</p>
          <button onClick={() => setShowCreateProject(true)} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>
            Create your first project
          </button>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => api.signOut()} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 12 }}>Sign out</button>
          </div>
        </div>
        {showCreateProject && (
          <CreateProjectModal
            onClose={() => setShowCreateProject(false)}
            onCreate={async (name, key) => {
              try {
                const np = await api.createProject(currentUser.id, name, key);
                setWorkspace((w) => ({ ...w, projects: [...(w?.projects || []), np] }));
                setCurrentProjectId(np.id);
                setShowCreateProject(false);
                toastSuccess(`Project "${name}" created`);
              } catch (e) {
                toastError(e.message);
              }
            }}
          />
      )}
    </div>
  );
}

  const projectIssues = issues.filter((i) => i.projectId === project.id);
  const projectSprints = sprints.filter((s) => s.projectId === project.id);
  const activeSprint = projectSprints.find((s) => s.status === "active");
  const members = users.filter((u) => project.members.includes(u.id));

  const allLabels = [...new Set(projectIssues.flatMap((i) => i.labels))];
  const passesFilter = (issue) => {
    if (search && !(`${issue.title} ${issue.key}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (labelFilter.length && !labelFilter.some((l) => issue.labels.includes(l))) return false;
    if (onlyMine && issue.assignee !== currentUser.id) return false;
    return true;
  };
  const filteredIssues = projectIssues.filter(passesFilter);
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  const setIssues = (updater) => {
    setWorkspace((w) => ({
      ...w,
      issues: typeof updater === "function" ? updater(w.issues) : updater,
    }));
  };

  const createIssue = async (data) => {
    try {
      const statusId = data.status || project.statuses[0]?.id;
      const issue = await api.createIssue({
        projectId: project.id,
        projectKey: project.key,
        userId: currentUser.id,
        title: data.title,
        type: data.type,
        statusId,
        sprintId: data.sprintId ?? null,
        parentId: data.parentId ?? null,
        epicId: data.epicId ?? null,
      });
      try {
        await api.toggleWatcher(issue.id, currentUser.id, false);
        issue.watchers = [currentUser.id];
      } catch (_) {}
      setIssues((list) => [...list, issue]);
      toastSuccess(data.parentId ? `${typeLabel(data.type)} ${issue.key} created` : `Issue ${issue.key} created`);
      return issue;
    } catch (e) {
      toastError(e.message);
      throw e;
    }
  };

  const updateIssueLocal = async (id, patch) => {
    const prev = issues.find((i) => i.id === id);
    if (!prev) return;

    if (patch.status != null && patch.status !== prev.status) {
      try {
        const { updated, newLog } = await api.applyStatusChangeWithTimer({
          issue: prev,
          newStatusId: patch.status,
          statuses: project.statuses,
          userId: currentUser.id,
        });
        setIssues((list) =>
          list.map((i) => {
            if (i.id !== id) return i;
            return {
              ...i,
              ...updated,
              timeLogs: newLog ? [...(i.timeLogs || []), newLog] : i.timeLogs,
            };
          })
        );
        if (newLog) toastSuccess(`Status updated · ${fmtMinutes(newLog.minutes)} auto-logged`);
        else if (api.isInProgressStatus(project.statuses, patch.status)) toastSuccess("Status updated · timer started");
        else toastSuccess("Status updated");
      } catch (e) {
        toastError(e.message);
      }
      return;
    }

    setIssues((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    try {
      await api.updateIssue(id, patch, currentUser.id, prev || {});
      const field = Object.keys(patch)[0];
      const labels = {
        status: "Status updated",
        title: "Title updated",
        sprintId: "Sprint updated",
        assignee: "Assignee updated",
        priority: "Priority updated",
        type: "Type updated",
      };
      toastSuccess(labels[field] || "Issue updated");
    } catch (e) {
      setIssues((list) => list.map((i) => (i.id === id ? prev : i)));
      toastError(e.message);
    }
  };

  const deleteIssue = async (id) => {
    const target = issues.find((i) => i.id === id);
    const childCount = issues.filter((i) => i.parentId === id).length;
    const label = target ? `${target.key} — ${target.title}` : "this issue";
    const msg = childCount > 0
      ? `Delete "${label}"?\n\nThis will also permanently delete ${childCount} subtask${childCount === 1 ? "" : "s"}. This cannot be undone.`
      : `Delete "${label}"?\n\nThis cannot be undone.`;
    const ok = await toastConfirm(msg, { confirmLabel: "Delete" });
    if (!ok) return false;
    try {
      await api.deleteIssue(id);
      setIssues((list) => list.filter((i) => i.id !== id && i.parentId !== id));
      if (selectedIssueId === id) setSelectedIssueId(null);
      toastSuccess(target ? `${target.key} deleted` : "Issue deleted");
    return true;
    } catch (e) {
      toastError(e.message);
      return false;
    }
  };

  const startSprint = async (sprintId, startDate, endDate) => {
    try {
      await api.startSprint(project.id, sprintId, { startDate, endDate });
      setStartSprintTarget(null);
      await refreshWorkspace(currentUser.id);
      toastSuccess("Sprint started");
    } catch (e) {
      toastError(e.message);
    }
  };
  const requestStartSprint = (sprintId) => {
    const sprint = projectSprints.find((s) => s.id === sprintId);
    if (!sprint) return;
    if (!sprint.startDate || !sprint.endDate) {
      setStartSprintTarget(sprint);
      return;
    }
    startSprint(sprintId, sprint.startDate, sprint.endDate);
  };
  const updateSprintDetails = async (sprintId, patch) => {
    try {
      const updated = await api.updateSprint(sprintId, patch);
      setWorkspace((w) => ({
        ...w,
        sprints: w.sprints.map((s) => (s.id === sprintId ? updated : s)),
      }));
      toastSuccess("Sprint updated");
    } catch (e) {
      toastError(e.message);
    }
  };
  const completeSprint = async (sprintId) => {
    const sprint = projectSprints.find((s) => s.id === sprintId);
    const ok = await toastConfirm(
      `Complete "${sprint?.name || "this sprint"}"?\n\nIssues stay in the sprint; you can reopen it if this was a mistake.`,
      { confirmLabel: "Complete", cancelLabel: "Cancel" }
    );
    if (!ok) return;
    try {
      await api.completeSprint(sprintId);
      setWorkspace((w) => ({
        ...w,
        sprints: w.sprints.map((s) => (s.id === sprintId ? { ...s, status: "completed" } : s)),
      }));
      toastSuccess("Sprint completed");
    } catch (e) {
      toastError(e.message);
    }
  };
  const reopenSprint = async (sprintId) => {
    const sprint = projectSprints.find((s) => s.id === sprintId);
    const ok = await toastConfirm(
      `Reopen "${sprint?.name || "this sprint"}"?\n\nIt will become the active sprint again.`,
      { confirmLabel: "Reopen", cancelLabel: "Cancel" }
    );
    if (!ok) return;
    try {
      await api.reopenSprint(project.id, sprintId);
      await refreshWorkspace(currentUser.id);
      toastSuccess("Sprint reopened");
    } catch (e) {
      toastError(e.message);
    }
  };
  const createSprint = async (name, goal, startDate, endDate) => {
    try {
      const sp = await api.createSprint(project.id, name, goal, startDate, endDate);
      setWorkspace((w) => ({ ...w, sprints: [...w.sprints, sp] }));
      setShowCreateSprint(false);
      toastSuccess(`Sprint "${name}" created`);
    } catch (e) {
      toastError(e.message);
    }
  };

  const addMember = async (email) => {
    setMemberError("");
    try {
      const profile = await api.addProjectMember(project.id, email);
      setWorkspace((w) => ({
        ...w,
        users: w.users.some((u) => u.id === profile.id) ? w.users : [...w.users, profile],
        projects: w.projects.map((p) =>
          p.id === project.id ? { ...p, members: [...p.members, profile.id] } : p
        ),
      }));
      toastSuccess(`${profile.name} added to project`);
    } catch (e) {
      setMemberError(e.message);
      toastError(e.message);
    }
  };

  const addStatus = async (label, color) => {
    try {
      const s = await api.addStatus(project.id, label, color);
      setWorkspace((w) => ({
        ...w,
        projects: w.projects.map((p) =>
          p.id === project.id ? { ...p, statuses: [...p.statuses, s] } : p
        ),
      }));
      toastSuccess(`Status "${label}" added`);
    } catch (e) {
      toastError(e.message);
    }
  };

  const deleteStatus = async (statusId) => {
    try {
      const remaining = project.statuses.filter((s) => s.id !== statusId);
      const removed = project.statuses.find((s) => s.id === statusId);
      await api.deleteStatus(statusId, project.id, remaining[0].id);
      setWorkspace((w) => ({
        ...w,
        projects: w.projects.map((p) =>
          p.id === project.id ? { ...p, statuses: remaining } : p
        ),
        issues: w.issues.map((i) =>
          i.projectId === project.id && i.status === statusId ? { ...i, status: remaining[0].id } : i
        ),
      }));
      toastSuccess(`Status "${removed?.label || ""}" removed`);
    } catch (e) {
      toastError(e.message);
    }
  };

  const toggleLabel = (l) => setLabelFilter((f) => (f.includes(l) ? f.filter((x) => x !== l) : [...f, l]));

  const goToView = (id) => {
    if (id === view) return;
    setView(id);
    toastInfo(`Switched to ${VIEW_LABELS[id] || id}`);
  };

  const navItem = (id, label, Icon) => (
    <div onClick={() => goToView(id)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer",
      borderRadius: 4, margin: "0 8px", fontSize: 13.5, fontWeight: 600,
      background: view === id ? C.primarySoft : "transparent", color: view === id ? C.primary : C.subtle,
    }}>
      <Icon size={16} /> {label}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background: C.bg, color: C.text }}>
      <div style={{ width: 232, background: "#fff", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 10px" }}>
          <svg width="24" height="24" viewBox="0 0 34 34">
            <rect x="2" y="2" width="14" height="14" rx="4" fill={C.primary} />
            <rect x="18" y="2" width="14" height="14" rx="4" fill="#2ABB7F" opacity="0.9" />
            <rect x="10" y="18" width="14" height="14" rx="4" fill="#8F7EE7" opacity="0.9" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Trackr</span>
        </div>

        <div style={{ padding: "6px 16px 12px" }}>
          <select
            value={project.id}
            onChange={(e) => {
              const next = projects.find((p) => p.id === e.target.value);
              setCurrentProjectId(e.target.value);
              setView("board");
              toastInfo(next ? `Switched to ${next.name}` : "Project changed");
            }}
            style={{ ...selStyle, fontWeight: 700 }}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowCreateProject(true)} style={{ flex: 1, fontSize: 12, border: `1px solid ${C.border}`, background: "#fff", borderRadius: 4, padding: "5px 0", cursor: "pointer", fontWeight: 600, color: C.subtle }}>+ Project</button>
            <button onClick={() => { setMemberError(""); setShowSettings(true); }} style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 4, padding: "5px 8px", cursor: "pointer" }}><Settings size={14} color={C.subtle} /></button>
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          {navItem("board", "Board", LayoutGrid)}
          {navItem("backlog", "Backlog", ListTodo)}
          {navItem("sprints", "Sprints", Rocket)}
          {navItem("reports", "Reports", Clock)}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setShowProfile(true)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
          <Avatar user={currentUser} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</div>
          </div>
          </div>
          <User size={15} color={C.faint} style={{ cursor: "pointer" }} onClick={() => setShowProfile(true)} title="Edit profile" />
          <LogOut size={16} color={C.faint} style={{ cursor: "pointer" }} onClick={() => api.signOut()} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {project.name} {view === "board" && activeSprint ? `· ${activeSprint.name}` : view === "board" ? "· Board" : view === "backlog" ? "· Backlog" : view === "sprints" ? "· Sprints" : "· Reports"}
          </h1>
        </div>

        {(view === "board" || view === "backlog") && (
          <FilterBar search={search} setSearch={setSearch} allLabels={allLabels} labelFilter={labelFilter}
            toggleLabel={toggleLabel} onlyMine={onlyMine} setOnlyMine={setOnlyMine} currentUser={currentUser} />
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {view === "board" && (
            <BoardView
              issues={activeSprint ? filteredIssues.filter((i) => i.sprintId === activeSprint.id) : []}
              users={members} allIssues={projectIssues} sprint={activeSprint} statuses={project.statuses}
              onOpen={setSelectedIssueId}
              onCreate={(data) => createIssue({ ...data, sprintId: activeSprint?.id || null })}
            />
          )}
          {view === "backlog" && (
            <BacklogView
              issues={filteredIssues} sprints={projectSprints} users={members} statuses={project.statuses}
              onOpen={setSelectedIssueId}
              onStatusChange={(id, s) => updateIssueLocal(id, { status: s })}
              onMoveSprint={(id, sid) => updateIssueLocal(id, { sprintId: sid })}
              onDelete={deleteIssue}
              onCreate={createIssue}
              onStartSprint={requestStartSprint}
              onCompleteSprint={completeSprint}
              onReopenSprint={reopenSprint}
              onUpdateSprint={updateSprintDetails}
              onCreateSprint={() => setShowCreateSprint(true)}
            />
          )}
          {view === "sprints" && (
            <SprintsView sprints={projectSprints} issues={projectIssues}
              onStartSprint={requestStartSprint} onCompleteSprint={completeSprint}
              onReopenSprint={reopenSprint}
              onUpdateSprint={updateSprintDetails}
              onCreateSprint={() => setShowCreateSprint(true)} />
          )}
          {view === "reports" && (
            <ReportsView
              issues={projectIssues}
              users={members}
              sprints={projectSprints}
              project={project}
              onOpenIssue={setSelectedIssueId}
            />
          )}
        </div>
      </div>
      <BuildVersion fixed />

      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          project={project}
          users={users}
          allIssues={projectIssues}
          currentUser={currentUser}
          onClose={() => setSelectedIssueId(null)}
          onChanged={(updated) => setIssues((list) => list.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)))}
          onDeleted={() => setSelectedIssueId(null)}
          onOpenIssue={setSelectedIssueId}
          onCreateChild={createIssue}
          onDeleteIssue={() => deleteIssue(selectedIssue.id)}
        />
      )}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={async (name, key) => {
            try {
              const np = await api.createProject(currentUser.id, name, key);
              setWorkspace((w) => ({ ...w, projects: [...w.projects, np] }));
          setCurrentProjectId(np.id);
          setShowCreateProject(false);
              toastSuccess(`Project "${name}" created`);
            } catch (e) {
              toastError(e.message);
            }
          }}
        />
      )}
      {showCreateSprint && (
        <CreateSprintModal onClose={() => setShowCreateSprint(false)} nextNum={projectSprints.length + 1} onCreate={createSprint} />
      )}
      {startSprintTarget && (
        <StartSprintModal
          sprint={startSprintTarget}
          onClose={() => setStartSprintTarget(null)}
          onStart={(sprintId, startDate, endDate) => startSprint(sprintId, startDate, endDate)}
        />
      )}
      {showSettings && (
        <ProjectSettingsModal project={project} users={users} error={memberError}
          onClose={() => setShowSettings(false)} onAddMember={addMember}
          onAddStatus={addStatus} onDeleteStatus={deleteStatus} />
      )}
      {showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onUpdated={(u) => {
            setCurrentUser(u);
            setWorkspace((w) => ({
              ...w,
              users: w.users.map((x) => (x.id === u.id ? u : x)),
            }));
            toastSuccess("Profile updated");
          }}
        />
      )}
    </div>
  );
}
