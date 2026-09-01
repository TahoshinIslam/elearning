// ============================================================
// Per-lesson Q&A. Anyone may read a thread; posting requires a session.
// Answers carry the author's role so instructors/mentors get a badge.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getThread(lessonId) {
  const questions = await q(
    `SELECT id, author_name AS authorName, role, body, created_at AS createdAt
     FROM lesson_questions WHERE lesson_id = ? ORDER BY id DESC`, [lessonId]);
  if (!questions.length) return [];
  const ids = questions.map((r) => r.id);
  const answers = await q(
    `SELECT id, question_id AS questionId, author_name AS authorName, role, body, created_at AS createdAt
     FROM lesson_answers WHERE question_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`, ids);
  return questions.map((qq) => ({ ...qq, answers: answers.filter((a) => a.questionId === qq.id) }));
}

export async function askQuestion(session, body) {
  const lessonId = Number(body.lessonId);
  const text = String(body.body || '').trim();
  if (!lessonId) throw new HttpError(400, { error: 'lesson_required' });
  if (!text) throw new HttpError(400, { error: 'body_required' });
  await q('INSERT INTO lesson_questions (lesson_id, user_id, author_name, role, body) VALUES (?,?,?,?,?)',
    [lessonId, session.id, session.name || 'User', session.role, text]);
  return getThread(lessonId);
}

export async function postAnswer(session, body) {
  const questionId = Number(body.questionId);
  const text = String(body.body || '').trim();
  if (!questionId) throw new HttpError(400, { error: 'question_required' });
  if (!text) throw new HttpError(400, { error: 'body_required' });
  const rows = await q('SELECT lesson_id FROM lesson_questions WHERE id = ? LIMIT 1', [questionId]);
  if (!rows[0]) throw new HttpError(404, { error: 'question_not_found' });
  await q('INSERT INTO lesson_answers (question_id, user_id, author_name, role, body) VALUES (?,?,?,?,?)',
    [questionId, session.id, session.name || 'User', session.role, text]);
  return getThread(rows[0].lesson_id);
}
