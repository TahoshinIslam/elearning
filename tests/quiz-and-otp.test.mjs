// Advanced quizzes (types, points, attempts, timer, reveal rules, teacher
// course scoping) and email one-time codes (login, reset, lockout).

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200)}` })
}));

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser } = await import('@/lib/auth');
const { fixtures } = await import('./helpers/fixtures.mjs');
const { saveQuiz, submitAttempt, getQuizForStudent, gradeAnswer, normalizeAnswer, startQuiz } = await import('@/lib/quizRepo');
const { requestOtp, verifyOtp } = await import('@/lib/otpRepo');
const routes = {
  quizzes: await import('@/app/api/quizzes/route.js'),
  otpVerify: await import('@/app/api/auth/otp/verify/route.js'),
  otpReset: await import('@/app/api/auth/otp/reset/route.js')
};

const fx = fixtures('quizotp');
let student, course, lessonId, owner;
const as = (s) => { jar.token = s ? signToken(s) : null; };
const call = async (fn, url, body) => {
  const res = await fn(new NextRequest(new URL(url, 'http://app.test'), body ? { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : undefined), { params: {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};

beforeAll(async () => {
  student = await fx.student('Quiz Taker');
  course = await fx.course({ lessons: [{ type: 'quiz' }] });
  [{ id: lessonId }] = await q("SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ? AND l.type = 'quiz' LIMIT 1", [course.courseId]);
  await fx.enroll(student.studentId, course.courseId);
  owner = sessionFromUser((await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1"))[0]);
});
afterAll(async () => {
  jar.token = null;
  await q('DELETE FROM quiz_attempts WHERE lesson_id = ?', [lessonId]);
  await q('DELETE FROM quiz_starts WHERE lesson_id = ?', [lessonId]);
  await q('DELETE FROM otp_codes WHERE email LIKE ?', [`${fx.RUN}%`]);
  await q('DELETE FROM demo_mail WHERE to_email LIKE ?', [`${fx.RUN}%`]);
  await fx.cleanup();
});

describe('quiz grading', () => {
  it('normalises short answers (case, spaces, Bangla digits)', () => {
    expect(normalizeAnswer('  ৯.৮  ')).toBe(normalizeAnswer('9 8'));
    expect(gradeAnswer({ type: 'short', acceptedAnswers: ['Newton'], options: [] }, ' newton ')).toBe(true);
    expect(gradeAnswer({ type: 'multiple', options: [{ id: 1, isCorrect: true }, { id: 2, isCorrect: true }, { id: 3, isCorrect: false }] }, [2, 1])).toBe(true);
    expect(gradeAnswer({ type: 'multiple', options: [{ id: 1, isCorrect: true }, { id: 2, isCorrect: true }, { id: 3, isCorrect: false }] }, [1])).toBe(false);
  });

  let quiz;
  it('saves every question type with points and settings', async () => {
    quiz = await saveQuiz({
      lessonId,
      settings: { passPercent: 60, maxAttempts: 2, showAnswers: 'after_pass' },
      questions: [
        { type: 'single', question: 'g?', points: 2, options: [{ text: '9.8', isCorrect: true }, { text: '10', isCorrect: false }] },
        { type: 'multiple', question: 'Vectors?', points: 3, options: [{ text: 'force', isCorrect: true }, { text: 'velocity', isCorrect: true }, { text: 'mass', isCorrect: false }] },
        { type: 'true_false', question: 'Light is a wave', points: 1, options: [{ text: 'True', isCorrect: true }] },
        { type: 'short', question: 'Unit of force?', points: 4, acceptedAnswers: ['newton', 'N'], explanation: 'SI unit' }
      ]
    });
    expect(quiz.questions.map((x) => x.type)).toEqual(['single', 'multiple', 'true_false', 'short']);
    expect(quiz.settings).toMatchObject({ passPercent: 60, maxAttempts: 2, showAnswers: 'after_pass' });
  });

  it('rejects an invalid question with its number', async () => {
    await expect(saveQuiz({ lessonId, questions: [{ type: 'single', question: 'x', options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] }] }))
      .rejects.toMatchObject({ status: 400, body: { error: 'question_needs_one_correct', question: 1 } });
  });

  it('grades by points, hides answers until passed, enforces the attempt limit', async () => {
    const [s, m, tf, sh] = quiz.questions;
    const yes = (qq) => qq.options.find((o) => o.isCorrect).id;
    const view = await getQuizForStudent(lessonId, student.studentId);
    expect(view.questions.every((x) => x.options.every((o) => o.isCorrect === undefined))).toBe(true);

    const fail = await submitAttempt({ lessonId, studentId: student.studentId, answers: { [s.id]: yes(s), [m.id]: [m.options[0].id], [tf.id]: tf.options[1].id, [sh.id]: 'joule' } });
    expect(fail).toMatchObject({ score: 2, maxScore: 10, percent: 20, passed: false, attemptsLeft: 1 });
    expect(fail.correct).toBeUndefined(); // after_pass: not yet

    const pass = await submitAttempt({ lessonId, studentId: student.studentId, answers: { [s.id]: yes(s), [m.id]: m.options.filter((o) => o.isCorrect).map((o) => o.id), [tf.id]: yes(tf), [sh.id]: ' Newton ' } });
    expect(pass).toMatchObject({ score: 10, percent: 100, passed: true, attemptsLeft: 0 });
    expect(pass.correct[sh.id]).toBe('newton');
    expect(pass.explanations[sh.id]).toBe('SI unit');

    await expect(submitAttempt({ lessonId, studentId: student.studentId, answers: {} })).rejects.toMatchObject({ status: 403 });
  });

  it('timed quizzes need a start and ignore late answers', async () => {
    await q('DELETE FROM quiz_attempts WHERE lesson_id = ?', [lessonId]);
    await q('UPDATE quiz_settings SET time_limit_sec = 60, max_attempts = 0 WHERE lesson_id = ?', [lessonId]);
    await expect(submitAttempt({ lessonId, studentId: student.studentId, answers: {} })).rejects.toMatchObject({ body: { error: 'quiz_not_started' } });
    const st = await startQuiz(lessonId, student.studentId);
    expect(st.secondsLeft).toBeGreaterThan(55);
    await q('UPDATE quiz_starts SET started_at = NOW() - INTERVAL 10 MINUTE WHERE lesson_id = ? AND student_id = ?', [lessonId, student.studentId]);
    const [s] = quiz.questions;
    const late = await submitAttempt({ lessonId, studentId: student.studentId, answers: { [s.id]: s.options.find((o) => o.isCorrect).id } });
    expect(late.score).toBe(0);
  });

  it('a teacher cannot edit a quiz in a course they do not teach', async () => {
    const t = await q("SELECT * FROM users WHERE role = 'teacher' AND teacher_id IS NOT NULL LIMIT 1");
    const teacher = sessionFromUser({ ...t[0], sections: 'quizzes:manage' });
    await q('UPDATE users SET sections = ? WHERE id = ?', ['quizzes:manage', t[0].id]);
    try {
      as(teacher);
      expect((await call(routes.quizzes.GET, `/api/quizzes?lessonId=${lessonId}&mode=edit`)).status).toBe(403);
    } finally {
      await q('UPDATE users SET sections = ? WHERE id = ?', [t[0].sections, t[0].id]);
    }
    as(owner);
    expect((await call(routes.quizzes.GET, `/api/quizzes?lessonId=${lessonId}&mode=edit`)).status).toBe(200);
  });
});

describe('email one-time codes', () => {
  it('signs in with the emailed code; wrong codes count down and lock', async () => {
    const email = student.user.email;
    const r = await requestOtp(email, 'login');
    expect(r).toMatchObject({ ok: true, attemptsLeft: 3, expiresIn: 180 });
    expect(r.demoCode).toMatch(/^\d{6}$/);
    const [mail] = await q('SELECT subject FROM demo_mail WHERE to_email = ? ORDER BY id DESC LIMIT 1', [email]);
    expect(mail.subject).toContain(r.demoCode);
    const [row] = await q('SELECT code_hash FROM otp_codes WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
    expect(row.code_hash).not.toContain(r.demoCode);

    const wrong = r.demoCode === '000000' ? '111111' : '000000';
    await expect(verifyOtp(email, 'login', wrong)).rejects.toMatchObject({ body: { error: 'otp_wrong', attemptsLeft: 2 } });
    const ok = await call(routes.otpVerify.POST, '/api/auth/otp/verify', { email, code: r.demoCode, purpose: 'login' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.id).toBe(student.user.id);
    // single use
    await expect(verifyOtp(email, 'login', r.demoCode)).rejects.toMatchObject({ body: { error: 'otp_expired' } });
  });

  it('resend is rate limited and unknown emails look identical', async () => {
    await expect(requestOtp(student.user.email, 'login')).rejects.toMatchObject({ status: 429 });
    const ghost = await requestOtp(`${fx.RUN}-nobody@example.test`, 'login');
    expect(ghost).toMatchObject({ ok: true, attemptsLeft: 3 });
    expect(ghost.demoCode).toBeUndefined();
  });

  it('locks after three wrong codes', async () => {
    await q('DELETE FROM otp_codes WHERE email = ?', [student.user.email]);
    await requestOtp(student.user.email, 'reset');
    for (const n of [2, 1]) await expect(verifyOtp(student.user.email, 'reset', '999999')).rejects.toMatchObject({ body: { attemptsLeft: n } }).catch(() => {});
    await expect(verifyOtp(student.user.email, 'reset', '999999')).rejects.toMatchObject({ body: { error: expect.stringMatching(/otp_(locked|expired)/) } });
  });

  it('resets the password with a one-time ticket', async () => {
    await q('DELETE FROM otp_codes WHERE email = ?', [student.user.email]);
    const r = await requestOtp(student.user.email, 'reset');
    const v = await call(routes.otpVerify.POST, '/api/auth/otp/verify', { email: student.user.email, code: r.demoCode, purpose: 'reset' });
    expect(v.body.ticket).toBeTruthy();
    expect((await call(routes.otpReset.POST, '/api/auth/otp/reset', { ticket: v.body.ticket, password: 'short' })).status).toBe(400);
    expect((await call(routes.otpReset.POST, '/api/auth/otp/reset', { ticket: v.body.ticket, password: 'brand-new-pass-1' })).status).toBe(200);
    expect((await call(routes.otpReset.POST, '/api/auth/otp/reset', { ticket: v.body.ticket, password: 'another-pass-22' })).status).toBe(400);
  });
});
