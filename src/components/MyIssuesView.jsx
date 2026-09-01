import { useMemo, useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { C, PRIORITIES, fmtDate } from "../lib/theme";
import { TypeIcon } from "./IssueModal";
import { StatusPill } from "./StatusBadge";

function isDoneStatus(statuses, statusId) {
  const label = statuses.find((s) => s.id === statusId)?.label?.toLowerCase();
  return label === "done";
}

function defaultOpenStatusIds(statuses) {
  return new Set(
    statuses
      .filter((s) => {
        const label = s.label.toLowerCase();
        return label === "to do" || label === "reopen";
      })
      .map((s) => s.id)
  );
}

function PriorityCell({ priority }) {
  const meta = PRIORITIES[priority] || PRIORITIES.medium;
  const Icon = meta.icon;
  return (
    <span title={meta.label} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: meta.color }}>
      <Icon size={16} strokeWidth={2.5} />
    </span>
  );
}

export default function MyIssuesView({ issues, statuses, currentUserId, projectId, onOpen }) {
  const openStatuses = useMemo(
    () => statuses.filter((s) => !isDoneStatus(statuses, s.id)),
    [statuses]
  );

  const [statusFilter, setStatusFilter] = useState(() => defaultOpenStatusIds(statuses));

  useEffect(() => {
    setStatusFilter(defaultOpenStatusIds(statuses));
  }, [projectId, statuses]);

  const toggleStatus = (statusId) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const rows = useMemo(() => {
    return issues
      .filter((issue) => issue.assignee === currentUserId)
      .filter((issue) => !isDoneStatus(statuses, issue.status))
      .filter((issue) => statusFilter.has(issue.status))
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }, [issues, statuses, currentUserId, statusFilter]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.subtle, marginBottom: 8 }}>
          Show statuses
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {openStatuses.map((s) => {
            const active = statusFilter.has(s.id);
            return (
              <Chip
                key={s.id}
                size="small"
                label={s.label}
                onClick={() => toggleStatus(s.id)}
                sx={{
                  height: 26,
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: active ? s.bg : "#fff",
                  color: active ? s.text : C.subtle,
                  border: `1px solid ${active ? s.text : C.border}`,
                  "&:hover": { bgcolor: active ? s.bg : C.bg },
                }}
              />
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>
          Done issues are hidden. Default: To Do and Reopen.
        </div>
      </div>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${C.border}`, borderRadius: 2 }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow sx={{ background: C.bg }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle, width: 48, px: 1.5 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle, width: 88 }}>Ticket</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle, width: 100 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle, width: 100 }}>Updated</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: C.subtle, width: 130 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 4, textAlign: "center", color: C.faint, fontSize: 13 }}>
                  No issues assigned to you match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((issue) => (
                <TableRow
                  key={issue.id}
                  hover
                  onClick={() => onOpen(issue.id)}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell sx={{ px: 1.5 }}>
                    <PriorityCell priority={issue.priority} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12.5, color: C.faint, whiteSpace: "nowrap" }}>
                    {issue.key}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <TypeIcon type={issue.type} />
                      <span style={{ fontSize: 13.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {issue.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.subtle, whiteSpace: "nowrap" }}>
                    {fmtDate(issue.createdAt)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.subtle, whiteSpace: "nowrap" }}>
                    {fmtDate(issue.updatedAt || issue.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={issue.status} statuses={statuses} compact />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
