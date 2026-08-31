import { C } from "./theme";

const version = import.meta.env.VITE_APP_VERSION || "1.2.0.1";
const buildNum = import.meta.env.VITE_BUILD_NUMBER || "";
const sha = (import.meta.env.VITE_BUILD_SHA || "dev").slice(0, 7);

export function buildVersionLabel() {
  const parts = [`v${version}`];
  if (buildNum) parts.push(`build ${buildNum}`);
  if (sha !== "dev") parts.push(sha);
  return parts.join(" · ");
}

export function BuildVersion({ align = "right", fixed = false, style }) {
  const year = new Date().getFullYear();
  return (
    <div
      style={{
        fontSize: 11,
        color: C.faint,
        textAlign: align,
        lineHeight: 1.4,
        ...(fixed ? { position: "fixed", bottom: 12, right: 16, zIndex: 20 } : {}),
        ...style,
      }}
    >
      © {year} Trackr · {buildVersionLabel()}
    </div>
  );
}
