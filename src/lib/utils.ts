import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, format, formatDistanceToNow, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, formatStr = 'PPP'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatDateThai(date: Date | string | null | undefined, formatStr = 'PPP'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: th });
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function getDaysOverdue(date: Date | string | null | undefined): number | null {
  const daysUntil = getDaysUntil(date);
  if (daysUntil === null) return null;
  return daysUntil < 0 ? Math.abs(daysUntil) : null;
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  const daysUntil = getDaysUntil(date);
  return daysUntil !== null && daysUntil < 0;
}

export function isExpiringSoon(date: Date | string | null | undefined, days = 30): boolean {
  const daysUntil = getDaysUntil(date);
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: th });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generatePartNumber(prefix: string = 'SKU'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}