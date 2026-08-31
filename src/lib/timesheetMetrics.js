/** Timesheet bucket builders and aggregation. */

export function startOfLocalDay(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function endOfLocalDay(ts) {
  return startOfLocalDay(ts) + 86400000 - 1;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatMMDD(ts) {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function buildTimesheetBuckets(fromTs, toTs, mode) {
  const from = startOfLocalDay(fromTs);
  const to = endOfLocalDay(toTs);
  if (from > to) return [];

  const buckets = [];

  if (mode === "daily") {
    for (let t = from; t <= to; t += 86400000) {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      buckets.push({
        key,
        label: formatMMDD(t),
        start: t,
        end: endOfLocalDay(t),
      });
    }
    return buckets;
  }

  if (mode === "weekly") {
    const startDow = new Date(from).getDay();
    const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
    let t = startOfLocalDay(from + mondayOffset * 86400000);
    if (t > from) t -= 7 * 86400000;
    while (t <= to) {
      const weekStart = Math.max(startOfLocalDay(t), from);
      const weekEnd = Math.min(endOfLocalDay(t + 6 * 86400000), to);
      if (weekStart <= weekEnd) {
        buckets.push({
          key: `w-${weekStart}`,
          label: `${formatMMDD(weekStart)}-${formatMMDD(weekEnd)}`,
          start: weekStart,
          end: weekEnd,
        });
      }
      t += 7 * 86400000;
    }
    return buckets;
  }

  if (mode === "monthly") {
    let y = new Date(from).getFullYear();
    let m = new Date(from).getMonth();
    const endRef = new Date(to);
    while (y < endRef.getFullYear() || (y === endRef.getFullYear() && m <= endRef.getMonth())) {
      const monthStart = new Date(y, m, 1).getTime();
      const monthEnd = endOfLocalDay(new Date(y, m + 1, 0).getTime());
      const start = Math.max(monthStart, from);
      const end = Math.min(monthEnd, to);
      if (start <= end) {
        buckets.push({
          key: `${y}-${pad2(m + 1)}`,
          label: new Date(y, m, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
          start,
          end,
        });
      }
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return buckets;
  }

  return buckets;
}

export function logInBucket(logDate, bucket) {
  const t = new Date(logDate).getTime();
  return t >= bucket.start && t <= bucket.end;
}

export function buildTimesheetRows(logs, buckets, users) {
  const byIssue = {};

  for (const l of logs) {
    const bucket = buckets.find((b) => logInBucket(l.date, b));
    if (!bucket) continue;

    const id = l.issue.id;
    if (!byIssue[id]) {
      byIssue[id] = {
        issue: l.issue,
        cells: Object.fromEntries(buckets.map((b) => [b.key, 0])),
        total: 0,
        authorMinutes: {},
      };
    }
    byIssue[id].cells[bucket.key] += l.minutes;
    byIssue[id].total += l.minutes;
    byIssue[id].authorMinutes[l.userId] = (byIssue[id].authorMinutes[l.userId] || 0) + l.minutes;
  }

  return Object.values(byIssue)
    .map((row) => {
      const topAuthorId = Object.entries(row.authorMinutes).sort((a, b) => b[1] - a[1])[0]?.[0];
      const author = users.find((u) => u.id === topAuthorId);
      return {
        issue: row.issue,
        cells: row.cells,
        total: row.total,
        author,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function bucketTotals(logs, buckets) {
  const totals = Object.fromEntries(buckets.map((b) => [b.key, 0]));
  let grand = 0;
  for (const l of logs) {
    const bucket = buckets.find((b) => logInBucket(l.date, b));
    if (!bucket) continue;
    totals[bucket.key] += l.minutes;
    grand += l.minutes;
  }
  return { totals, grand };
}

export function filterLogsInRange(logs, fromTs, toTs) {
  const from = startOfLocalDay(fromTs);
  const to = endOfLocalDay(toTs);
  return logs.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= from && t <= to;
  });
}
