// ============================================================
// Reporting: read-only aggregates over existing tables + CSV serialization.
// Each report returns { columns, rows, summary } so the UI and the CSV
// exporter share one shape.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

// --- sales / revenue -------------------------------------------------------
async function salesReport() {
  const rows = await q(
    `SELECT p.invoice_no AS invoice, p.student_name AS student, c.title AS course,
            p.amount, p.method, p.type, p.status, p.created_at AS date
     FROM payments p LEFT JOIN courses c ON p.course_id = c.id
     ORDER BY p.created_at DESC, p.id DESC`
  );
  const revenue = rows.filter((r) => r.status === 'success').reduce((a, r) => a + Number(r.amount), 0);
  const refunded = rows.filter((r) => r.status === 'refunded').reduce((a, r) => a + Number(r.amount), 0);
  return {
    columns: [
      { key: 'invoice', label: 'Invoice' }, { key: 'student', label: 'Student' },
      { key: 'course', label: 'Course' }, { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' }, { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }
    ],
    rows,
    summary: { revenue, refunded, transactions: rows.length }
  };
}

// --- students --------------------------------------------------------------
async function studentsReport() {
  const rows = await q(
    `SELECT s.id, s.name, s.phone, COALESCE(b.name,'') AS batch, s.amount, s.paid
     FROM students s LEFT JOIN batches b ON s.batch_id = b.id ORDER BY s.id`
  );
  const out = rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, batch: r.batch, amount: r.amount, paid: r.paid ? 'Paid' : 'Due' }));
  return {
    columns: [
      { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
      { key: 'batch', label: 'Batch' }, { key: 'amount', label: 'Fee' }, { key: 'paid', label: 'Status' }
    ],
    rows: out,
    summary: { students: out.length, paid: rows.filter((r) => r.paid).length, due: rows.filter((r) => !r.paid).length }
  };
}

// --- attendance (rate per student) ----------------------------------------
async function attendanceReport() {
  const rows = await q(
    `SELECT s.id, s.name,
            COUNT(a.id) AS total,
            SUM(a.present) AS present
     FROM students s LEFT JOIN attendance a ON a.student_id = s.id
     GROUP BY s.id, s.name ORDER BY s.id`
  );
  const out = rows.map((r) => {
    const total = Number(r.total) || 0, present = Number(r.present) || 0;
    return { id: r.id, name: r.name, present, total, rate: total ? Math.round(present / total * 100) + '%' : '—' };
  });
  return {
    columns: [
      { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' },
      { key: 'present', label: 'Present' }, { key: 'total', label: 'Classes' }, { key: 'rate', label: 'Rate' }
    ],
    rows: out,
    summary: { students: out.length }
  };
}

const REPORTS = { sales: salesReport, students: studentsReport, attendance: attendanceReport };

export async function getReport(type) {
  const fn = REPORTS[type];
  if (!fn) throw new HttpError(400, { error: 'unknown_report' });
  return fn();
}

// RFC-4180-ish CSV. Prefixed with a UTF-8 BOM so Excel renders Bangla correctly.
export function toCSV({ columns, rows }) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\n');
  return '﻿' + header + '\n' + body + '\n';
}
