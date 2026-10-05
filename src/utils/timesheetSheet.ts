import type { Timesheet } from '../types';

export function formatSheetDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export function formatClockHours(totalMinutes: number) {
  const hours = Math.floor(Math.max(0, totalMinutes) / 60);
  const minutes = Math.max(0, totalMinutes) % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function sortTimesheets(items: Timesheet[]) {
  return items.slice().sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

export function groupTimesheetsByEmployee(items: Timesheet[]) {
  const groups = new Map<string, Timesheet[]>();
  for (const item of items) {
    const key = String(item.userId || item.employeeId || item.employeeSnapshot?.employeeId || item._id);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.values()].map(sortTimesheets);
}

export function sheetWeekLabel(items: Timesheet[]) {
  if (!items.length) return '';
  const first = items[0].date;
  const last = items[items.length - 1].date;
  return `${formatSheetDate(first)} - ${formatSheetDate(last)}`;
}
