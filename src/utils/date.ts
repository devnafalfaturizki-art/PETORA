export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === now.toDateString();
}

export function isPast(date: string | Date): boolean {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return d < new Date();
}

export function isFuture(date: string | Date): boolean {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return d > new Date();
}

export function daysBetween(start: string | Date, end: string | Date): number {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function dateDiffInTime(start: string | Date, end: string | Date): number {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return e.getTime() - s.getTime();
}

export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(date: string | Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: string | Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: string | Date = new Date()): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(date: string | Date = new Date()): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isWithinOperatingHours(
  time: string,
  config: { open: string; close: string }
): boolean {
  return time >= config.open && time <= config.close;
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentDateTimeISO(): string {
  return new Date().toISOString();
}

export function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeForInput(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return time;
}
