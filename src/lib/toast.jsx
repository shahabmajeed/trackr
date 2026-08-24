import toast from "react-hot-toast";
import { C } from "./theme";

export { toast };

export const toastSuccess = (message) => toast.success(message);
export const toastError = (message) => toast.error(message || "Something went wrong");
export const toastInfo = (message) => toast(message, { icon: "ℹ️" });

/** Promise-based confirm using a toast with Yes / Cancel actions. */
export function toastConfirm(message, { confirmLabel = "Delete", cancelLabel = "Cancel" } = {}) {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
          <div style={{ fontSize: 13.5, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{message}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              style={{
                background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4,
                padding: "5px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: C.text,
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              style={{
                background: C.danger, color: "#fff", border: "none", borderRadius: 4,
                padding: "5px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          maxWidth: 380,
          padding: "14px 16px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 8px 24px rgba(9,30,66,0.18)",
        },
      }
    );
  });
}
