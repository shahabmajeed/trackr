import { useMemo, useRef, useState } from "react";
import {
  Search, LayoutGrid, List, Eye, Pencil, Trash2, Upload, Link2, Plus, X,
  FileText, Image as ImageIcon, FileSpreadsheet, ExternalLink, Tag, Clock,
} from "lucide-react";
import { C, inputStyle, selStyle } from "../lib/theme";
import { Field, Modal } from "./ui";
import * as api from "../lib/api";
import { toastSuccess, toastError, toastConfirm } from "../lib/toast";

const TYPE_META = {
  pdf: { label: "PDF", color: "#E2483D", bg: "#FFEBE6" },
  word: { label: "Word", color: "#0C66E4", bg: "#E9F2FF" },
  google_doc: { label: "Google Doc", color: "#0C66E4", bg: "#E9F2FF" },
  google_sheet: { label: "Google Sheet", color: "#216E4E", bg: "#E3FCEF" },
  image: { label: "Image", color: "#6E5DC6", bg: "#F3F0FF" },
  link: { label: "Link", color: "#44546F", bg: "#F1F2F4" },
  document: { label: "Document", color: "#44546F", bg: "#F1F2F4" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "google_doc", label: "Google Doc" },
  { value: "google_sheet", label: "Google Sheet" },
  { value: "image", label: "Image" },
  { value: "link", label: "Link" },
  { value: "document", label: "Other" },
];

function FileTypeIcon({ type, size = 22 }) {
  const meta = TYPE_META[type] || TYPE_META.document;
  const props = { size, color: meta.color, strokeWidth: 2 };
  if (type === "pdf") return <FileText {...props} />;
  if (type === "word" || type === "google_doc") return <FileText {...props} />;
  if (type === "google_sheet") return <FileSpreadsheet {...props} />;
  if (type === "image") return <ImageIcon {...props} />;
  if (type === "link") return <Link2 {...props} />;
  return <FileText {...props} />;
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.document;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10.5, fontWeight: 700, letterSpacing: 0.2,
      color: meta.color, background: meta.bg,
      borderRadius: 4, padding: "2px 7px",
    }}>
      {meta.label}
    </span>
  );
}

function formatWhen(ts) {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseLabels(raw) {
  if (Array.isArray(raw)) return raw.map((l) => String(l).trim()).filter(Boolean);
  return String(raw || "")
    .split(/[,#]/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function emptyForm() {
  return {
    mode: "upload",
    title: "",
    description: "",
    labels: "",
    linkUrl: "",
    file: null,
  };
}

const iconBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`,
  background: "#fff", cursor: "pointer", color: C.subtle, padding: 0,
};

const primaryBtn = {
  background: C.primary, color: "#fff", border: "none", borderRadius: 6,
  padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
};

const secondaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6,
  padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: C.primary,
};

export default function ScopeFilesPanel({
  project,
  currentUser,
  scopeFiles,
  allScopeFiles,
  setScopeFiles,
  onUpdated,
}) {
  const library = allScopeFiles || scopeFiles;
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState(null);
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...scopeFiles]
      .filter((f) => {
        if (typeFilter !== "all" && (f.fileType || "document") !== typeFilter) return false;
        if (!q) return true;
        const hay = [
          f.title, f.fileName, f.description,
          ...(f.labels || []),
          f.linkUrl,
          TYPE_META[f.fileType]?.label,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [scopeFiles, search, typeFilter]);

  const openAdd = (mode = "upload") => {
    setEditing(null);
    setForm({ ...emptyForm(), mode });
    setFormOpen(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      mode: f.linkUrl ? "link" : "upload",
      title: f.title || f.fileName || "",
      description: f.description || "",
      labels: (f.labels || []).join(", "),
      linkUrl: f.linkUrl || "",
      file: null,
    });
    setFormOpen(true);
    setDetail(null);
  };

  const sync = (nextAll) => {
    setScopeFiles(nextAll);
    onUpdated({ ...project, scopeFiles: nextAll });
  };

  const saveForm = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const labels = parseLabels(form.labels);
    if (!title) {
      toastError("Title is required.");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        const patch = { title, description, labels };
        if (editing.linkUrl || form.mode === "link") {
          if (!form.linkUrl.trim()) {
            toastError("Link URL is required.");
            setBusy(false);
            return;
          }
          patch.linkUrl = form.linkUrl.trim();
        }
        const updated = await api.updateScopeFile(editing.id, patch);
        sync(library.map((x) => (x.id === updated.id ? updated : x)));
        toastSuccess("File updated");
      } else if (form.mode === "link") {
        if (!form.linkUrl.trim()) {
          toastError("Link URL is required.");
          setBusy(false);
          return;
        }
        const created = await api.addScopeLink(project.id, currentUser.id, {
          title,
          description,
          labels,
          linkUrl: form.linkUrl.trim(),
          collection: "client",
        });
        sync([created, ...library]);
        toastSuccess("Link added");
      } else {
        if (!form.file) {
          toastError("Choose a file to upload.");
          setBusy(false);
          return;
        }
        const created = await api.uploadScopeFile(project.id, currentUser.id, form.file, {
          title,
          description,
          labels,
          collection: "client",
        });
        sync([created, ...library]);
        toastSuccess("File uploaded");
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm());
    } catch (e) {
      toastError(e.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (f) => {
    const ok = await toastConfirm(`Delete “${f.title || f.fileName}”?`, { confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await api.deleteScopeFile(f.id, f.filePath);
      sync(library.filter((x) => x.id !== f.id));
      if (detail?.id === f.id) setDetail(null);
      toastSuccess("Deleted");
    } catch (e) {
      toastError(e.message);
    }
  };

  const openUrl = (f) => api.scopeFileOpenUrl(f);

  const ViewToggle = () => (
    <div style={{
      display: "inline-flex", border: `1px solid ${C.border}`, borderRadius: 8,
      overflow: "hidden", background: "#fff",
    }}>
      {[
        { id: "grid", Icon: LayoutGrid, label: "Grid" },
        { id: "list", Icon: List, label: "List" },
      ].map(({ id, Icon, label }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setView(id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 10px", border: "none", cursor: "pointer",
              background: active ? C.primarySoft : "transparent",
              color: active ? C.primary : C.subtle,
              fontWeight: 700, fontSize: 12,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );

  const ActionRow = ({ f, compact }) => (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <button type="button" style={iconBtn} title="View details" onClick={() => setDetail(f)}>
        <Eye size={14} />
      </button>
      <button type="button" style={iconBtn} title="Edit" onClick={() => openEdit(f)}>
        <Pencil size={14} />
      </button>
      <button type="button" style={{ ...iconBtn, color: C.danger }} title="Delete" onClick={() => removeFile(f)}>
        <Trash2 size={14} />
      </button>
      {!compact && openUrl(f) && (
        <a
          href={openUrl(f)}
          target="_blank"
          rel="noreferrer"
          style={{ ...iconBtn, textDecoration: "none" }}
          title="Open"
        >
          <ExternalLink size={14} color={C.primary} />
        </a>
      )}
    </div>
  );

  return (
    <div>
      <div style={{
        background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
        padding: 20, boxShadow: "0 1px 2px rgba(9,30,66,0.04)", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: C.text }}>Ongoing client files</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.subtle }}>
              Feedback, PDFs, images, and Google links sent while the project is running — separate from handover scope files.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ViewToggle />
            <button type="button" onClick={() => openAdd("link")} style={secondaryBtn}>
              <Link2 size={14} /> Add link
            </button>
            <button type="button" onClick={() => openAdd("upload")} style={primaryBtn}>
              <Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Upload file
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <Search size={14} color={C.faint} style={{ position: "absolute", left: 10, top: 10 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, description, labels…"
              style={{ ...inputStyle, paddingLeft: 32, marginBottom: 0 }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ ...selStyle, width: "auto", minWidth: 140, marginBottom: 0 }}
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>
            {filtered.length} of {scopeFiles.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: "#fff", border: `1px dashed ${C.border}`, borderRadius: 10, color: C.faint,
        }}>
          <Upload size={28} style={{ marginBottom: 10, opacity: 0.7 }} />
          <div style={{ fontWeight: 700, color: C.subtle, marginBottom: 4 }}>
            {scopeFiles.length === 0 ? "No client files yet" : "No matches"}
          </div>
          <div style={{ fontSize: 13, marginBottom: 14 }}>
            {scopeFiles.length === 0
              ? "Upload a PDF or Word file, or paste a Google Doc / Sheet link."
              : "Try another search or clear the type filter."}
          </div>
          {scopeFiles.length === 0 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => openAdd("upload")} style={primaryBtn}>Upload file</button>
              <button type="button" onClick={() => openAdd("link")} style={secondaryBtn}>Add link</button>
            </div>
          )}
        </div>
      ) : view === "grid" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {filtered.map((f) => {
            const url = openUrl(f);
            const isImg = f.fileType === "image" && url;
            return (
              <div
                key={f.id}
                style={{
                  background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
                  overflow: "hidden", display: "flex", flexDirection: "column",
                  boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
                }}
              >
                <div
                  style={{
                    height: 110, background: C.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", position: "relative", cursor: "pointer",
                  }}
                  onClick={() => setDetail(f)}
                >
                  {isImg ? (
                    <img src={url} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: (TYPE_META[f.fileType] || TYPE_META.document).bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FileTypeIcon type={f.fileType} size={26} />
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 8, left: 8 }}>
                    <TypeBadge type={f.fileType} />
                  </div>
                </div>
                <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>
                    {f.title || f.fileName}
                  </div>
                  {f.description && (
                    <div style={{
                      fontSize: 12, color: C.subtle, lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {f.description}
                    </div>
                  )}
                  {(f.labels || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(f.labels || []).slice(0, 3).map((l) => (
                        <span key={l} style={{
                          fontSize: 10.5, fontWeight: 600, color: C.subtle,
                          background: C.bg, borderRadius: 4, padding: "1px 6px",
                        }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.faint, marginTop: "auto", paddingTop: 4 }}>
                    <Clock size={11} /> {formatWhen(f.createdAt)}
                  </div>
                  <ActionRow f={f} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                <th style={th}>File</th>
                <th style={th}>Type</th>
                <th style={{ ...th, minWidth: 140 }}>Labels</th>
                <th style={th}>Uploaded</th>
                <th style={{ ...th, width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: (TYPE_META[f.fileType] || TYPE_META.document).bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileTypeIcon type={f.fileType} size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: C.text }}>{f.title || f.fileName}</div>
                        {f.description && (
                          <div style={{
                            fontSize: 12, color: C.subtle, marginTop: 2,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>
                            {f.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={td}><TypeBadge type={f.fileType} /></td>
                  <td style={td}>
                    {(f.labels || []).length === 0 ? (
                      <span style={{ color: C.faint }}>—</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(f.labels || []).map((l) => (
                          <span key={l} style={{
                            fontSize: 10.5, fontWeight: 600, color: C.subtle,
                            background: C.bg, borderRadius: 4, padding: "1px 6px",
                          }}>{l}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: C.subtle, fontSize: 12 }}>
                    {formatWhen(f.createdAt)}
                  </td>
                  <td style={td}><ActionRow f={f} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <Modal onClose={() => !busy && setFormOpen(false)} width={480}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
              {editing ? "Edit file" : form.mode === "link" ? "Add link" : "Upload file"}
            </div>
            <button type="button" onClick={() => !busy && setFormOpen(false)} style={{ ...iconBtn, border: "none" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: 20 }}>
            {!editing && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "upload", label: "Upload file", Icon: Upload },
                  { id: "link", label: "External link", Icon: Link2 },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, mode: id }))}
                    style={{
                      ...secondaryBtn,
                      flex: 1,
                      justifyContent: "center",
                      background: form.mode === id ? C.primarySoft : "#fff",
                      borderColor: form.mode === id ? C.primary : C.border,
                      color: form.mode === id ? C.primary : C.subtle,
                    }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            )}

            <Field label="Title">
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Client feedback v2"
              />
            </Field>
            <Field label="Description (1–2 lines)">
              <textarea
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Short note about what this file is for"
                maxLength={280}
              />
            </Field>
            <Field label="Labels (comma-separated)">
              <div style={{ position: "relative" }}>
                <Tag size={14} color={C.faint} style={{ position: "absolute", left: 10, top: 11 }} />
                <input
                  style={{ ...inputStyle, paddingLeft: 32 }}
                  value={form.labels}
                  onChange={(e) => setForm((s) => ({ ...s, labels: e.target.value }))}
                  placeholder="feedback, design, contract"
                />
              </div>
            </Field>

            {(form.mode === "link" || editing?.linkUrl) && (
              <Field label="Link URL">
                <input
                  style={inputStyle}
                  value={form.linkUrl}
                  onChange={(e) => setForm((s) => ({ ...s, linkUrl: e.target.value }))}
                  placeholder="https://docs.google.com/…"
                  disabled={!!editing && !editing.linkUrl}
                />
              </Field>
            )}

            {!editing && form.mode === "upload" && (
              <Field label="File">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.gif,image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((s) => ({
                      ...s,
                      file,
                      title: s.title || (file ? file.name.replace(/\.[^.]+$/, "") : ""),
                    }));
                  }}
                />
                {form.file && (
                  <div style={{ fontSize: 12, color: C.subtle, marginTop: 6 }}>
                    Selected: {form.file.name}
                  </div>
                )}
              </Field>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button type="button" disabled={busy} onClick={() => setFormOpen(false)} style={{ ...secondaryBtn, color: C.subtle }}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={saveForm} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
                {busy ? "Saving…" : editing ? "Save changes" : form.mode === "link" ? "Add link" : "Upload"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal onClose={() => setDetail(null)} width={560}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                background: (TYPE_META[detail.fileType] || TYPE_META.document).bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileTypeIcon type={detail.fileType} size={24} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  {detail.title || detail.fileName}
                </div>
                <TypeBadge type={detail.fileType} />
              </div>
            </div>
            <button type="button" onClick={() => setDetail(null)} style={{ ...iconBtn, border: "none" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: 20 }}>
            {detail.fileType === "image" && openUrl(detail) && (
              <img
                src={openUrl(detail)}
                alt={detail.title}
                style={{
                  width: "100%", maxHeight: 280, objectFit: "contain",
                  borderRadius: 8, background: C.bg, marginBottom: 16, border: `1px solid ${C.border}`,
                }}
              />
            )}
            <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.5, marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {detail.description || <span style={{ fontStyle: "italic", color: C.faint }}>No description</span>}
            </div>
            <div style={{ display: "grid", gap: 10, fontSize: 13, marginBottom: 18 }}>
              <DetailRow label="Uploaded" value={formatWhen(detail.createdAt)} />
              {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
                <DetailRow label="Updated" value={formatWhen(detail.updatedAt)} />
              )}
              {detail.fileName && <DetailRow label="File name" value={detail.fileName} />}
              {detail.fileSize != null && (
                <DetailRow label="Size" value={`${Math.max(1, Math.round(detail.fileSize / 1024))} KB`} />
              )}
              {detail.linkUrl && (
                <DetailRow
                  label="Link"
                  value={
                    <a href={openUrl(detail)} target="_blank" rel="noreferrer" style={{ color: C.primary, fontWeight: 600 }}>
                      {detail.linkUrl}
                    </a>
                  }
                />
              )}
              {(detail.labels || []).length > 0 && (
                <DetailRow
                  label="Labels"
                  value={(
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {detail.labels.map((l) => (
                        <span key={l} style={{
                          fontSize: 11, fontWeight: 600, color: C.subtle,
                          background: C.bg, borderRadius: 4, padding: "2px 7px",
                        }}>{l}</span>
                      ))}
                    </div>
                  )}
                />
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {openUrl(detail) && (
                <a href={openUrl(detail)} target="_blank" rel="noreferrer" style={{ ...primaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ExternalLink size={14} /> Open
                </a>
              )}
              <button type="button" onClick={() => openEdit(detail)} style={secondaryBtn}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" onClick={() => removeFile(detail)} style={{ ...secondaryBtn, color: C.danger }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 88, flexShrink: 0, fontSize: 12, color: C.faint, fontWeight: 600 }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const th = {
  padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.faint,
  textTransform: "uppercase", letterSpacing: 0.3,
};
const td = { padding: "12px 14px", verticalAlign: "middle" };
