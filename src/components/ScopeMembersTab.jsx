import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import CloseIcon from "@mui/icons-material/Close";
import { C, resolveAvatarColor, initials } from "../lib/theme";
import { displayRoleName, normalizeRole } from "../lib/privileges";

const whiteCard = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
};

const glassChipSx = {
  height: 22,
  fontSize: 11,
  fontWeight: 600,
  bgcolor: "rgba(255, 255, 255, 0.22)",
  backdropFilter: "blur(8px)",
  color: "#fff",
  border: "1px solid rgba(255, 255, 255, 0.38)",
  "& .MuiChip-label": { px: 1 },
};

function RoleChip({ label }) {
  return <Chip size="small" label={label} sx={glassChipSx} />;
}

function StatusChip({ active }) {
  if (active) {
    return (
      <Chip
        size="small"
        label="Active"
        icon={(
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "#4ADE80",
              display: "block",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
            }}
          />
        )}
        sx={{
          height: 22,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: "rgba(33, 110, 78, 0.92)",
          color: "#fff",
          "& .MuiChip-icon": { ml: "6px", mr: "-2px" },
          "& .MuiChip-label": { px: 1 },
        }}
      />
    );
  }

  return (
    <Chip
      size="small"
      label="Inactive"
      icon={<CloseIcon sx={{ fontSize: "13px !important" }} />}
      sx={{
        height: 22,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: "rgba(226, 72, 61, 0.92)",
        color: "#fff",
        "& .MuiChip-icon": { color: "#fff", ml: "5px", mr: "-2px" },
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}

function MemberTile({ user, roleLabel, status, isOwner }) {
  const roleName = displayRoleName(roleLabel.role, roleLabel.roleLabel, roleLabel.project);
  const active = status === "active";

  return (
    <>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: active ? "none" : "grayscale(0.85)",
            opacity: active ? 1 : 0.75,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: resolveAvatarColor(user),
            color: "#fff",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 0.5,
            opacity: active ? 1 : 0.72,
          }}
        >
          {initials(user.name)}
        </div>
      )}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          px: 1.25,
          py: 1.25,
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Box
          component="div"
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.25,
            mb: 0.75,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </Box>
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ gap: 0.5 }}>
          <RoleChip label={roleName} />
          {isOwner && <RoleChip label="Owner" />}
          <StatusChip active={active} />
        </Stack>
      </Box>
    </>
  );
}

export default function ScopeMembersTab({ project, users }) {
  const members = users
    .filter((u) => project.members.includes(u.id))
    .map((u) => {
      const rec = project.memberRecords?.[u.id] || {};
      const role = normalizeRole(rec.role || project.memberRoles?.[u.id]);
      const status = rec.status || project.memberStatus?.[u.id] || "active";
      const customLabel = rec.roleLabel || project.memberRoleLabels?.[u.id] || "";
      return {
        user: u,
        role,
        status,
        customLabel,
        isOwner: project.ownerId === u.id,
      };
    })
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return a.user.name.localeCompare(b.user.name);
    });

  if (members.length === 0) {
    return (
      <div style={{ ...whiteCard, textAlign: "center", padding: 48, color: C.faint, fontSize: 13.5 }}>
        No team members on this project yet.
      </div>
    );
  }

  return (
    <div style={whiteCard}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.faint, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 14 }}>
        Team ({members.length})
      </div>
      <ImageList
        cols={3}
        gap={12}
        rowHeight={210}
        sx={{
          width: "100%",
          margin: 0,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr) !important",
            sm: "repeat(3, 1fr) !important",
            md: "repeat(4, 1fr) !important",
          },
        }}
      >
        {members.map(({ user, role, status, customLabel, isOwner }) => (
          <ImageListItem
            key={user.id}
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              cursor: "default",
            }}
          >
            <MemberTile
              user={user}
              roleLabel={{ role, roleLabel: customLabel, project }}
              status={status}
              isOwner={isOwner}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </div>
  );
}
