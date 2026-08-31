import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { C, fmtMinutes, inputStyle, selStyle, fmtDate, fromDateInputValue, toDateInputValue } from "../lib/theme";
import { TypeIcon } from "./IssueModal";
import {
  buildTimesheetBuckets,
  buildTimesheetRows,
  bucketTotals,
  filterLogsInRange,
} from "../lib/timesheetMetrics";

const GRANULARITY_OPTIONS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const ROW_WHITE = "#FFFFFF";
const ROW_GRAY = "#F4F6F8";
const HEAD_BG = "#F0F2F5";
const ITEM_COL_W = 280;
const AUTHOR_COL_W = 200;

const cellBorder = {
  borderBottom: `1px solid ${C.border}`,
  borderRight: `1px solid ${C.border}`,
};

function stickyTotalStyle(bg) {
  return {
    ...cellBorder,
    position: "sticky",
    right: 0,
    zIndex: 2,
    background: bg,
    borderLeft: `1px solid ${C.borderStrong}`,
    boxShadow: "-8px 0 10px -6px rgba(9, 30, 66, 0.12)",
    textAlign: "right",
    minWidth: 88,
    width: 88,
  };
}

function TimeCell({ minutes }) {
  if (!minutes || minutes <= 0) return null;
  return (
    <span style={{ color: C.primary, fontWeight: 700, fontSize: 13 }}>
      {fmtMinutes(minutes)}
    </span>
  );
}

function defaultRangeFrom() {
  const d = new Date();
  return toDateInputValue(new Date(d.getFullYear(), d.getMonth(), 1).getTime());
}

export function ReportsTimesheet({ allLogs, users, project, onOpenIssue }) {
  const [rangeFrom, setRangeFrom] = useState(defaultRangeFrom);
  const [rangeTo, setRangeTo] = useState(toDateInputValue(Date.now()));
  const [granularity, setGranularity] = useState("daily");
  const [applied, setApplied] = useState({
    from: defaultRangeFrom(),
    to: toDateInputValue(Date.now()),
    granularity: "daily",
  });

  const rangeInvalid = rangeFrom && rangeTo && rangeFrom > rangeTo;

  const run = () => {
    if (rangeInvalid || !rangeFrom || !rangeTo) return;
    setApplied({ from: rangeFrom, to: rangeTo, granularity });
  };

  const fromTs = fromDateInputValue(applied.from);
  const toTs = fromDateInputValue(applied.to);

  const filteredLogs = useMemo(
    () => (fromTs && toTs ? filterLogsInRange(allLogs, fromTs, toTs) : []),
    [allLogs, fromTs, toTs, applied.from, applied.to]
  );

  const buckets = useMemo(
    () => (fromTs && toTs ? buildTimesheetBuckets(fromTs, toTs, applied.granularity) : []),
    [fromTs, toTs, applied.granularity]
  );

  const rows = useMemo(
    () => buildTimesheetRows(filteredLogs, buckets, users),
    [filteredLogs, buckets, users]
  );

  const { totals, grand } = useMemo(
    () => bucketTotals(filteredLogs, buckets),
    [filteredLogs, buckets]
  );

  const rangeLabel = fromTs && toTs
    ? `${fmtDate(fromTs)} – ${fmtDate(toTs)}`
    : "Select dates";

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        flexWrap: "wrap",
        padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, marginBottom: 6, textTransform: "uppercase" }}>
            Date range
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="date"
              value={rangeFrom}
              max={rangeTo || toDateInputValue(Date.now())}
              onChange={(e) => setRangeFrom(e.target.value)}
              style={{ ...inputStyle, width: 150, fontSize: 13 }}
            />
            <span style={{ color: C.faint, fontSize: 13 }}>–</span>
            <input
              type="date"
              value={rangeTo}
              min={rangeFrom || undefined}
              max={toDateInputValue(Date.now())}
              onChange={(e) => setRangeTo(e.target.value)}
              style={{ ...inputStyle, width: 150, fontSize: 13 }}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, marginBottom: 6, textTransform: "uppercase" }}>
            Period
          </div>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            style={{ ...selStyle, width: 120, fontSize: 13, fontWeight: 600 }}
          >
            {GRANULARITY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={rangeInvalid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: rangeInvalid ? C.faint : "#216E4E",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: rangeInvalid ? "not-allowed" : "pointer",
            marginTop: 18,
          }}
        >
          <Play size={14} fill="#fff" />
          Run
        </button>
        {rangeInvalid && (
          <span style={{ fontSize: 12, color: C.danger, marginTop: 18 }}>End date must be on or after start</span>
        )}
      </div>

      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 15,
        fontWeight: 700,
        color: C.text,
      }}>
        Timesheet · {project?.name || "Project"}
        <span style={{ fontSize: 12, fontWeight: 600, color: C.subtle, marginLeft: 10 }}>
          {rangeLabel}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: C.subtle, fontSize: 14 }}>
          No time logged in this range. Adjust dates and click Run.
        </div>
      ) : (
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 13,
            minWidth: buckets.length > 6 ? buckets.length * 80 + ITEM_COL_W + AUTHOR_COL_W + 120 : "100%",
          }}>
            <thead>
              <tr>
                <th style={{
                  ...cellBorder,
                  textAlign: "left",
                  padding: "11px 14px",
                  fontWeight: 700,
                  color: C.faint,
                  fontSize: 11,
                  width: ITEM_COL_W,
                  minWidth: ITEM_COL_W,
                  background: HEAD_BG,
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                }}>
                  ITEM
                </th>
                <th style={{
                  ...cellBorder,
                  textAlign: "left",
                  padding: "11px 14px",
                  fontWeight: 700,
                  color: C.faint,
                  fontSize: 11,
                  width: AUTHOR_COL_W,
                  minWidth: AUTHOR_COL_W,
                  background: HEAD_BG,
                  position: "sticky",
                  left: ITEM_COL_W,
                  zIndex: 3,
                  boxShadow: "4px 0 8px -4px rgba(9, 30, 66, 0.06)",
                }}>
                  AUTHOR
                </th>
                {buckets.map((b) => (
                  <th
                    key={b.key}
                    style={{
                      ...cellBorder,
                      textAlign: "center",
                      padding: "11px 8px",
                      fontWeight: 700,
                      color: C.faint,
                      fontSize: 11,
                      minWidth: 76,
                      whiteSpace: "nowrap",
                      background: HEAD_BG,
                    }}
                  >
                    {b.label}
                  </th>
                ))}
                <th style={{
                  ...stickyTotalStyle(HEAD_BG),
                  padding: "11px 12px",
                  zIndex: 4,
                }}>
                  Σ
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ issue, cells, total, author }, idx) => {
                const rowBg = idx % 2 === 0 ? ROW_WHITE : ROW_GRAY;
                return (
                  <tr key={issue.id}>
                    <td style={{
                      ...cellBorder,
                      padding: "11px 14px",
                      background: rowBg,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      width: ITEM_COL_W,
                      minWidth: ITEM_COL_W,
                      maxWidth: ITEM_COL_W,
                      boxShadow: "4px 0 8px -4px rgba(9, 30, 66, 0.06)",
                    }}>
                      <button
                        type="button"
                        onClick={() => onOpenIssue?.(issue.id)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          background: "none",
                          border: "none",
                          cursor: onOpenIssue ? "pointer" : "default",
                          padding: 0,
                          color: C.primary,
                          fontWeight: 700,
                          fontSize: 13,
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <span style={{ marginTop: 2, flexShrink: 0, display: "flex" }}>
                          <TypeIcon type={issue.type} size={12} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block" }}>{issue.key}</span>
                          <span style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 500,
                            color: C.subtle,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {issue.title}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td style={{
                      ...cellBorder,
                      padding: "11px 14px",
                      color: C.text,
                      fontSize: 13,
                      fontWeight: 600,
                      background: rowBg,
                      position: "sticky",
                      left: ITEM_COL_W,
                      zIndex: 1,
                      width: AUTHOR_COL_W,
                      minWidth: AUTHOR_COL_W,
                      maxWidth: AUTHOR_COL_W,
                      boxShadow: "4px 0 8px -4px rgba(9, 30, 66, 0.06)",
                    }}>
                      {author?.name || ""}
                    </td>
                    {buckets.map((b) => (
                      <td key={b.key} style={{ ...cellBorder, padding: "11px 8px", textAlign: "center", background: rowBg }}>
                        <TimeCell minutes={cells[b.key]} />
                      </td>
                    ))}
                    <td style={{ ...stickyTotalStyle(rowBg), padding: "11px 12px", fontWeight: 800, color: C.text }}>
                      {fmtMinutes(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{
                  ...cellBorder,
                  padding: "12px 14px",
                  fontWeight: 800,
                  color: C.text,
                  background: HEAD_BG,
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  width: ITEM_COL_W,
                  minWidth: ITEM_COL_W,
                }}>
                  Total
                </td>
                <td style={{
                  ...cellBorder,
                  padding: "12px 14px",
                  background: HEAD_BG,
                  position: "sticky",
                  left: ITEM_COL_W,
                  zIndex: 3,
                  width: AUTHOR_COL_W,
                  minWidth: AUTHOR_COL_W,
                }} />
                {buckets.map((b) => (
                  <td key={b.key} style={{
                    ...cellBorder,
                    padding: "12px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    color: C.text,
                    background: HEAD_BG,
                  }}>
                    <TimeCell minutes={totals[b.key]} />
                  </td>
                ))}
                <td style={{
                  ...stickyTotalStyle(HEAD_BG),
                  padding: "12px 12px",
                  fontWeight: 800,
                  color: C.text,
                  fontSize: 14,
                  zIndex: 4,
                }}>
                  {fmtMinutes(grand)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
