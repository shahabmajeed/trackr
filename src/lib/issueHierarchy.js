import { TYPES } from "./theme";

/** Allowed child issue types for each parent type. */
export const CHILD_TYPES_BY_PARENT = {
  epic: ["story", "task", "bug"],
  story: ["task", "bug"],
  task: ["subtask"],
  bug: ["subtask"],
  subtask: [],
};

/** Types that can be created at project root (board/backlog). */
export const ROOT_CREATE_TYPES = ["epic", "story", "task", "bug"];

export function allowedChildTypes(parentType) {
  return CHILD_TYPES_BY_PARENT[parentType] || [];
}

export function canHaveChildren(type) {
  return allowedChildTypes(type).length > 0;
}

export function isSubtaskType(type) {
  return type === "subtask";
}

export function typeLabel(type) {
  return TYPES[type]?.label || type;
}

export function validateRootCreate(type) {
  if (type === "subtask") return "Subtasks must be created under a Task or Bug.";
  return null;
}

export function validateParentChild(parentType, childType) {
  if (!parentType) return validateRootCreate(childType);
  const allowed = allowedChildTypes(parentType);
  if (!allowed.includes(childType)) {
    return `${typeLabel(childType)} cannot be created under ${typeLabel(parentType)}.`;
  }
  return null;
}

export function validateTypeChange(newType, { parentType, childTypes }) {
  if (newType === "subtask" && !parentType) {
    return "Subtasks must have a Task or Bug parent.";
  }
  if (parentType) {
    const err = validateParentChild(parentType, newType);
    if (err) return err;
  } else if (newType === "subtask") {
    return "Subtasks must have a Task or Bug parent.";
  }
  for (const ct of childTypes || []) {
    const err = validateParentChild(newType, ct);
    if (err) return `Cannot change type while child issues exist: ${err}`;
  }
  return null;
}

export function childSectionLabel(parentType) {
  switch (parentType) {
    case "epic": return "Child issues";
    case "story": return "Tasks & bugs";
    case "task":
    case "bug": return "Subtasks";
    default: return "Children";
  }
}

export function defaultChildType(parentType) {
  return allowedChildTypes(parentType)[0] || "task";
}

export function childCreatePlaceholder(parentType) {
  switch (parentType) {
    case "epic": return "Add story, task, or bug…";
    case "story": return "Add task or bug…";
    case "task":
    case "bug": return "Add subtask…";
    default: return "Add child issue…";
  }
}

/** Walk parent chain to find epic id for reporting/links. */
export function resolveEpicIdFromChain(startIssue, issuesById) {
  let cur = startIssue;
  const seen = new Set();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.type === "epic") return cur.id;
    if (cur.epicId) return cur.epicId;
    cur = cur.parentId ? issuesById.get(cur.parentId) : null;
  }
  return startIssue?.epicId || null;
}
