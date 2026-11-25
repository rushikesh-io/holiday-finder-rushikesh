/**
 * Minimal CSV writer (RFC 4180 quoting) and a browser download helper.
 */

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * @param {string[]} headers
 * @param {Array<Array<unknown>>} rows
 */
export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** Save text as a file. A UTF-8 BOM is added so Excel shows accented names correctly. */
export function downloadText(filename, text, mimeType = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: mimeType }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
