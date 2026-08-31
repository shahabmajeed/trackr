/** Pure helpers for Reports aggregations (no UI). */

export function isDoneStatus(statusId, statuses) {
  const s = statuses?.find((x) => x.id === statusId);
  return Boolean(s && s.label.toLowerCase() === "done");
}

export function aggregateLogsByDay(logs) {
  const byDay = {};
  for (const l of logs) {
    const d = new Date(l.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDay[key]) {
      byDay[key] = {
        key,
        sort: d.getTime(),
        label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        minutes: 0,
      };
    }
    byDay[key].minutes += l.minutes;
  }
  return Object.values(byDay).sort((a, b) => a.sort - b.sort);
}

export function aggregateLogsByIssue(logs) {
  const byIssue = {};
  for (const l of logs) {
    const id = l.issue.id;
    if (!byIssue[id]) byIssue[id] = { issue: l.issue, minutes: 0, count: 0 };
    byIssue[id].minutes += l.minutes;
    byIssue[id].count += 1;
  }
  return Object.values(byIssue).sort((a, b) => b.minutes - a.minutes);
}

export function issueProgressCounts(issues, statuses) {
  let done = 0;
  let open = 0;
  for (const i of issues) {
    if (isDoneStatus(i.status, statuses)) done += 1;
    else open += 1;
  }
  return { done, open, total: issues.length };
}

export function estimateVsLogged(issues) {
  let estimated = 0;
  let logged = 0;
  let withEstimate = 0;
  for (const i of issues) {
    const mins = (i.timeLogs || []).reduce((a, t) => a + t.minutes, 0);
    logged += mins;
    if (i.estimatedMinutes != null && i.estimatedMinutes > 0) {
      estimated += i.estimatedMinutes;
      withEstimate += 1;
    }
  }
  const remaining = Math.max(0, estimated - logged);
  const over = logged > estimated ? logged - estimated : 0;
  return { estimated, logged, remaining, over, withEstimate };
}

/** Minutes per calendar day for a given year/month (1-based month). */
export function monthDayMinutes(allLogs, year, month) {
  const days = {};
  for (const l of allLogs) {
    const d = new Date(l.date);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
    const day = d.getDate();
    days[day] = (days[day] || 0) + l.minutes;
  }
  return days;
}

export function monthTotalMinutes(dayMap) {
  return Object.values(dayMap).reduce((a, m) => a + m, 0);
}
