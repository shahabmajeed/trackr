import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { C } from "./lib/theme";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2800,
        style: {
          fontSize: 13.5,
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
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
