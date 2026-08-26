import { supabase } from "./supabase";
import { DEFAULT_STATUSES } from "./theme";
import {
  validateParentChild,
  validateRootCreate,
  validateTypeChange,
} from "./issueHierarchy";

/* ---------- mappers (DB snake_case → app camelCase) ---------- */

export function mapProfile(p) {
  if (!p) return null;
  return { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatar_url, createdAt: p.created_at };
}

export function mapStatus(s) {
  return {
    id: s.id,
    label: s.label,
    bg: s.bg,
    text: s.text_color,
    fixed: s.is_fixed,
    sortOrder: s.sort_order,
  };
}

export function mapProject(p, members = [], statuses = [], scopeFiles = []) {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    ownerId: p.owner_id,
    createdAt: p.created_at,
    descriptionHtml: p.description_html || "",
    websiteUrl: p.website_url || "",
    platform: p.platform || "",
    coverImageUrl: p.cover_image_url || null,
    clientName: p.client_name || "",
    clientEmail: p.client_email || "",
    clientSource: p.client_source || "",
    clientWebsite: p.client_website || "",
    clientImageUrl: p.client_image_url || null,
    updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : null,
    members: members.map((m) => m.user_id),
    memberRoles: Object.fromEntries(members.map((m) => [m.user_id, m.role])),
    statuses: statuses.map(mapStatus).sort((a, b) => a.sortOrder - b.sortOrder),
    scopeFiles: scopeFiles.map(mapScopeFile),
  };
}

export function mapScopeFile(f) {
  return {
    id: f.id,
    projectId: f.project_id,
    uploadedBy: f.uploaded_by,
    fileName: f.file_name,
    filePath: f.file_path || null,
    fileSize: f.file_size,
    mimeType: f.mime_type,
    kind: f.kind || "document",
    title: f.title || f.file_name || "",
    description: f.description || "",
    labels: f.labels || [],
    linkUrl: f.link_url || null,
    fileType: f.file_type || detectScopeFileType({
      mimeType: f.mime_type,
      fileName: f.file_name,
      linkUrl: f.link_url,
      kind: f.kind,
    }),
    collection: f.collection === "reference" ? "reference" : "client",
    createdAt: f.created_at ? new Date(f.created_at).getTime() : Date.now(),
    updatedAt: f.updated_at ? new Date(f.updated_at).getTime() : null,
  };
}

export function detectScopeFileType({ mimeType = "", fileName = "", linkUrl = "", kind = "" } = {}) {
  const url = (linkUrl || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (url.includes("docs.google.com/document") || url.includes("document/d/")) return "google_doc";
  if (url.includes("docs.google.com/spreadsheets") || url.includes("sheets.google.com") || url.includes("spreadsheets/d/")) {
    return "google_sheet";
  }
  if (url && !name) return "link";
  if (kind === "image" || mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return "image";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessing") ||
    /\.(docx?|rtf)$/i.test(name)
  ) return "word";
  if (url) return "link";
  return "document";
}

export function scopeFileOpenUrl(file) {
  if (file.linkUrl) return file.linkUrl.startsWith("http") ? file.linkUrl : `https://${file.linkUrl}`;
  if (file.filePath) return scopeFilePublicUrl(file.filePath);
  return null;
}

export function mapSprint(s) {
  return {
    id: s.id,
    projectId: s.project_id,
    name: s.name,
    status: s.status,
    startDate: s.start_date ? new Date(s.start_date).getTime() : null,
    endDate: s.end_date ? new Date(s.end_date).getTime() : null,
    goal: s.goal || "",
    createdAt: s.created_at,
  };
}

export function mapIssue(i, extras = {}) {
  return {
    id: i.id,
    projectId: i.project_id,
    key: i.key,
    type: i.type,
    status: i.status_id,
    priority: i.priority,
    title: i.title,
    description: i.description || "",
    assignee: i.assignee_id,
    reporter: i.reporter_id,
    labels: i.labels || [],
    sprintId: i.sprint_id,
    epicId: i.epic_id,
    parentId: i.parent_id || null,
    dueDate: i.due_date ? new Date(i.due_date).getTime() : null,
    storyPoints: i.story_points != null ? Number(i.story_points) : null,
    estimatedMinutes: i.estimated_minutes ?? null,
    timerStartedAt: i.timer_started_at ? new Date(i.timer_started_at).getTime() : null,
    createdAt: i.created_at ? new Date(i.created_at).getTime() : Date.now(),
    updatedAt: i.updated_at ? new Date(i.updated_at).getTime() : Date.now(),
    comments: extras.comments || [],
    timeLogs: extras.timeLogs || [],
    subtasks: extras.subtasks || [],
    attachments: extras.attachments || [],
    links: extras.links || [],
    watchers: extras.watchers || [],
    activity: extras.activity || [],
  };
}

export function mapComment(c) {
  return {
    id: c.id,
    authorId: c.author_id,
    text: c.text,
    createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
    updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
  };
}

export function mapTimeLog(t) {
  return {
    id: t.id,
    userId: t.user_id,
    minutes: t.minutes,
    note: t.note || "",
    date: t.log_date ? new Date(t.log_date).getTime() : Date.now(),
    subtaskId: t.subtask_id || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

export function mapSubtask(s) {
  return {
    id: s.id,
    issueId: s.issue_id,
    title: s.title,
    isDone: s.is_done,
    createdAt: s.created_at,
  };
}

export function mapAttachment(a) {
  return {
    id: a.id,
    issueId: a.issue_id,
    uploadedBy: a.uploaded_by,
    fileName: a.file_name,
    filePath: a.file_path,
    fileSize: a.file_size,
    mimeType: a.mime_type,
    createdAt: a.created_at,
  };
}

export function mapLink(l) {
  return {
    id: l.id,
    sourceIssueId: l.source_issue_id,
    targetIssueId: l.target_issue_id,
    linkType: l.link_type,
    createdBy: l.created_by,
    createdAt: l.created_at,
  };
}

export function mapActivity(a) {
  return {
    id: a.id,
    issueId: a.issue_id,
    userId: a.user_id,
    action: a.action,
    fromValue: a.from_value,
    toValue: a.to_value,
    createdAt: a.created_at ? new Date(a.created_at).getTime() : Date.now(),
  };
}

/* ---------- auth ---------- */

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      name,
      email,
    });
  }
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}?reset=1`,
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfile(userId, { name, avatarUrl }) {
  const patch = {};
  if (name != null) patch.name = name;
  if (avatarUrl !== undefined) patch.avatar_url = avatarUrl;
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
  if (error) throw error;
  if (name) await supabase.auth.updateUser({ data: { name } });
  return mapProfile(data);
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split(".").pop() || "png";
  const path = `avatars/${userId}.${ext}`;
  const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return data.publicUrl;
}

export async function removeAvatar(userId) {
  const { data: files } = await supabase.storage.from("attachments").list("avatars");
  const mine = (files || []).filter((f) => f.name.startsWith(`${userId}.`));
  if (mine.length) {
    await supabase.storage.from("attachments").remove(mine.map((f) => `avatars/${f.name}`));
  }
  return updateProfile(userId, { avatarUrl: null });
}

/* ---------- workspace load ---------- */

export async function loadWorkspace(userId) {
  const { data: memberships, error: mErr } = await supabase
    .from("project_members")
    .select("project_id, role")
    .eq("user_id", userId);
  if (mErr) throw mErr;

  const projectIds = (memberships || []).map((m) => m.project_id);
  if (!projectIds.length) {
    return { projects: [], sprints: [], issues: [], users: [], profilesById: {} };
  }

  const [{ data: projects, error: pErr }, { data: allMembers, error: amErr }, { data: statuses, error: sErr }, { data: sprints, error: spErr }, { data: issues, error: iErr }] =
    await Promise.all([
      supabase.from("projects").select("*").in("id", projectIds),
      supabase.from("project_members").select("*").in("project_id", projectIds),
      supabase.from("statuses").select("*").in("project_id", projectIds).order("sort_order"),
      supabase.from("sprints").select("*").in("project_id", projectIds),
      supabase.from("issues").select("*").in("project_id", projectIds).order("created_at"),
    ]);
  if (pErr) throw pErr;
  if (amErr) throw amErr;
  if (sErr) throw sErr;
  if (spErr) throw spErr;
  if (iErr) throw iErr;

  const userIds = [...new Set((allMembers || []).map((m) => m.user_id))];
  const { data: profiles, error: prErr } = await supabase.from("profiles").select("*").in("id", userIds);
  if (prErr) throw prErr;

  const issueIds = (issues || []).map((i) => i.id);
  let comments = [], timeLogs = [], subtasks = [], attachments = [], links = [], watchers = [], activity = [];
  if (issueIds.length) {
    const safe = async (promise) => {
      try {
        const res = await promise;
        if (res.error) {
          console.warn(res.error.message);
          return [];
        }
        return res.data || [];
      } catch (e) {
        console.warn(e);
        return [];
      }
    };
    const [c, t, st, at, lk, w, act] = await Promise.all([
      safe(supabase.from("comments").select("*").in("issue_id", issueIds).order("created_at")),
      safe(supabase.from("time_logs").select("*").in("issue_id", issueIds).order("log_date")),
      safe(supabase.from("subtasks").select("*").in("issue_id", issueIds).order("created_at")),
      safe(supabase.from("attachments").select("*").in("issue_id", issueIds).order("created_at")),
      safe(supabase.from("issue_links").select("*").or(`source_issue_id.in.(${issueIds.join(",")}),target_issue_id.in.(${issueIds.join(",")})`)),
      safe(supabase.from("issue_watchers").select("*").in("issue_id", issueIds)),
      safe(supabase.from("activity_log").select("*").in("issue_id", issueIds).order("created_at", { ascending: false })),
    ]);
    comments = c;
    timeLogs = t;
    subtasks = st;
    attachments = at;
    links = lk;
    watchers = w;
    activity = act;
  }

  let scopeFiles = [];
  {
    const safeScope = async (promise) => {
      try {
        const res = await promise;
        if (res.error) {
          console.warn(res.error.message);
          return [];
        }
        return res.data || [];
      } catch (e) {
        console.warn(e);
        return [];
      }
    };
    scopeFiles = await safeScope(
      supabase.from("project_scope_files").select("*").in("project_id", projectIds).order("created_at")
    );
  }

  const mappedProjects = (projects || []).map((p) =>
    mapProject(
      p,
      (allMembers || []).filter((m) => m.project_id === p.id),
      (statuses || []).filter((s) => s.project_id === p.id),
      (scopeFiles || []).filter((f) => f.project_id === p.id),
    ),
  );

  // Sync fixed workflow (To Do / Reopen / In Progress / Done) on every load
  for (let i = 0; i < mappedProjects.length; i++) {
    try {
      mappedProjects[i] = {
        ...mappedProjects[i],
        statuses: await ensureFixedStatuses(mappedProjects[i].id, mappedProjects[i].statuses),
      };
    } catch (e) {
      console.warn("ensureFixedStatuses failed", e);
    }
  }

  const mappedIssues = (issues || []).map((i) =>
    mapIssue(i, {
      comments: comments.filter((c) => c.issue_id === i.id).map(mapComment),
      timeLogs: timeLogs.filter((t) => t.issue_id === i.id).map(mapTimeLog),
      subtasks: subtasks.filter((s) => s.issue_id === i.id).map(mapSubtask),
      attachments: attachments.filter((a) => a.issue_id === i.id).map(mapAttachment),
      links: links
        .filter((l) => l.source_issue_id === i.id || l.target_issue_id === i.id)
        .map(mapLink),
      watchers: watchers.filter((w) => w.issue_id === i.id).map((w) => w.user_id),
      activity: activity.filter((a) => a.issue_id === i.id).map(mapActivity),
    }),
  );

  const users = (profiles || []).map(mapProfile);
  const profilesById = Object.fromEntries(users.map((u) => [u.id, u]));

  return {
    projects: mappedProjects,
    sprints: (sprints || []).map(mapSprint),
    issues: mappedIssues,
    users,
    profilesById,
  };
}

/* ---------- projects ---------- */

export async function createProject(ownerId, name, key) {
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name, key: key.toUpperCase(), owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;

  // Trigger usually adds owner membership; ignore duplicate if it already did
  const { error: mErr } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: ownerId,
    role: "owner",
  });
  if (mErr && mErr.code !== "23505") throw mErr;

  const statusRows = DEFAULT_STATUSES.map((s) => ({ ...s, project_id: project.id }));
  const { data: statuses, error: sErr } = await supabase.from("statuses").insert(statusRows).select();
  if (sErr) throw sErr;

  return mapProject(project, [{ user_id: ownerId, role: "owner" }], statuses, []);
}

export async function updateProject(projectId, patch) {
  const row = { updated_at: new Date().toISOString() };
  const map = {
    name: "name",
    key: "key",
    descriptionHtml: "description_html",
    websiteUrl: "website_url",
    platform: "platform",
    coverImageUrl: "cover_image_url",
    clientName: "client_name",
    clientEmail: "client_email",
    clientSource: "client_source",
    clientWebsite: "client_website",
    clientImageUrl: "client_image_url",
  };
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] === undefined) continue;
    let val = patch[k];
    if (k === "key" && val != null) val = String(val).toUpperCase().trim();
    row[col] = val;
  }
  const { data, error } = await supabase.from("projects").update(row).eq("id", projectId).select().single();
  if (error) throw error;
  return data;
}

export function scopeFilePublicUrl(filePath) {
  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadScopeFile(projectId, userId, file, meta = {}) {
  if (typeof meta === "string") meta = { kind: meta };
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `scope/${projectId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
  if (upErr) throw upErr;

  const isImage = (file.type || "").startsWith("image/") || meta.kind === "image";
  const title = (meta.title || file.name || "Untitled").trim();
  const fileType = meta.fileType || detectScopeFileType({
    mimeType: file.type,
    fileName: file.name,
    kind: isImage ? "image" : "document",
  });

  const { data, error } = await supabase
    .from("project_scope_files")
    .insert({
      project_id: projectId,
      uploaded_by: userId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
      kind: isImage ? "image" : "document",
      title,
      description: meta.description || "",
      labels: meta.labels || [],
      file_type: fileType,
      collection: meta.collection === "reference" ? "reference" : "client",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return mapScopeFile(data);
}

export async function addScopeLink(projectId, userId, { title, description = "", labels = [], linkUrl, collection = "client" }) {
  if (!linkUrl?.trim()) throw new Error("Link URL is required.");
  const url = linkUrl.trim();
  const fileType = detectScopeFileType({ linkUrl: url });
  const name = (title || url).trim() || "Link";

  const { data, error } = await supabase
    .from("project_scope_files")
    .insert({
      project_id: projectId,
      uploaded_by: userId,
      file_name: name,
      file_path: null,
      file_size: null,
      mime_type: "text/uri-list",
      kind: "link",
      title: name,
      description: description || "",
      labels: labels || [],
      link_url: url,
      file_type: fileType,
      collection: collection === "reference" ? "reference" : "client",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return mapScopeFile(data);
}

export async function updateScopeFile(fileId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) {
    row.title = patch.title;
    row.file_name = patch.title;
  }
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.labels !== undefined) row.labels = patch.labels;
  if (patch.linkUrl !== undefined) {
    row.link_url = patch.linkUrl;
    row.file_type = detectScopeFileType({
      linkUrl: patch.linkUrl,
      fileName: patch.title,
      mimeType: patch.mimeType,
    });
  }
  if (patch.fileType !== undefined) row.file_type = patch.fileType;
  const { data, error } = await supabase.from("project_scope_files").update(row).eq("id", fileId).select().single();
  if (error) throw error;
  return mapScopeFile(data);
}

export async function deleteScopeFile(fileId, filePath) {
  if (filePath) {
    await supabase.storage.from("attachments").remove([filePath]);
  }
  const { error } = await supabase.from("project_scope_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function uploadProjectImage(projectId, file, field = "cover") {
  const ext = file.name.split(".").pop() || "png";
  const path = `scope/${projectId}/${field}_${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  const patch = field === "client"
    ? { clientImageUrl: data.publicUrl }
    : { coverImageUrl: data.publicUrl };
  await updateProject(projectId, patch);
  return data.publicUrl;
}

export async function addProjectMember(projectId, email) {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error("No Trackr account found with that email.");

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: "member",
  });
  if (error) {
    if (error.code === "23505") throw new Error("Already a member.");
    throw error;
  }
  return mapProfile(profile);
}

export async function addStatus(projectId, label, color) {
  const { data: existing } = await supabase
    .from("statuses")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("statuses")
    .insert({
      project_id: projectId,
      label,
      bg: color.bg,
      text_color: color.text,
      is_fixed: false,
      sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return mapStatus(data);
}

/** Ensure every project has the 4 fixed statuses (To Do, Reopen, In Progress, Done). */
export async function ensureFixedStatuses(projectId, currentStatuses = []) {
  const byLabel = Object.fromEntries(
    currentStatuses.map((s) => [s.label.toLowerCase(), s])
  );
  const result = [...currentStatuses];

  for (const def of DEFAULT_STATUSES) {
    const key = def.label.toLowerCase();
    const existing = byLabel[key];
    if (existing) {
      const { data, error } = await supabase
        .from("statuses")
        .update({
          bg: def.bg,
          text_color: def.text_color,
          is_fixed: true,
          sort_order: def.sort_order,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (!error && data) {
        const mapped = mapStatus(data);
        const idx = result.findIndex((s) => s.id === existing.id);
        if (idx >= 0) result[idx] = mapped;
      }
    } else {
      const { data, error } = await supabase
        .from("statuses")
        .insert({
          project_id: projectId,
          label: def.label,
          bg: def.bg,
          text_color: def.text_color,
          is_fixed: true,
          sort_order: def.sort_order,
        })
        .select()
        .single();
      if (!error && data) result.push(mapStatus(data));
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function deleteStatus(statusId, projectId, fallbackStatusId) {
  await supabase.from("issues").update({ status_id: fallbackStatusId }).eq("status_id", statusId);
  const { error } = await supabase.from("statuses").delete().eq("id", statusId).eq("project_id", projectId);
  if (error) throw error;
}

/* ---------- sprints ---------- */

export async function createSprint(projectId, name, goal, startDate = null, endDate = null) {
  const { data, error } = await supabase
    .from("sprints")
    .insert({
      project_id: projectId,
      name,
      goal: goal || "",
      status: "future",
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSprint(data);
}

export async function updateSprint(sprintId, patch) {
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.name != null) row.name = patch.name;
  if (patch.goal != null) row.goal = patch.goal;
  if (patch.startDate !== undefined) row.start_date = patch.startDate ? new Date(patch.startDate).toISOString() : null;
  if (patch.endDate !== undefined) row.end_date = patch.endDate ? new Date(patch.endDate).toISOString() : null;
  const { data, error } = await supabase.from("sprints").update(row).eq("id", sprintId).select().single();
  if (error) throw error;
  return mapSprint(data);
}

export async function startSprint(projectId, sprintId, { startDate, endDate } = {}) {
  const { data: sprint, error: fetchErr } = await supabase
    .from("sprints")
    .select("start_date, end_date")
    .eq("id", sprintId)
    .single();
  if (fetchErr) throw fetchErr;

  const resolvedStart = startDate ?? (sprint.start_date ? new Date(sprint.start_date).getTime() : null);
  const resolvedEnd = endDate ?? (sprint.end_date ? new Date(sprint.end_date).getTime() : null);
  if (!resolvedStart || !resolvedEnd) {
    throw new Error("Start and end dates are required to start a sprint");
  }
  if (resolvedEnd < resolvedStart) {
    throw new Error("End date must be on or after the start date");
  }

  const { data: active } = await supabase
    .from("sprints")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "active");
  for (const s of active || []) {
    if (s.id !== sprintId) await updateSprint(s.id, { status: "future" });
  }
  return updateSprint(sprintId, {
    status: "active",
    startDate: resolvedStart,
    endDate: resolvedEnd,
  });
}

export async function completeSprint(sprintId) {
  return updateSprint(sprintId, { status: "completed" });
}

export async function reopenSprint(projectId, sprintId) {
  const { data: active } = await supabase
    .from("sprints")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "active");
  for (const s of active || []) {
    if (s.id !== sprintId) await updateSprint(s.id, { status: "future" });
  }
  return updateSprint(sprintId, { status: "active" });
}

/* ---------- issues ---------- */

async function nextIssueKey(projectId, projectKey) {
  const { count, error } = await supabase
    .from("issues")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) throw error;
  return `${projectKey}-${(count || 0) + 1}`;
}

async function fetchIssueBrief(id) {
  const { data, error } = await supabase
    .from("issues")
    .select("id, type, parent_id, sprint_id, epic_id")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function resolveEpicIdForParent(parentId) {
  let id = parentId;
  const seen = new Set();
  while (id && !seen.has(id)) {
    seen.add(id);
    const row = await fetchIssueBrief(id);
    if (row.type === "epic") return row.id;
    if (row.epic_id) return row.epic_id;
    id = row.parent_id;
  }
  return null;
}

export async function createIssue({
  projectId, projectKey, userId, title, type, statusId, sprintId, parentId = null, epicId = null,
}) {
  const childType = type || "task";

  if (parentId) {
    const parent = await fetchIssueBrief(parentId);
    const err = validateParentChild(parent.type, childType);
    if (err) throw new Error(err);
    if (sprintId == null) sprintId = parent.sprint_id;
    epicId = await resolveEpicIdForParent(parentId);
  } else {
    const err = validateRootCreate(childType);
    if (err) throw new Error(err);
  }

  const key = await nextIssueKey(projectId, projectKey);
  const { data, error } = await supabase
    .from("issues")
    .insert({
      project_id: projectId,
      key,
      type: childType,
      status_id: statusId,
      title,
      assignee_id: userId,
      reporter_id: userId,
      sprint_id: sprintId || null,
      parent_id: parentId || null,
      epic_id: epicId || null,
      priority: "medium",
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(data.id, userId, "created", null, title);
  if (parentId) {
    await logActivity(parentId, userId, "subtask_added", null, key);
  }
  return mapIssue(data, {
    comments: [],
    timeLogs: [],
    subtasks: [],
    attachments: [],
    links: [],
    watchers: [userId],
    activity: [],
  });
}

export async function updateIssue(issueId, patch, userId, prev = {}) {
  const nextType = patch.type !== undefined ? patch.type : prev.type;
  const nextParentId = patch.parentId !== undefined ? patch.parentId : (prev.parentId ?? null);

  if (patch.type !== undefined || patch.parentId !== undefined) {
    if (nextParentId) {
      const parent = await fetchIssueBrief(nextParentId);
      const err = validateParentChild(parent.type, nextType);
      if (err) throw new Error(err);
    } else {
      const err = validateRootCreate(nextType);
      if (err) throw new Error(err);
    }
  }

  if (patch.type !== undefined && patch.type !== prev.type) {
    const { data: children } = await supabase.from("issues").select("type").eq("parent_id", issueId);
    let parentType = null;
    if (nextParentId) {
      const parent = await fetchIssueBrief(nextParentId);
      parentType = parent.type;
    }
    const err = validateTypeChange(nextType, {
      parentType,
      childTypes: (children || []).map((c) => c.type),
    });
    if (err) throw new Error(err);
  }

  if (patch.parentId !== undefined && patch.parentId) {
    patch.epicId = await resolveEpicIdForParent(patch.parentId);
  }

  const row = { updated_at: new Date().toISOString() };
  const activity = [];

  const map = {
    title: "title",
    description: "description",
    type: "type",
    priority: "priority",
    labels: "labels",
    status: "status_id",
    assignee: "assignee_id",
    sprintId: "sprint_id",
    epicId: "epic_id",
    parentId: "parent_id",
    dueDate: "due_date",
    storyPoints: "story_points",
    estimatedMinutes: "estimated_minutes",
    timerStartedAt: "timer_started_at",
  };

  for (const [k, col] of Object.entries(map)) {
    if (patch[k] === undefined) continue;
    let val = patch[k];
    if (k === "dueDate") val = val ? new Date(val).toISOString() : null;
    if (k === "timerStartedAt") val = val ? new Date(val).toISOString() : null;
    row[col] = val;

    if (prev[k] !== undefined && String(prev[k]) !== String(patch[k])) {
      const action =
        k === "status" ? "status_changed" :
        k === "assignee" ? "assignee_changed" :
        k === "priority" ? "priority_changed" :
        k === "type" ? "type_changed" :
        k === "sprintId" ? "sprint_changed" :
        k === "epicId" ? "epic_changed" :
        k === "parentId" ? "parent_changed" :
        k === "dueDate" ? "due_date_changed" :
        k === "storyPoints" ? "story_points_changed" :
        k === "estimatedMinutes" ? "estimate_changed" :
        k === "title" ? "title_changed" :
        `${k}_changed`;
      activity.push({ action, from: String(prev[k] ?? ""), to: String(patch[k] ?? "") });
    }
  }

  const { data, error } = await supabase.from("issues").update(row).eq("id", issueId).select().single();
  if (error) throw error;

  for (const a of activity) {
    await logActivity(issueId, userId, a.action, a.from, a.to);
  }

  return mapIssue(data);
}

export async function deleteIssue(issueId) {
  const { error } = await supabase.from("issues").delete().eq("id", issueId);
  if (error) throw error;
}

export async function logActivity(issueId, userId, action, fromValue, toValue) {
  const { data, error } = await supabase
    .from("activity_log")
    .insert({
      issue_id: issueId,
      user_id: userId,
      action,
      from_value: fromValue,
      to_value: toValue,
    })
    .select()
    .single();
  if (error) {
    console.warn("activity log failed", error);
    return null;
  }
  return mapActivity(data);
}

/* ---------- comments ---------- */

export async function addComment(issueId, userId, text) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ issue_id: issueId, author_id: userId, text })
    .select()
    .single();
  if (error) throw error;
  await logActivity(issueId, userId, "comment_added", null, text.slice(0, 80));
  return mapComment(data);
}

export async function updateComment(commentId, text) {
  const { data, error } = await supabase
    .from("comments")
    .update({ text, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .select()
    .single();
  if (error) throw error;
  return mapComment(data);
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

/* ---------- time logs ---------- */

export async function addTimeLog(issueId, userId, minutes, note, subtaskId = null, logDate = null) {
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      issue_id: issueId,
      user_id: userId,
      minutes,
      note: note || "",
      subtask_id: subtaskId,
      // Manual logs pass a work date; auto-tracked logs leave null → now
      log_date: logDate ? new Date(logDate).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(issueId, userId, "time_logged", null, `${minutes}m`);
  return mapTimeLog(data);
}

export function isInProgressStatus(statuses, statusId) {
  const s = (statuses || []).find((x) => x.id === statusId);
  return Boolean(s && s.label.toLowerCase().includes("progress"));
}

/**
 * Status change with auto timer:
 * - Entering In Progress → start timer
 * - Leaving In Progress → auto-log elapsed time (min 1m if ≥15s), clear timer
 */
export async function applyStatusChangeWithTimer({ issue, newStatusId, statuses, userId }) {
  const wasIP = isInProgressStatus(statuses, issue.status);
  const nowIP = isInProgressStatus(statuses, newStatusId);
  const patch = { status: newStatusId };
  let newLog = null;

  if (!wasIP && nowIP) {
    patch.timerStartedAt = Date.now();
  } else if (wasIP && !nowIP) {
    if (issue.timerStartedAt) {
      const elapsedMs = Date.now() - issue.timerStartedAt;
      if (elapsedMs >= 15000) {
        const minutes = Math.max(1, Math.round(elapsedMs / 60000));
        newLog = await addTimeLog(
          issue.id,
          userId,
          minutes,
          "Auto-tracked while In Progress"
        );
      }
    }
    patch.timerStartedAt = null;
  }

  const updated = await updateIssue(issue.id, patch, userId, issue);
  return {
    updated: {
      ...updated,
      timerStartedAt: patch.timerStartedAt === undefined ? updated.timerStartedAt : patch.timerStartedAt,
    },
    newLog,
  };
}

/** Start timer if issue is already In Progress but has no timer (e.g. before this feature). */
export async function ensureTimerRunning(issue, statuses, userId) {
  if (!isInProgressStatus(statuses, issue.status) || issue.timerStartedAt) return null;
  const updated = await updateIssue(issue.id, { timerStartedAt: Date.now() }, userId, issue);
  return { ...updated, timerStartedAt: Date.now() };
}

export async function updateTimeLog(logId, { minutes, note, date }) {
  const row = { updated_at: new Date().toISOString() };
  if (minutes != null) row.minutes = minutes;
  if (note != null) row.note = note;
  if (date !== undefined) row.log_date = date ? new Date(date).toISOString() : null;
  const { data, error } = await supabase.from("time_logs").update(row).eq("id", logId).select().single();
  if (error) throw error;
  return mapTimeLog(data);
}

export async function deleteTimeLog(logId) {
  const { error } = await supabase.from("time_logs").delete().eq("id", logId);
  if (error) throw error;
}

/* ---------- subtasks ---------- */

export async function addSubtask(issueId, title) {
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ issue_id: issueId, title })
    .select()
    .single();
  if (error) throw error;
  return mapSubtask(data);
}

export async function updateSubtask(subtaskId, patch) {
  const row = {};
  if (patch.title != null) row.title = patch.title;
  if (patch.isDone != null) row.is_done = patch.isDone;
  const { data, error } = await supabase.from("subtasks").update(row).eq("id", subtaskId).select().single();
  if (error) throw error;
  return mapSubtask(data);
}

export async function deleteSubtask(subtaskId) {
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw error;
}

/* ---------- attachments ---------- */

export async function uploadAttachment(issueId, userId, file) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${issueId}/${Date.now()}_${safe}`;
  const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      issue_id: issueId,
      uploaded_by: userId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(issueId, userId, "attachment_added", null, file.name);
  return mapAttachment(data);
}

export function attachmentPublicUrl(filePath) {
  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteAttachment(attachment) {
  await supabase.storage.from("attachments").remove([attachment.filePath]);
  const { error } = await supabase.from("attachments").delete().eq("id", attachment.id);
  if (error) throw error;
}

/* ---------- links ---------- */

export async function addIssueLink(sourceIssueId, targetIssueId, linkType, userId) {
  const { data, error } = await supabase
    .from("issue_links")
    .insert({
      source_issue_id: sourceIssueId,
      target_issue_id: targetIssueId,
      link_type: linkType,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(sourceIssueId, userId, "link_added", null, linkType);
  return mapLink(data);
}

export async function deleteIssueLink(linkId) {
  const { error } = await supabase.from("issue_links").delete().eq("id", linkId);
  if (error) throw error;
}

/* ---------- watchers ---------- */

export async function toggleWatcher(issueId, userId, watching) {
  if (watching) {
    const { error } = await supabase.from("issue_watchers").delete().eq("issue_id", issueId).eq("user_id", userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("issue_watchers").insert({ issue_id: issueId, user_id: userId });
  if (error) throw error;
  return true;
}
