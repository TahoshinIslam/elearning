// Phase 2 — integration tests for the users↔students identity fix.
// These hit the real database (see tests/setup.mjs / .env.local), using
// fully isolated fixtures so the suite makes no assumptions about what else
// is already seeded. Covers exactly the three flows requested: student
// registration, student enrollment, student certificate generation.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { createUser, findUserByEmail } from '@/lib/authRepo';
import { enroll, issueCertificate } from '@/lib/repo';

const RUN_ID = Date.now();
const STUDENT_EMAIL = `phase2-test-${RUN_ID}@example.test`;

let courseId, batchId, studentUserId, studentId;

beforeAll(async () => {
  const courseRes = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language, completion_threshold)
     VALUES (?,?,1,500,0,0,0,'English',80)`,
    [`Phase 2 Test Course ${RUN_ID}`, `phase2-test-course-${RUN_ID}`]
  );
  courseId = courseRes.insertId;

  const moduleRes = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,0)', [courseId, 'Test Module']);
  const moduleId = moduleRes.insertId;

  await q(
    "INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,'video','10 min',1,0)",
    [moduleId, 'Test Lesson']
  );

  const batchRes = await q(
    "INSERT INTO batches (name, course_id, students_count, fee, schedule) VALUES (?,?,0,'500','Test schedule')",
    [`Phase 2 Test Batch ${RUN_ID}`, courseId]
  );
  batchId = batchRes.insertId;
});

afterAll(async () => {
  // Cascades handle most of this (per the schema's ON DELETE rules); this is
  // just belt-and-braces, ordered so nothing trips a live FK.
  if (batchId) await q('DELETE FROM batches WHERE id = ?', [batchId]); // cascades enrollments + attendance
  if (courseId) await q('DELETE FROM courses WHERE id = ?', [courseId]); // cascades modules + lessons + certificates
  if (studentId) await q('DELETE FROM students WHERE id = ?', [studentId]);
  if (studentUserId) await q('DELETE FROM users WHERE id = ?', [studentUserId]);
});

describe('student registration', () => {
  it('creates a linked students row in the same transaction as the users row', async () => {
    const user = await createUser({ name: 'Phase Two Tester', email: STUDENT_EMAIL, password: 'testpass123' });
    studentUserId = user.id;
    studentId = user.student_id;

    expect(user.role).toBe('student');
    // This is exactly the bug being fixed: student_id used to be null here.
    expect(studentId).toBeTruthy();

    const [studentRow] = await q('SELECT id, name FROM students WHERE id = ?', [studentId]);
    expect(studentRow).toBeTruthy();
    expect(studentRow.name).toBe('Phase Two Tester');

    const dbUser = await findUserByEmail(STUDENT_EMAIL);
    expect(dbUser.student_id).toBe(studentId);
  });

  it('rejects a duplicate email without leaving a half-created row behind', async () => {
    await expect(
      createUser({ name: 'Duplicate', email: STUDENT_EMAIL, password: 'testpass123' })
    ).rejects.toMatchObject({ status: 409 });

    const [{ c }] = await q('SELECT COUNT(*) AS c FROM users WHERE email = ?', [STUDENT_EMAIL]);
    expect(c).toBe(1); // still exactly the one real account, no orphaned duplicate
  });
});

describe('student enrollment', () => {
  it('enrolls a freshly self-registered student without an FK failure', async () => {
    expect(studentId).toBeTruthy(); // depends on the registration test above

    const enrollments = await enroll({ studentId, batchId });
    const mine = enrollments.filter((e) => e.studentId === studentId && e.batchId === batchId);
    expect(mine).toHaveLength(1);
    expect(mine[0].courseId).toBe(courseId);

    const [enrRow] = await q('SELECT status FROM enrollments WHERE student_id = ? AND batch_id = ?', [studentId, batchId]);
    expect(enrRow.status).toBe('active');
  });

  it('refuses a duplicate enrollment in the same batch', async () => {
    await expect(enroll({ studentId, batchId })).rejects.toMatchObject({ status: 409 });
  });
});

describe('student certificate generation', () => {
  it('issues a certificate once completion crosses the course threshold', async () => {
    expect(studentId).toBeTruthy();

    // The fixture course has zero assignment-type lessons, so lib/progress.js's
    // completion calc reduces to attendance rate alone — one present record
    // is enough to cross the 80% threshold set on the fixture course above.
    await q(
      "INSERT INTO attendance (student_id, batch_id, class_date, title, present) VALUES (?,?,CURDATE(),'Test class',1)",
      [studentId, batchId]
    );

    const result = await issueCertificate({ studentId, courseId, studentName: 'Phase Two Tester' });
    const mine = result.find((c) => c.studentId === studentId && c.courseId === courseId);

    expect(mine).toBeTruthy();
    expect(mine.completion).toBeGreaterThanOrEqual(80);
    expect(mine.certNo).toMatch(/^LEO-\d{4}-\d{4}$/);
  });

  it('refuses to issue the same certificate twice', async () => {
    await expect(
      issueCertificate({ studentId, courseId, studentName: 'Phase Two Tester' })
    ).rejects.toMatchObject({ status: 409 });
  });
});
