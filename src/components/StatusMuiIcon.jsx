import { STATUS_ICON_MAP, resolveStatusIcon } from "../lib/statusIcons";

export default function StatusMuiIcon({ status, name, size = 16, color, style = {} }) {
  const iconName = name || resolveStatusIcon(status);
  const Icon = STATUS_ICON_MAP[iconName] || STATUS_ICON_MAP.Label;
  return (
    <Icon
      sx={{
        fontSize: size,
        color: color || "inherit",
        display: "block",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
