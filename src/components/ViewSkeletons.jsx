import Skeleton from "@mui/material/Skeleton";
import { C } from "../lib/theme";

const sk = {
  bgcolor: "#EDE9FE",
  transform: "none",
  "&::after": {
    background: "linear-gradient(90deg, transparent, rgba(196, 181, 253, 0.5), transparent)",
  },
};

function Sk({ variant = "rounded", width, height, sx = {} }) {
  return (
    <Skeleton
      animation="wave"
      variant={variant}
      width={width}
      height={height}
      sx={{ ...sk, borderRadius: variant === "rounded" ? 6 : undefined, ...sx }}
    />
  );
}

export function FilterBarSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: "#fff" }}>
      <Sk width={200} height={32} />
      <Sk width={130} height={32} sx={{ borderRadius: 20 }} />
      <Sk width={72} height={26} sx={{ borderRadius: 12 }} />
      <Sk width={88} height={26} sx={{ borderRadius: 12 }} />
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div style={{ display: "flex", gap: 14, padding: 20, overflowX: "auto", alignItems: "flex-start" }}>
      {[0, 1, 2, 3].map((col) => (
        <div key={col} style={{ minWidth: 280, flex: "1 1 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sk width={88} height={26} sx={{ borderRadius: 6 }} />
            <Sk width={20} height={14} variant="text" />
          </div>
          <div style={{ background: C.bg, borderRadius: 6, padding: 8, minHeight: 200 }}>
            {[0, 1, 2].slice(0, col === 0 ? 3 : col === 1 ? 2 : 1).map((card) => (
              <div key={card} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <Sk width="90%" height={16} variant="text" sx={{ mb: 1 }} />
                <Sk width="70%" height={14} variant="text" sx={{ mb: 1.5 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Sk width={100} height={14} variant="text" />
                  <Skeleton animation="wave" variant="circular" width={24} height={24} sx={sk} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BacklogSkeleton() {
  return (
    <div style={{ padding: 20 }}>
      {[0, 1, 2].map((section) => (
        <div key={section} style={{ marginBottom: 18, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Sk width={16} height={16} />
            <Sk width={140} height={18} variant="text" />
            <Sk width={60} height={14} variant="text" />
          </div>
          {[0, 1].map((row) => (
            <div key={row} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
              <Sk width={18} height={18} />
              <Sk width={48} height={14} variant="text" />
              <Sk width="45%" height={16} variant="text" sx={{ flex: 1 }} />
              <Sk width={64} height={22} sx={{ borderRadius: 12 }} />
              <Skeleton animation="wave" variant="circular" width={24} height={24} sx={sk} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SprintsSkeleton() {
  return (
    <div style={{ padding: 20, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Sk width={80} height={22} variant="text" />
        <Sk width={88} height={32} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
          <Sk width="55%" height={18} variant="text" sx={{ mb: 1 }} />
          <Sk width="80%" height={14} variant="text" sx={{ mb: 1 }} />
          <Sk width="40%" height={14} variant="text" />
        </div>
      ))}
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div style={{ padding: 20 }}>
      <Sk width={120} height={22} variant="text" sx={{ mb: 1.5 }} />
      <Sk width={220} height={14} variant="text" sx={{ mb: 2 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Sk key={i} width={72} height={32} sx={{ borderRadius: 20 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: 16 }}>
            <Sk width="60%" height={14} variant="text" sx={{ mb: 1 }} />
            <Sk width="40%" height={28} variant="text" />
          </div>
        ))}
      </div>
      <Sk width="100%" height={220} sx={{ mb: 2 }} />
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, padding: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
            <Sk width={56} height={14} variant="text" />
            <Sk width="50%" height={16} variant="text" sx={{ flex: 1 }} />
            <Sk width={48} height={14} variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScopeSkeleton() {
  return (
    <div style={{ padding: "20px 24px 48px", maxWidth: 980 }}>
      <Sk width={80} height={26} variant="text" sx={{ mb: 1 }} />
      <Sk width="70%" height={16} variant="text" sx={{ mb: 2.5 }} />
      <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${C.border}`, marginBottom: 20, paddingBottom: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} width={72} height={18} variant="text" />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <Sk width="50%" height={20} variant="text" sx={{ mb: 2 }} />
          <Sk width="100%" height={14} variant="text" sx={{ mb: 1 }} />
          <Sk width="95%" height={14} variant="text" sx={{ mb: 1 }} />
          <Sk width="88%" height={14} variant="text" sx={{ mb: 2 }} />
          <Sk width="100%" height={120} />
        </div>
        <div style={{ background: "#F4F6F8", borderRadius: 10, padding: 18 }}>
          <Sk width="60%" height={18} variant="text" sx={{ mb: 2 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <Sk width={15} height={15} />
              <div style={{ flex: 1 }}>
                <Sk width="40%" height={12} variant="text" sx={{ mb: 0.5 }} />
                <Sk width="75%" height={14} variant="text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MyIssuesSkeleton() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <Sk key={i} width={72} height={26} sx={{ borderRadius: 13 }} />
        ))}
      </div>
      <Sk width="100%" height={320} />
    </div>
  );
}

const SKELETONS = {
  board: BoardSkeleton,
  backlog: BacklogSkeleton,
  myissues: MyIssuesSkeleton,
  sprints: SprintsSkeleton,
  reports: ReportsSkeleton,
  scope: ScopeSkeleton,
};

export default function ViewSkeleton({ view }) {
  const Comp = SKELETONS[view] || BoardSkeleton;
  return <Comp />;
}
