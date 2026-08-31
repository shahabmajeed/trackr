/**
 * Monthly hours calendar — MUI X DateCalendar. Revert: delete file + uninstall @mui/x-date-pickers dayjs.
 */
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar, PickerDay } from "@mui/x-date-pickers";
import { C, fmtMinutes, selStyle } from "../lib/theme";
import { monthDayMinutes, monthTotalMinutes } from "../lib/reportMetrics";

const calendarTheme = createTheme({
  typography: {
    fontFamily: "inherit",
    fontSize: 15,
  },
  components: {
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          paddingLeft: 8,
          paddingRight: 8,
          marginBottom: 4,
        },
        label: {
          fontSize: "1.125rem",
          fontWeight: 700,
        },
      },
    },
    MuiDayCalendar: {
      styleOverrides: {
        header: {
          fontSize: "0.8125rem",
          fontWeight: 700,
          color: "#8590A2",
        },
        weekDayLabel: {
          width: "14.28%",
          margin: 0,
        },
        weekContainer: {
          margin: 0,
        },
      },
    },
    MuiDateCalendar: {
      styleOverrides: {
        root: {
          width: "100%",
          maxWidth: "100%",
          height: "auto",
        },
      },
    },
  },
});

function HoursDay(props) {
  const { day, outsideCurrentMonth, minutes = 0, selected, ...other } = props;
  const hasHours = minutes > 0 && !outsideCurrentMonth;
  const isOutside = Boolean(outsideCurrentMonth);

  return (
    <Box sx={{
      flex: "1 1 0",
      minWidth: 0,
      display: "flex",
      justifyContent: "center",
      position: "relative",
    }}>
      <PickerDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          width: 40,
          height: hasHours ? 50 : 38,
          margin: 0,
          fontSize: isOutside ? "14px" : "16px",
          fontWeight: isOutside ? 500 : 700,
          borderRadius: 6,
          border: hasHours ? `1px solid ${C.border}` : "1px solid transparent",
          bgcolor: isOutside ? "transparent" : hasHours ? C.primarySoft : "transparent",
          color: isOutside ? C.faint : C.text,
          opacity: isOutside ? 0.55 : 1,
          "&:hover": {
            bgcolor: isOutside ? "transparent" : hasHours ? "#DEEBFF" : C.bg,
          },
          "&.Mui-selected": {
            bgcolor: isOutside ? "transparent" : C.primary,
            color: isOutside ? C.faint : "#fff",
            borderColor: isOutside ? "transparent" : C.primary,
            opacity: isOutside ? 0.55 : 1,
            "&:hover": {
              bgcolor: isOutside ? "transparent" : C.primaryHover,
            },
          },
          "&.MuiPickerDay-outsideCurrentMonth": {
            color: C.faint,
            opacity: 0.55,
          },
        }}
      />
      {hasHours && (
        <Box
          sx={{
            position: "absolute",
            bottom: 3,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1,
            color: selected ? "#fff" : C.primary,
            pointerEvents: "none",
          }}
        >
          {fmtMinutes(minutes)}
        </Box>
      )}
    </Box>
  );
}

export function ReportsMonthCalendar({ allLogs }) {
  const [viewMonth, setViewMonth] = useState(dayjs().startOf("month"));
  const [selected, setSelected] = useState(null);
  const [calendarView, setCalendarView] = useState("day");

  const currentYear = dayjs().year();
  const minLogYear = useMemo(() => {
    let y = currentYear;
    for (const l of allLogs) {
      const ly = dayjs(l.date).year();
      if (ly < y) y = ly;
    }
    return y;
  }, [allLogs, currentYear]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= minLogYear; y -= 1) years.push(y);
    return years;
  }, [currentYear, minLogYear]);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: dayjs().month(i).format("MMMM"),
    })),
    []
  );

  const goToMonth = (y, m) => {
    const next = dayjs().year(y).month(m).startOf("month");
    const capped = next.isAfter(dayjs(), "month") ? dayjs().startOf("month") : next;
    setViewMonth(capped);
    setSelected(null);
    setCalendarView("day");
  };

  const year = viewMonth.year();
  const month = viewMonth.month() + 1;
  const dayMap = useMemo(() => monthDayMinutes(allLogs, year, month), [allLogs, year, month]);
  const monthTotal = monthTotalMinutes(dayMap);
  const monthLabel = viewMonth.format("MMMM YYYY");

  const selectedDay = selected ? selected.date() : null;
  const selectedMinutes = selectedDay ? dayMap[selectedDay] || 0 : 0;
  const selectedDateLabel = selected
    ? selected.format("dddd, MMMM D, YYYY")
    : null;

  const dayLogs = selected
    ? allLogs
        .filter((l) => {
          const d = dayjs(l.date);
          return d.year() === year && d.month() + 1 === month && d.date() === selectedDay;
        })
        .sort((a, b) => b.date - a.date)
    : [];

  const weeksInView = useMemo(() => {
    const firstDow = viewMonth.startOf("month").day();
    const daysInMonth = viewMonth.daysInMonth();
    return Math.ceil((firstDow + daysInMonth) / 7);
  }, [viewMonth]);

  const dayGridMinHeight = weeksInView * 52 + 8;

  const DaySlot = useMemo(
    () =>
      function DaySlot(props) {
        const mins = props.outsideCurrentMonth ? 0 : dayMap[props.day.date()] || 0;
        return <HoursDay {...props} minutes={mins} />;
      },
    [dayMap]
  );

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: "16px 18px 20px",
      boxShadow: "0 1px 2px rgba(9,30,66,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Monthly calendar</div>
        <div style={{ fontSize: 14, color: C.subtle, marginTop: 4 }}>
          {monthLabel} · {fmtMinutes(monthTotal)} logged
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14,
      }}>
        <select
          value={viewMonth.month()}
          onChange={(e) => goToMonth(viewMonth.year(), Number(e.target.value))}
          style={{ ...selStyle, width: 140, fontSize: 14, fontWeight: 600 }}
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={viewMonth.year()}
          onChange={(e) => goToMonth(Number(e.target.value), viewMonth.month())}
          style={{ ...selStyle, width: 100, fontSize: 14, fontWeight: 600 }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <Box sx={{ width: "100%", maxWidth: 420, mx: "auto" }}>
        <ThemeProvider theme={calendarTheme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selected}
              referenceDate={viewMonth}
              view={calendarView}
              onViewChange={setCalendarView}
              onChange={(newValue) => {
                if (calendarView === "year") {
                  if (newValue) goToMonth(newValue.year(), viewMonth.month());
                  return;
                }
                if (calendarView === "month") {
                  if (newValue) goToMonth(newValue.year(), newValue.month());
                  return;
                }
                setSelected(newValue);
              }}
              onMonthChange={(newMonth) => {
                setViewMonth(newMonth.startOf("month"));
                setSelected(null);
              }}
              onYearChange={(newYear) => {
                setViewMonth(newYear.month(viewMonth.month()).startOf("month"));
                setSelected(null);
              }}
              maxDate={dayjs()}
              views={["day", "month", "year"]}
              openTo="day"
              showDaysOutsideCurrentMonth
              slots={{ day: DaySlot }}
              sx={{
                width: "100%",
                maxWidth: "100%",
                m: 0,
                "& .MuiPickersSlideTransition-root": {
                  display: "block",
                  minHeight: dayGridMinHeight,
                  height: "auto",
                },
                "& .MuiDayCalendar-slideTransition": {
                  display: "block",
                  minHeight: dayGridMinHeight,
                  height: "auto",
                  position: "relative",
                },
                "& .MuiDayCalendar-monthContainer": {
                  position: "relative",
                  width: "100%",
                },
                "& .MuiDayCalendar-weekContainer": {
                  margin: 0,
                  width: "100%",
                },
                "& .MuiPickersArrowSwitcher-root .MuiIconButton-root": {
                  color: C.text,
                },
              }}
            />
          </LocalizationProvider>
        </ThemeProvider>
      </Box>

      {selected && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>
            {selectedDateLabel} · {fmtMinutes(selectedMinutes)}
          </div>
          {dayLogs.length === 0 ? (
            <div style={{ fontSize: 14, color: C.faint }}>No entries</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayLogs.map((l) => (
                <div key={l.id} style={{ fontSize: 14, color: C.text }}>
                  <span style={{ fontWeight: 800 }}>{fmtMinutes(l.minutes)}</span>
                  {" on "}
                  <span style={{ color: C.primary, fontWeight: 700 }}>{l.issue.key}</span>
                  {l.note && <span style={{ color: C.subtle }}> · {l.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
