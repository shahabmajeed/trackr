import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

function gitSha() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project sites live at https://<user>.github.io/<repo>/
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.VITE_APP_VERSION || pkg.version),
    "import.meta.env.VITE_BUILD_NUMBER": JSON.stringify(process.env.VITE_BUILD_NUMBER || ""),
    "import.meta.env.VITE_BUILD_SHA": JSON.stringify(process.env.VITE_BUILD_SHA || gitSha()),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(process.env.VITE_BUILD_TIME || new Date().toISOString()),
  },
});
