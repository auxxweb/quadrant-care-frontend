import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UPLOADS_BASE_URL } from '../config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function calculateShiftDuration(startTime: string, endTime: string, breakMinutes: number, allowOvernight = true) {
  const parse = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  let duration = parse(endTime) - parse(startTime);
  if (duration <= 0) {
    if (!allowOvernight) throw new Error('End time must be after start time.');
    duration += 24 * 60;
  }
  if (duration >= 24 * 60) {
    throw new Error('A shift must be less than 24 hours in a day.');
  }
  const totalMinutes = duration - breakMinutes;
  if (totalMinutes < 0) throw new Error('Break duration cannot be greater than the shift length.');
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { totalMinutes, formattedHours: `${hours}:${String(minutes).padStart(2, '0')}` };
}

export function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB');
}

export function firstName(name?: string) {
  return name?.split(' ')[0] ?? 'there';
}

export function weekRange(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

export function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function fileUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${UPLOADS_BASE_URL}/${path}`;
}
