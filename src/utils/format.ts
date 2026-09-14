import { CURRENCY } from '@/lib/constants';
import type { DateString } from '@/types/base';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return formatRupiah(0);
  return currencyFormatter.format(amount);
}

export function formatNumber(amount: number, decimals = 0): string {
  if (!Number.isFinite(amount)) return formatNumber(0, decimals);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatPercentage(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return formatPercentage(0, decimals);
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(date: DateString | Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(date: DateString | Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: DateString | Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatTime(time: string): string {
  if (!time) return '-';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone;
  if (digits.startsWith('0')) {
    return `+62 ${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function truncate(text: string | null, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function truncateWords(text: string | null, maxWords: number): string {
  if (!text) return '-';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
}
