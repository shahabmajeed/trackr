/**
 * MUI X Charts for Reports — delete this file + npm uninstall @mui/* to revert charts only.
 */
import { useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { C, fmtMinutes } from "../lib/theme";
import {
  aggregateLogsByDay,
  aggregateLogsByIssue,
  issueProgressCounts,
  estimateVsLogged,
} from "../lib/reportMetrics";
import { ReportsMonthCalendar } from "./ReportsMonthCalendar";

const CHART_HEIGHT = 220;
const TICKET_CHART_LIMIT = 8;

function ChartCard({ title, subtitle, children, style }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "14px 16px",
      boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
      ...style,
    }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div style={{ height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 13 }}>
      {text}
    </div>
  );
}

export function ReportsTimelineChart({ logs, periodLabel }) {
  const dayRows = useMemo(() => aggregateLogsByDay(logs), [logs]);
  const hours = dayRows.map((d) => Math.round((d.minutes / 60) * 10) / 10);
  const labels = dayRows.map((d) => d.label);

  if (dayRows.length === 0) {
    return (
      <ChartCard title="Hours timeline" subtitle={periodLabel}>
        <EmptyChart text="No time logged in this period" />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Hours timeline" subtitle={`Daily hours · ${periodLabel}`}>
      <LineChart
        height={CHART_HEIGHT}
        series={[{ data: hours, label: "Hours", color: C.primary, curve: "natural", showMark: dayRows.length <= 14 }]}
        xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
        yAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
        margin={{ left: 44, right: 12, top: 16, bottom: 36 }}
        grid={{ horizontal: true }}
      />
    </ChartCard>
  );
}

export function ReportsProgressCharts({ issues, statuses }) {
  const { done, open } = issueProgressCounts(issues, statuses);
  const est = estimateVsLogged(issues);

  const issuePie = [
    { id: 0, value: done, label: "Done", color: C.doneText },
    { id: 1, value: open, label: "Open", color: C.primary },
  ].filter((x) => x.value > 0);

  const timePie = est.withEstimate > 0
    ? [
        { id: 0, value: Math.round(est.logged / 60 * 10) / 10, label: "Logged", color: C.primary },
        { id: 1, value: Math.round(est.remaining / 60 * 10) / 10, label: "Remaining", color: C.doneText },
        ...(est.over > 0 ? [{ id: 2, value: Math.round(est.over / 60 * 10) / 10, label: "Over", color: C.danger }] : []),
      ].filter((x) => x.value > 0)
    : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
      <ChartCard title="Issue progress" subtitle={`${done} done · ${open} open`}>
        {issuePie.length === 0 ? (
          <EmptyChart text="No issues yet" />
        ) : (
          <PieChart
            height={CHART_HEIGHT}
            series={[{
              data: issuePie,
              innerRadius: 48,
              paddingAngle: 2,
              cornerRadius: 4,
              valueFormatter: (v) => `${v.value} issues`,
            }]}
            margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
            slotProps={{ legend: { position: { vertical: "middle", horizontal: "right" }, labelStyle: { fontSize: 11 } } }}
          />
        )}
      </ChartCard>
      <ChartCard
        title="Estimate vs logged"
        subtitle={est.withEstimate > 0 ? `${est.withEstimate} tickets with estimates` : "Set estimates on tickets to compare"}
      >
        {timePie.length === 0 ? (
          <EmptyChart text="Add original estimates on tickets" />
        ) : (
          <PieChart
            height={CHART_HEIGHT}
            series={[{
              data: timePie,
              innerRadius: 48,
              paddingAngle: 2,
              cornerRadius: 4,
              valueFormatter: (v) => `${v.value}h`,
            }]}
            margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
            slotProps={{ legend: { position: { vertical: "middle", horizontal: "right" }, labelStyle: { fontSize: 11 } } }}
          />
        )}
      </ChartCard>
    </div>
  );
}

export function ReportsTicketHoursChart({ logs, onOpenIssue }) {
  const issueRows = useMemo(() => aggregateLogsByIssue(logs).slice(0, TICKET_CHART_LIMIT), [logs]);
  const hours = issueRows.map((r) => Math.round((r.minutes / 60) * 10) / 10);
  const labels = issueRows.map((r) => r.issue.key);

  if (issueRows.length === 0) {
    return (
      <ChartCard title="Hours per ticket" subtitle="Top tickets in period">
        <EmptyChart text="No logged time on tickets" />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Hours per ticket" subtitle={`Top ${issueRows.length} in period`}>
      <BarChart
        layout="horizontal"
        height={Math.max(CHART_HEIGHT, issueRows.length * 28 + 40)}
        series={[{ data: hours, label: "Hours", color: C.primary }]}
        yAxis={[{ scaleType: "band", data: labels, tickLabelStyle: { fontSize: 11 } }]}
        xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
        margin={{ left: 72, right: 16, top: 8, bottom: 28 }}
        onItemClick={(_, d) => {
          const row = issueRows[d.dataIndex];
          if (row && onOpenIssue) onOpenIssue(row.issue.id);
        }}
      />
    </ChartCard>
  );
}

export { ReportsMonthCalendar } from "./ReportsMonthCalendar";

export function ReportsChartsPanel({ logs, allLogs, issues, statuses, periodLabel, onOpenIssue, showCalendar }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      <ReportsProgressCharts issues={issues} statuses={statuses} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <ReportsTimelineChart logs={logs} periodLabel={periodLabel} />
        <ReportsTicketHoursChart logs={logs} onOpenIssue={onOpenIssue} />
      </div>
      {showCalendar && <ReportsMonthCalendar allLogs={allLogs} />}
    </div>
  );
}
