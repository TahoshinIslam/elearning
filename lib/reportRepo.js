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

// --- course performance (real marketplace revenue, not the legacy batch-fee ledger) ---
async function coursesReport() {
  const [courses, revenueRows, enrolledRows, videoLessonRows, completedRows] = await Promise.all([
    q('SELECT id, title, published, rating, rating_count AS ratingCount FROM courses ORDER BY id'),
    q(
      `SELECT oi.course_id, SUM(oi.unit_price) AS revenue, COUNT(*) AS paidOrders
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'paid' GROUP BY oi.course_id`
    ),
    q('SELECT course_id, COUNT(*) AS enrolled FROM enrollments GROUP BY course_id'),
    q(
      `SELECT m.course_id, COUNT(DISTINCT l.id) AS videoLessons
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE l.type = 'video' GROUP BY m.course_id`
    ),
    q(
      `SELECT m.course_id, COUNT(*) AS completedCount
       FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
       WHERE lp.completed = 1 GROUP BY m.course_id`
    )
  ]);
  const byId = (arr, key) => Object.fromEntries(arr.map((r) => [r.course_id ?? r.id, r]));
  const revenueByCourse = byId(revenueRows), enrolledByCourse = byId(enrolledRows);
  const videoByCourse = byId(videoLessonRows), completedByCourse = byId(completedRows);

  const rows = courses.map((c) => {
    const enrolled = enrolledByCourse[c.id]?.enrolled || 0;
    const videoLessons = videoByCourse[c.id]?.videoLessons || 0;
    const completedCount = completedByCourse[c.id]?.completedCount || 0;
    const completion = videoLessons && enrolled ? Math.round((completedCount / (videoLessons * enrolled)) * 100) : null;
    return {
      id: c.id, title: c.title, status: c.published ? 'Published' : 'Draft',
      // MySQL's SUM() comes back as a string via mysql2 — always coerce.
      enrolled, revenue: Number(revenueByCourse[c.id]?.revenue) || 0,
      completion: completion == null ? '—' : `${completion}%`,
      rating: Number(c.rating) || 0, ratingCount: c.ratingCount || 0
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    columns: [
      { key: 'title', label: 'Course' }, { key: 'status', label: 'Status' },
      { key: 'enrolled', label: 'Enrolled' }, { key: 'revenue', label: 'Revenue' },
      { key: 'completion', label: 'Avg. completion' }, { key: 'rating', label: 'Rating' }, { key: 'ratingCount', label: 'Reviews' }
    ],
    rows,
    summary: {
      revenue: rows.reduce((a, r) => a + Number(r.revenue), 0),
      enrolled: rows.reduce((a, r) => a + r.enrolled, 0),
      published: rows.filter((r) => r.status === 'Published').length
    }
  };
}

const REPORTS = { sales: salesReport, students: studentsReport, attendance: attendanceReport, courses: coursesReport };

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
