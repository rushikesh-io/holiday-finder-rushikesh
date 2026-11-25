/**
 * utils.js — small, pure helpers shared across the app (dates, text, CSV).
 */

/** Escape text before inserting it with innerHTML — API data is untrusted. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse "YYYY-MM-DD" as a *local* date.
 * (new Date('2026-01-01') would be UTC midnight and can show the previous day in some time zones.)
 */
export function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from today until `date` (negative = in the past). */
export function daysFromToday(date) {
  return Math.round((date - startOfToday()) / 86_400_000);
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatLongDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "in 12 days", "tomorrow", "today", "3 days ago" */
export function relativeDays(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

/** Small flag image for a 2-letter country code (served by flagcdn.com). */
export function flagUrl(countryCode, width = 40) {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

/* ---------- CSV export ---------- */

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function holidaysToCsv(holidays) {
  const header = ['Date', 'Day of Week', 'Holiday Name', 'Local Name', 'Country Code', 'Holiday Type', 'Nationwide'];
  const rows = holidays.map((h) => [h.date, h.weekday, h.name, h.localName, h.countryCode, h.types.join(' / '), h.global ? 'Yes' : 'Regional']);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/** Trigger a file download in the browser. */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  // The BOM makes Excel open UTF-8 text (accents, non-Latin names) correctly.
  const blob = new Blob(['﻿', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
