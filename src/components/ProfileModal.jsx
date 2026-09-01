import { useState, useRef } from "react";
import { X } from "lucide-react";
import { C, inputStyle, AVATAR_COLORS, resolveAvatarColor } from "../lib/theme";
import { Avatar, Modal, Field } from "./ui";
import * as api from "../lib/api";

export default function ProfileModal({ user, onClose, onUpdated }) {
  const [name, setName] = useState(user.name || "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || resolveAvatarColor(user));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const save = async () => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (!name.trim()) throw new Error("Name is required.");
      const updated = await api.updateProfile(user.id, {
        name: name.trim(),
        avatarColor,
      });
      if (password) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirm) throw new Error("Passwords do not match.");
        await api.updatePassword(password);
      }
      onUpdated(updated);
      setInfo(password ? "Profile and password updated." : "Profile updated.");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await api.uploadAvatar(user.id, file);
      const updated = await api.updateProfile(user.id, { name: name.trim() || user.name, avatarUrl: url });
      onUpdated(updated);
      setInfo("Avatar updated.");
    } catch (err) {
      setError(err.message || "Avatar upload failed.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const onRemoveAvatar = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const updated = await api.removeAvatar(user.id);
      onUpdated(updated);
      setInfo("Avatar removed.");
    } catch (err) {
      setError(err.message || "Could not remove avatar.");
    } finally {
      setBusy(false);
    }
  };

  const onPickColor = async (hex) => {
    setAvatarColor(hex);
    setBusy(true);
    setError("");
    try {
      const updated = await api.updateProfile(user.id, { avatarColor: hex });
      onUpdated(updated);
      setInfo("Initials color updated.");
    } catch (err) {
      setError(err.message || "Could not update color.");
    } finally {
      setBusy(false);
    }
  };

  const previewUser = { ...user, name, avatarColor };

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: C.text }}>Your profile</h2>
          <X size={18} color={C.faint} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {error && <div style={{ background: "#FFEBE6", color: "#BF2600", fontSize: 12.5, padding: "8px 10px", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
        {info && <div style={{ background: C.doneBg, color: C.doneText, fontSize: 12.5, padding: "8px 10px", borderRadius: 4, marginBottom: 12 }}>{info}</div>}

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Avatar user={previewUser} size={56} />
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
                Change avatar
              </button>
              {user.avatarUrl && (
                <button type="button" disabled={busy} onClick={onRemoveAvatar} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: busy ? "default" : "pointer", color: C.danger, opacity: busy ? 0.7 : 1 }}>
                  Remove avatar
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>{user.email}</div>
            {!previewUser.avatarUrl && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.subtle, marginBottom: 6 }}>Initials color</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {AVATAR_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      disabled={busy}
                      title={hex}
                      onClick={() => onPickColor(hex)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: hex,
                        border: avatarColor === hex ? `2px solid ${C.text}` : "2px solid transparent",
                        boxShadow: avatarColor === hex ? `0 0 0 2px #fff, 0 0 0 3px ${C.text}` : "none",
                        cursor: busy ? "default" : "pointer",
                        padding: 0,
                        opacity: busy ? 0.7 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Field label="Display name">
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="New password (optional)">
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
        {password && (
          <Field label="Confirm password">
            <input type="password" style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: busy ? 0.7 : 1 }}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
