import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { isSupabaseConfigured } from "./lib/supabase";
import { C, FONT_FAMILY } from "./lib/theme";

function MissingConfig() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT_FAMILY, background: C.bg, padding: 24,
    }}>
      <div style={{
        maxWidth: 480, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "28px 24px", boxShadow: "0 4px 16px rgba(9,30,66,0.08)",
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: C.text }}>Trackr is not configured</h1>
        <p style={{ fontSize: 13.5, color: C.subtle, lineHeight: 1.5, margin: "0 0 16px" }}>
          This deployment is missing Supabase environment variables. Add them as GitHub Actions secrets, then redeploy.
        </p>
        <ol style={{ fontSize: 13, color: C.text, lineHeight: 1.6, paddingLeft: 20, margin: "0 0 16px" }}>
          <li>Repo → <strong>Settings → Secrets and variables → Actions</strong></li>
          <li>Add <code style={{ background: C.bg, padding: "1px 4px", borderRadius: 3 }}>VITE_SUPABASE_URL</code></li>
          <li>Add <code style={{ background: C.bg, padding: "1px 4px", borderRadius: 3 }}>VITE_SUPABASE_ANON_KEY</code></li>
          <li>Re-run <strong>Deploy to GitHub Pages</strong> workflow</li>
        </ol>
        <p style={{ fontSize: 12, color: C.faint, margin: 0 }}>
          Local dev: copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase values.
        </p>
      </div>
    </div>
  );
}

async function bootstrap() {
  const root = createRoot(document.getElementById("root"));

  if (!isSupabaseConfigured) {
    root.render(<MissingConfig />);
    return;
  }

  const { default: App } = await import("./App.jsx");

  root.render(
    <StrictMode>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: {
            fontSize: 13.5,
            fontFamily: FONT_FAMILY,
            color: C.text,
            border: `1px solid ${C.border}`,
          },
          success: { iconTheme: { primary: C.doneText, secondary: "#fff" } },
          error: { iconTheme: { primary: C.danger, secondary: "#fff" } },
        }}
      />
      <App />
    </StrictMode>
  );
}

bootstrap();
