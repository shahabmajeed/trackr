import { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  FileText, Upload, Trash2, Image as ImageIcon, Sparkles, ExternalLink, User,
  ArrowRight, Globe, Layers, Mail, Pencil,
} from "lucide-react";
import { C, inputStyle, selStyle } from "../lib/theme";
import { Field } from "./ui";
import ScopeFilesPanel from "./ScopeFilesPanel";
import * as api from "../lib/api";
import { extractScopeFromFile } from "../lib/scopeExtract";
import { toastSuccess, toastError } from "../lib/toast";

export const PLATFORMS = [
  { value: "", label: "Select platform…" },
  { value: "shopify", label: "Shopify" },
  { value: "wordpress", label: "WordPress" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "webflow", label: "Webflow" },
  { value: "wix", label: "Wix" },
  { value: "custom", label: "Custom / Other" },
];

export const CLIENT_SOURCES = [
  { value: "", label: "Where did they come from?" },
  { value: "upwork", label: "Upwork" },
  { value: "email", label: "Email" },
  { value: "fiverr", label: "Fiverr" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const labelOf = (list, value) => list.find((x) => x.value === value)?.label || "—";

const softPanel = {
  background: "#F4F6F8",
  borderRadius: 10,
  padding: "18px 20px",
};

const whiteCard = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
};

function Pill({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11.5, fontWeight: 700, color: C.subtle,
      background: "#fff", border: `1px solid ${C.border}`,
      borderRadius: 999, padding: "4px 10px",
    }}>
      {children}
    </span>
  );
}

function Callout({ title, children }) {
  return (
    <div style={{ ...softPanel, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ArrowRight size={16} color={C.primary} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetaRow({ icon: Icon, label, value, href }) {
  if (!value || value === "—") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
        <Icon size={15} color={C.faint} />
        <span style={{ fontSize: 12, color: C.faint, width: 90 }}>{label}</span>
        <span style={{ fontSize: 13, color: C.faint, fontStyle: "italic" }}>Not set</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <Icon size={15} color={C.primary} />
      <span style={{ fontSize: 12, color: C.faint, width: 90 }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, color: C.primary, fontWeight: 600, textDecoration: "none" }}>
          {value} <ExternalLink size={12} style={{ verticalAlign: -1 }} />
        </a>
      ) : (
        <span style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{value}</span>
      )}
    </div>
  );
}

function TabBtn({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent",
        padding: "10px 2px",
        marginRight: 18,
        fontSize: 13.5,
        fontWeight: 700,
        color: active ? C.primary : C.subtle,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SummaryTab({
  name, keyLabel, descriptionHtml, websiteUrl, platform, coverImageUrl,
  clientName, clientEmail, clientSource, clientWebsite, clientImageUrl,
  onEditProject, onEditClient,
}) {
  const href = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `https://${url}`;
  };
  const hasDesc = descriptionHtml && descriptionHtml !== "<p><br></p>" && descriptionHtml !== "<p></p>";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(240px, 0.85fr)", gap: 18, alignItems: "start" }}>
      <div>
        {coverImageUrl && (
          <div style={{
            height: 180, borderRadius: 10, overflow: "hidden", marginBottom: 16,
            border: `1px solid ${C.border}`,
          }}>
            <img src={coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <Callout title={`Welcome to ${name || "this project"}`}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <Pill>{keyLabel || "KEY"}</Pill>
            {platform && <Pill><Layers size={11} /> {labelOf(PLATFORMS, platform)}</Pill>}
            {websiteUrl && <Pill><Globe size={11} /> Site linked</Pill>}
          </div>
          {hasDesc ? (
            <div
              className="scope-summary-html"
              style={{ fontSize: 14, color: C.subtle, lineHeight: 1.55 }}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, color: C.faint }}>
              No project brief yet. Open the Project tab to add a rich description, or auto-fill from a PDF / DOC.
            </p>
          )}
          <button
            type="button"
            onClick={onEditProject}
            style={{
              marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none", color: C.primary,
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0,
            }}
          >
            <Pencil size={13} /> Edit project details
          </button>
        </Callout>

        <div style={{ ...whiteCard, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.faint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>
            Project details
          </div>
          <MetaRow icon={Layers} label="Platform" value={platform ? labelOf(PLATFORMS, platform) : null} />
          <MetaRow icon={Globe} label="Website" value={websiteUrl || null} href={href(websiteUrl)} />
        </div>
      </div>

      <div>
        <div style={{ ...whiteCard, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.faint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 14 }}>
            Client
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 14 }}>
            {clientImageUrl ? (
              <img
                src={clientImageUrl}
                alt={clientName || "Client"}
                style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.primarySoft}`, marginBottom: 10 }}
              />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: "50%", background: C.bg, border: `2px dashed ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, marginBottom: 10,
              }}>
                <User size={32} />
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{clientName || "Client not set"}</div>
            {clientSource && (
              <div style={{ marginTop: 6 }}>
                <Pill>Via {labelOf(CLIENT_SOURCES, clientSource)}</Pill>
              </div>
            )}
          </div>
          <MetaRow icon={Mail} label="Email" value={clientEmail || null} href={clientEmail ? `mailto:${clientEmail}` : null} />
          <MetaRow icon={Globe} label="Website" value={clientWebsite || null} href={href(clientWebsite)} />
          <button
            type="button"
            onClick={onEditClient}
            style={{
              marginTop: 14, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: C.text,
            }}
          >
            <Pencil size={13} /> Edit client
          </button>
        </div>

        <div style={softPanel}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.faint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
            Quick tips
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: C.subtle, lineHeight: 1.55 }}>
            <li>Use Auto-fill to pull details from a brief PDF or DOC.</li>
            <li>Handover briefs stay on the Project tab as reference files.</li>
            <li>Ongoing client docs and Google links go on the Files tab.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ScopeView({ project, currentUser, onUpdated }) {
  const [tab, setTab] = useState("summary"); // summary | project | client | files
  const [name, setName] = useState(project.name || "");
  const [key, setKey] = useState(project.key || "");
  const [descriptionHtml, setDescriptionHtml] = useState(project.descriptionHtml || "");
  const [websiteUrl, setWebsiteUrl] = useState(project.websiteUrl || "");
  const [platform, setPlatform] = useState(project.platform || "");
  const [coverImageUrl, setCoverImageUrl] = useState(project.coverImageUrl || null);
  const [clientName, setClientName] = useState(project.clientName || "");
  const [clientEmail, setClientEmail] = useState(project.clientEmail || "");
  const [clientSource, setClientSource] = useState(project.clientSource || "");
  const [clientWebsite, setClientWebsite] = useState(project.clientWebsite || "");
  const [clientImageUrl, setClientImageUrl] = useState(project.clientImageUrl || null);
  const [scopeFiles, setScopeFiles] = useState(project.scopeFiles || []);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractPreview, setExtractPreview] = useState("");
  const docRef = useRef(null);
  const coverRef = useRef(null);
  const clientImgRef = useRef(null);
  const extractRef = useRef(null);

  useEffect(() => {
    setName(project.name || "");
    setKey(project.key || "");
    setDescriptionHtml(project.descriptionHtml || "");
    setWebsiteUrl(project.websiteUrl || "");
    setPlatform(project.platform || "");
    setCoverImageUrl(project.coverImageUrl || null);
    setClientName(project.clientName || "");
    setClientEmail(project.clientEmail || "");
    setClientSource(project.clientSource || "");
    setClientWebsite(project.clientWebsite || "");
    setClientImageUrl(project.clientImageUrl || null);
    setScopeFiles(project.scopeFiles || []);
    setExtractPreview("");
    setTab("summary");
  }, [project.id]);

  // Keep summary in sync when parent project object updates after save
  useEffect(() => {
    setName(project.name || "");
    setKey(project.key || "");
    setDescriptionHtml(project.descriptionHtml || "");
    setWebsiteUrl(project.websiteUrl || "");
    setPlatform(project.platform || "");
    setCoverImageUrl(project.coverImageUrl || null);
    setClientName(project.clientName || "");
    setClientEmail(project.clientEmail || "");
    setClientSource(project.clientSource || "");
    setClientWebsite(project.clientWebsite || "");
    setClientImageUrl(project.clientImageUrl || null);
    setScopeFiles(project.scopeFiles || []);
  }, [
    project.name, project.key, project.descriptionHtml, project.websiteUrl, project.platform,
    project.coverImageUrl, project.clientName, project.clientEmail, project.clientSource,
    project.clientWebsite, project.clientImageUrl, project.scopeFiles,
  ]);

  const pushLocal = (partial) => {
    onUpdated({ ...project, ...partial, scopeFiles });
  };

  const saveProjectTab = async () => {
    if (!name.trim() || !key.trim()) {
      toastError("Project name and key are required.");
      return;
    }
    setBusy(true);
    try {
      const data = await api.updateProject(project.id, {
        name: name.trim(),
        key: key.trim(),
        descriptionHtml,
        websiteUrl: websiteUrl.trim(),
        platform,
        coverImageUrl,
      });
      const mapped = {
        name: data.name,
        key: data.key,
        descriptionHtml: data.description_html || "",
        websiteUrl: data.website_url || "",
        platform: data.platform || "",
        coverImageUrl: data.cover_image_url || null,
      };
      onUpdated({ ...project, ...mapped, scopeFiles });
      toastSuccess("Project scope saved");
      setTab("summary");
    } catch (e) {
      toastError(e.message || "Could not save. Run supabase/project_scope.sql if columns are missing.");
    } finally {
      setBusy(false);
    }
  };

  const saveClientTab = async () => {
    setBusy(true);
    try {
      const data = await api.updateProject(project.id, {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientSource,
        clientWebsite: clientWebsite.trim(),
        clientImageUrl,
      });
      const mapped = {
        clientName: data.client_name || "",
        clientEmail: data.client_email || "",
        clientSource: data.client_source || "",
        clientWebsite: data.client_website || "",
        clientImageUrl: data.client_image_url || null,
      };
      onUpdated({ ...project, ...mapped, scopeFiles });
      toastSuccess("Client details saved");
      setTab("summary");
    } catch (e) {
      toastError(e.message || "Could not save. Run supabase/project_scope.sql if columns are missing.");
    } finally {
      setBusy(false);
    }
  };

  const referenceFiles = scopeFiles.filter((f) => f.collection === "reference");
  const clientFiles = scopeFiles.filter((f) => f.collection !== "reference");

  const onUploadDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const kind = (file.type || "").startsWith("image/") ? "image" : "document";
      const f = await api.uploadScopeFile(project.id, currentUser.id, file, {
        kind,
        collection: "reference",
        title: file.name.replace(/\.[^.]+$/, "") || file.name,
      });
      const next = [...scopeFiles, f];
      setScopeFiles(next);
      onUpdated({ ...project, scopeFiles: next });
      toastSuccess("Reference file uploaded");
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const onRemoveFile = async (f) => {
    try {
      await api.deleteScopeFile(f.id, f.filePath);
      const next = scopeFiles.filter((x) => x.id !== f.id);
      setScopeFiles(next);
      onUpdated({ ...project, scopeFiles: next });
      toastSuccess("File removed");
    } catch (e) {
      toastError(e.message);
    }
  };

  const onCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await api.uploadProjectImage(project.id, file, "cover");
      setCoverImageUrl(url);
      pushLocal({ coverImageUrl: url });
      toastSuccess("Cover image updated");
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const removeCover = async () => {
    setBusy(true);
    try {
      await api.updateProject(project.id, { coverImageUrl: null });
      setCoverImageUrl(null);
      pushLocal({ coverImageUrl: null });
      toastSuccess("Cover image removed");
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onClientImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await api.uploadProjectImage(project.id, file, "client");
      setClientImageUrl(url);
      pushLocal({ clientImageUrl: url });
      toastSuccess("Client image updated");
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const removeClientImage = async () => {
    setBusy(true);
    try {
      await api.updateProject(project.id, { clientImageUrl: null });
      setClientImageUrl(null);
      pushLocal({ clientImageUrl: null });
      toastSuccess("Client image removed");
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const applyExtract = (parsed, { overwriteEmptyOnly = true } = {}) => {
    const take = (current, next) => {
      if (!next) return current;
      if (!overwriteEmptyOnly) return next;
      return current?.trim() ? current : next;
    };
    setName((n) => take(n, parsed.name));
    setDescriptionHtml((d) => {
      const empty = !d || d === "<p><br></p>" || d === "<p></p>";
      if (!parsed.descriptionHtml) return d;
      return overwriteEmptyOnly && !empty ? d : parsed.descriptionHtml;
    });
    setWebsiteUrl((w) => take(w, parsed.websiteUrl));
    setPlatform((p) => take(p, parsed.platform));
    setClientName((c) => take(c, parsed.clientName));
    setClientEmail((c) => take(c, parsed.clientEmail));
    setClientSource((c) => take(c, parsed.clientSource));
    setClientWebsite((c) => take(c, parsed.clientWebsite || parsed.websiteUrl));
    setExtractPreview(parsed.extractedPreview || "");
  };

  const onExtractFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const parsed = await extractScopeFromFile(file);
      applyExtract(parsed, { overwriteEmptyOnly: false });
      try {
        const f = await api.uploadScopeFile(project.id, currentUser.id, file, {
          kind: "document",
          collection: "reference",
          title: file.name.replace(/\.[^.]+$/, "") || file.name,
        });
        const next = [...scopeFiles, f];
        setScopeFiles(next);
        onUpdated({ ...project, scopeFiles: next });
      } catch (_) {}
      toastSuccess("Details extracted — review Project & Client, then save");
      setTab("project");
    } catch (err) {
      toastError(err.message || "Could not extract from this file");
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  const primaryBtn = {
    background: C.primary, color: "#fff", border: "none", borderRadius: 6,
    padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
  };
  const secondaryBtn = {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6,
    padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: C.primary,
  };

  return (
    <div style={{ padding: "20px 24px 48px", maxWidth: tab === "files" ? 1100 : 980 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: C.text }}>Scope</h2>
          <p style={{ fontSize: 13, color: C.subtle, margin: 0 }}>
            Project brief, client profile, and files for <strong style={{ color: C.text }}>{name || project.name}</strong>
          </p>
        </div>
        <button type="button" disabled={extracting || busy} onClick={() => extractRef.current?.click()} style={secondaryBtn}>
          <Sparkles size={14} /> {extracting ? "Extracting…" : "Auto-fill from PDF / DOC"}
        </button>
        <input ref={extractRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden onChange={onExtractFile} />
      </div>

      {extractPreview && (
        <div style={{ ...softPanel, marginBottom: 14, fontSize: 12, color: C.subtle }}>
          <strong style={{ color: C.primary }}>Extracted preview:</strong> {extractPreview}
          {extractPreview.length >= 500 ? "…" : ""}
        </div>
      )}

      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <TabBtn id="summary" label="Summary" active={tab === "summary"} onClick={setTab} />
        <TabBtn id="project" label="Project" active={tab === "project"} onClick={setTab} />
        <TabBtn id="client" label="Client" active={tab === "client"} onClick={setTab} />
        <TabBtn id="files" label={`Files${clientFiles.length ? ` (${clientFiles.length})` : ""}`} active={tab === "files"} onClick={setTab} />
      </div>

      {tab === "summary" && (
        <SummaryTab
          name={name}
          keyLabel={key}
          descriptionHtml={descriptionHtml}
          websiteUrl={websiteUrl}
          platform={platform}
          coverImageUrl={coverImageUrl}
          clientName={clientName}
          clientEmail={clientEmail}
          clientSource={clientSource}
          clientWebsite={clientWebsite}
          clientImageUrl={clientImageUrl}
          onEditProject={() => setTab("project")}
          onEditClient={() => setTab("client")}
        />
      )}

      {tab === "project" && (
        <div style={whiteCard}>
          <Callout title="Project details">
            <p style={{ margin: 0, fontSize: 13, color: C.subtle }}>
              Edit the title, key, platform, and rich brief. Changes appear on the Summary tab after you save.
            </p>
          </Callout>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <Field label="Project title">
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Key">
              <input
                style={{ ...inputStyle, textTransform: "uppercase", fontWeight: 700 }}
                value={key}
                maxLength={10}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
            </Field>
          </div>

          <Field label="Website URL">
            <input style={inputStyle} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </Field>

          <Field label="Platform">
            <select style={selStyle} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p.value || "none"} value={p.value}>{p.label}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <div style={{ background: "#fff", borderRadius: 4, marginBottom: 4 }}>
              <ReactQuill theme="snow" value={descriptionHtml} onChange={setDescriptionHtml} modules={quillModules} />
            </div>
          </Field>

          <Field label="Cover image (optional)">
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Cover" style={{ width: 140, height: 84, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
              ) : (
                <div style={{
                  width: 140, height: 84, borderRadius: 8, background: C.bg, border: `1px dashed ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: C.faint,
                }}>
                  <ImageIcon size={22} />
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={busy} onClick={() => coverRef.current?.click()} style={secondaryBtn}>
                  {coverImageUrl ? "Change image" : "Upload image"}
                </button>
                {coverImageUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={removeCover}
                    style={{ ...secondaryBtn, color: C.danger, borderColor: C.border }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />
            </div>
          </Field>

          <Field label="Handover reference files">
            <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.subtle }}>
              Scope/handover briefs only. Ongoing client feedback and links belong on the Files tab.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {referenceFiles.map((f) => {
                const fileHref = api.scopeFileOpenUrl(f);
                return (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                    padding: "8px 10px", background: C.bg, borderRadius: 6,
                  }}>
                    {f.fileType === "image" || f.kind === "image"
                      ? <ImageIcon size={14} color={C.faint} />
                      : <FileText size={14} color={C.faint} />}
                    {fileHref ? (
                      <a href={fileHref} target="_blank" rel="noreferrer" style={{ color: C.primary, flex: 1 }}>
                        {f.title || f.fileName}
                      </a>
                    ) : (
                      <span style={{ flex: 1, color: C.text }}>{f.title || f.fileName}</span>
                    )}
                    <Trash2 size={14} color={C.faint} style={{ cursor: "pointer" }} onClick={() => onRemoveFile(f)} />
                  </div>
                );
              })}
              {referenceFiles.length === 0 && (
                <div style={{ fontSize: 12.5, color: C.faint }}>No handover files yet. Upload the original brief or SOW.</div>
              )}
            </div>
            <button type="button" onClick={() => docRef.current?.click()} style={secondaryBtn}>
              <Upload size={14} /> Upload reference file
            </button>
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,image/*,application/pdf" hidden onChange={onUploadDoc} />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setTab("summary")} style={{ ...secondaryBtn, color: C.subtle }}>Cancel</button>
            <button type="button" disabled={busy} onClick={saveProjectTab} style={primaryBtn}>Save project</button>
          </div>
        </div>
      )}

      {tab === "client" && (
        <div style={whiteCard}>
          <Callout title="Client details">
            <p style={{ margin: 0, fontSize: 13, color: C.subtle }}>
              Name, contact, source platform, and optional photo. Shown on the Summary sidebar.
            </p>
          </Callout>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            {clientImageUrl ? (
              <img src={clientImageUrl} alt={clientName || "Client"} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.primarySoft}` }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%", background: C.bg, border: `1px dashed ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", color: C.faint,
              }}>
                <User size={28} />
              </div>
            )}
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={busy} onClick={() => clientImgRef.current?.click()} style={secondaryBtn}>
                  {clientImageUrl ? "Change photo" : "Upload client photo"}
                </button>
                {clientImageUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={removeClientImage}
                    style={{ ...secondaryBtn, color: C.danger, borderColor: C.border }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <input ref={clientImgRef} type="file" accept="image/*" hidden onChange={onClientImg} />
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>Optional</div>
            </div>
          </div>

          <Field label="Client name">
            <input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Inc. / Jane Doe" />
          </Field>
          <Field label="Client email">
            <input style={inputStyle} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@company.com" />
          </Field>
          <Field label="Came from">
            <select style={selStyle} value={clientSource} onChange={(e) => setClientSource(e.target.value)}>
              {CLIENT_SOURCES.map((s) => <option key={s.value || "none"} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Client website">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...inputStyle, flex: 1 }} value={clientWebsite} onChange={(e) => setClientWebsite(e.target.value)} placeholder="https://client-site.com" />
              {clientWebsite && (
                <a href={clientWebsite.startsWith("http") ? clientWebsite : `https://${clientWebsite}`} target="_blank" rel="noreferrer" style={{ color: C.primary }}>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setTab("summary")} style={{ ...secondaryBtn, color: C.subtle }}>Cancel</button>
            <button type="button" disabled={busy} onClick={saveClientTab} style={primaryBtn}>Save client</button>
          </div>
        </div>
      )}

      {tab === "files" && (
        <ScopeFilesPanel
          project={project}
          currentUser={currentUser}
          scopeFiles={clientFiles}
          allScopeFiles={scopeFiles}
          setScopeFiles={setScopeFiles}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
