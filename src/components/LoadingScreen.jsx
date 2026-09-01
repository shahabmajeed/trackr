import LinearProgress from "@mui/material/LinearProgress";
import { C, FONT_FAMILY } from "../lib/theme";

export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: FONT_FAMILY,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 1.4,
          color: C.faint,
          textTransform: "uppercase",
        }}
      >
        LOADING
      </div>
      <div style={{ width: 220, maxWidth: "100%" }}>
        <LinearProgress
          aria-label="Loading…"
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: "#EDE9FE",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#C4B5FD",
            },
          }}
        />
      </div>
    </div>
  );
}
