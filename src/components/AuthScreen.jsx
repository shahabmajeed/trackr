import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { C, FONT_FAMILY, inputStyle } from "../lib/theme";
import { BuildVersion } from "../lib/version";
import { Field } from "./ui";
import Logo from "./Logo";
import * as api from "../lib/api";

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register | forgot | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("reset")) setMode("reset");
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hash.get("type") === "recovery") setMode("reset");
  }, []);

  const submit = async () => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        if (!email.trim()) throw new Error("Enter your email.");
        await api.resetPassword(email.trim());
        setInfo("Check your email for a password reset link.");
        return;
      }
      if (mode === "reset") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await api.updatePassword(password);
        setInfo("Password updated. You can log in.");
        setMode("login");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
      if (mode === "register") {
        if (!name.trim() || !email.trim() || password.length < 6) {
          throw new Error("Fill in all fields (password min 6 characters).");
        }
        const data = await api.signUp({ name: name.trim(), email: email.trim(), password });
        if (data.session) {
          onAuthed(data.session);
        } else {
          setInfo("Account created. Check your email to verify, then log in.");
          setMode("login");
        }
        return;
      }
      const data = await api.signIn({ email: email.trim(), password });
      onAuthed(data.session);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "register" ? "Create your account" :
    mode === "forgot" ? "Reset your password" :
    mode === "reset" ? "Choose a new password" :
    "Log in to Trackr";

  const subtitle =
    mode === "register" ? "Free, and only takes a minute." :
    mode === "forgot" ? "We'll email you a reset link." :
    mode === "reset" ? "Enter a new password for your account." :
    "A Jira-style workspace for your team.";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_FAMILY, padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo height={44} />
        </div>

        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, boxShadow: "0 1px 3px rgba(9,30,66,0.08)" }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{title}</h1>
          <p style={{ fontSize: 13, color: C.subtle, margin: "0 0 20px" }}>{subtitle}</p>

          {error && <div style={{ background: "#FFEBE6", color: "#BF2600", fontSize: 12.5, padding: "8px 10px", borderRadius: 4, marginBottom: 14 }}>{error}</div>}
          {info && <div style={{ background: C.doneBg, color: C.doneText, fontSize: 12.5, padding: "8px 10px", borderRadius: 4, marginBottom: 14 }}>{info}</div>}

          {mode === "register" && (
            <Field label="Full name">
              <div style={{ position: "relative" }}>
                <User size={15} color={C.faint} style={{ position: "absolute", left: 9, top: 10 }} />
                <input style={{ ...inputStyle, paddingLeft: 30 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jamie Chen" />
              </div>
            </Field>
          )}

          {(mode === "login" || mode === "register" || mode === "forgot") && (
            <Field label="Email">
              <div style={{ position: "relative" }}>
                <Mail size={15} color={C.faint} style={{ position: "absolute", left: 9, top: 10 }} />
                <input style={{ ...inputStyle, paddingLeft: 30 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" onKeyDown={(e) => e.key === "Enter" && submit()} />
              </div>
            </Field>
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <Lock size={15} color={C.faint} style={{ position: "absolute", left: 9, top: 10 }} />
                <input type={showPw ? "text" : "password"} style={{ ...inputStyle, paddingLeft: 30, paddingRight: 32 }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
                <span onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 9, top: 9, cursor: "pointer", color: C.faint }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </span>
              </div>
            </Field>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 8, marginTop: -6 }}>
              <span style={{ fontSize: 12.5, color: C.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>
                Forgot password?
              </span>
            </div>
          )}

          <button onClick={submit} disabled={busy} style={{
            width: "100%", background: C.primary, color: "#fff", border: "none", borderRadius: 4,
            padding: "9px 0", fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer", marginTop: 6, opacity: busy ? 0.7 : 1,
          }}>
            {busy ? "Please wait…" :
              mode === "register" ? "Sign up" :
              mode === "forgot" ? "Send reset link" :
              mode === "reset" ? "Update password" :
              "Log in"}
          </button>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.subtle }}>
            {mode === "login" && (
              <>New here? <span style={{ color: C.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("register"); setError(""); setInfo(""); }}>Create an account</span></>
            )}
            {mode === "register" && (
              <>Already have one? <span style={{ color: C.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("login"); setError(""); setInfo(""); }}>Log in</span></>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <span style={{ color: C.primary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("login"); setError(""); setInfo(""); }}>Back to log in</span>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.faint, lineHeight: 1.4 }}>
          Passwords are handled by Supabase Auth (hashed, never stored in the browser). Email verification is controlled in your Supabase Auth settings.
        </p>
      </div>
      <BuildVersion fixed />
    </div>
  );
}
