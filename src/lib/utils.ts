import type { Registration } from '../types';

/* ---------- Email ---------- */

/**
 * Normalises an email address for duplicate detection:
 * trims, lowercases, drops "+tag" sub-addressing and removes dots for Gmail.
 */
export function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1) return email;
  let local = email.slice(0, at);
  let domain = email.slice(at + 1);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);
  if (domain === 'gmail.com') local = local.replace(/\./g, '');
  return `${local}@${domain}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  return email.length <= 254 && EMAIL_RE.test(email);
}

/* ---------- Dates ---------- */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local date key, e.g. "2026-10-30". */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function diffDays(fromKey: string, toKey: string): number {
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86_400_000);
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/* ---------- Money / numbers ---------- */

const inr0 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatINR = (n: number) => inr0.format(n);
export const formatINRPrecise = (n: number) => inr2.format(n);

/* ---------- Referral URLs & sharing ---------- */

export function getOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
}

export function buildReferralUrl(code: string, origin: string = getOrigin()): string {
  return `${origin}/register?ref=${encodeURIComponent(code)}`;
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildShareMessage(url: string): string {
  return `Join me at a free workshop: "Build Your First AI Project in 60 Minutes". Register here: ${url}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ---------- CSV ---------- */

function csvCell(value: string | number | null): string {
  let s = value == null ? '' : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const CSV_HEADERS = [
  'Registration ID',
  'Student Name',
  'Email',
  'College',
  'Acquisition Source',
  'Referral Code',
  'Registered At (ISO)',
  'Record Type',
];

export function registrationsToCsv(rows: Registration[]): string {
  const lines = [CSV_HEADERS.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.fullName,
        r.email,
        r.college,
        r.source,
        r.referralCode,
        r.createdAt,
        r.origin === 'sample' ? 'Sample (synthetic)' : 'Actual (local entry)',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob(['﻿', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
