import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import Replay from "@mui/icons-material/Replay";
import Autorenew from "@mui/icons-material/Autorenew";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Label from "@mui/icons-material/Label";
import Flag from "@mui/icons-material/Flag";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import Pending from "@mui/icons-material/Pending";
import Block from "@mui/icons-material/Block";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmber from "@mui/icons-material/WarningAmber";
import CloudUpload from "@mui/icons-material/CloudUpload";
import CloudDone from "@mui/icons-material/CloudDone";
import RocketLaunch from "@mui/icons-material/RocketLaunch";
import Code from "@mui/icons-material/Code";
import BugReport from "@mui/icons-material/BugReport";
import Star from "@mui/icons-material/Star";
import Visibility from "@mui/icons-material/Visibility";
import Schedule from "@mui/icons-material/Schedule";
import Build from "@mui/icons-material/Build";
import Science from "@mui/icons-material/Science";
import Inventory from "@mui/icons-material/Inventory";
import LocalShipping from "@mui/icons-material/LocalShipping";
import Verified from "@mui/icons-material/Verified";
import PauseCircle from "@mui/icons-material/PauseCircle";
import PlayCircle from "@mui/icons-material/PlayCircle";
import RemoveCircleOutlined from "@mui/icons-material/RemoveCircleOutlined";

/** Map MUI icon export names to components (workflow only). */
export const STATUS_ICON_MAP = {
  RadioButtonUnchecked,
  Replay,
  Autorenew,
  CheckCircle,
  Label,
  Flag,
  HourglassEmpty,
  Pending,
  Block,
  ErrorOutlined,
  WarningAmber,
  CloudUpload,
  CloudDone,
  RocketLaunch,
  Code,
  BugReport,
  Star,
  Visibility,
  Schedule,
  Build,
  Science,
  Inventory,
  LocalShipping,
  Verified,
  PauseCircle,
  PlayCircle,
  RemoveCircleOutlined,
};

export const DEFAULT_STATUS_ICONS = {
  "to do": "RadioButtonUnchecked",
  reopen: "Replay",
  "in progress": "Autorenew",
  done: "CheckCircle",
};

/** Options for custom workflow icon picker. */
export const WORKFLOW_ICON_OPTIONS = [
  { name: "Label", label: "Label" },
  { name: "Flag", label: "Flag" },
  { name: "RadioButtonUnchecked", label: "To do" },
  { name: "Autorenew", label: "In progress" },
  { name: "CheckCircle", label: "Done" },
  { name: "Replay", label: "Reopen" },
  { name: "HourglassEmpty", label: "Waiting" },
  { name: "Pending", label: "Pending" },
  { name: "Schedule", label: "Scheduled" },
  { name: "PauseCircle", label: "Paused" },
  { name: "PlayCircle", label: "Active" },
  { name: "Block", label: "Blocked" },
  { name: "ErrorOutlined", label: "Error" },
  { name: "WarningAmber", label: "Warning" },
  { name: "CloudUpload", label: "Staging" },
  { name: "CloudDone", label: "Deployed" },
  { name: "RocketLaunch", label: "Release" },
  { name: "Code", label: "Development" },
  { name: "BugReport", label: "Bug" },
  { name: "Build", label: "Build" },
  { name: "Science", label: "Testing" },
  { name: "Inventory", label: "Inventory" },
  { name: "LocalShipping", label: "Shipping" },
  { name: "Verified", label: "Verified" },
  { name: "Star", label: "Star" },
  { name: "Visibility", label: "Review" },
];

export function defaultIconForStatusLabel(label) {
  const key = String(label || "").trim().toLowerCase();
  return DEFAULT_STATUS_ICONS[key] || "Label";
}

export function resolveStatusIcon(status) {
  const raw = status?.icon;
  const aliases = { ErrorOutline: "ErrorOutlined", RemoveCircleOutline: "RemoveCircleOutlined" };
  const icon = aliases[raw] || raw;
  if (icon && STATUS_ICON_MAP[icon]) return icon;
  return defaultIconForStatusLabel(status?.label);
}
