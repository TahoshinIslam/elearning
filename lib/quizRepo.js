// ============================================================
// Quiz engine data-access. MCQ quizzes hang off quiz-type lessons.
// Grading is server-side; correct-answer flags are never sent to students.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

async function loadQuestions(lessonId, { withCorrect }) {
  const questions = await q(
    'SELECT id, question, position FROM quiz_questions WHERE lesson_id = ? ORDER BY position, id', [lessonId]);
  if (!questions.length) return [];
  const qIds = questions.map((r) => r.id);
  const cols = withCorrect ? 'id, question_id, text, is_correct, position' : 'id, question_id, text, position';
  const opts = await q(
    `SELECT ${cols} FROM quiz_options WHERE question_id IN (${qIds.map(() => '?').join(',')}) ORDER BY position, id`, qIds);
  return questions.map((qq) => ({
    id: qq.id,
    question: qq.question,
    options: opts.filter((o) => o.question_id === qq.id).map((o) => ({
      id: o.id, text: o.text, ...(withCorrect ? { isCorrect: !!o.is_correct } : {})
    }))
  }));
}

// Student view: questions + options. Correct-answer flags are withheld until the
// student has an attempt — then they're revealed so wrong answers can be reviewed.
export async function getQuizForStudent(lessonId, studentId) {
  const lesson = (await q('SELECT id, title FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  const attempt = (await q(
    'SELECT id, score, max_score AS maxScore, submitted_at AS submittedAt FROM quiz_attempts WHERE lesson_id = ? AND student_id = ? LIMIT 1',
    [lessonId, studentId]))[0] || null;
  // reveal correct options only once the student has submitted an attempt
  const questions = await loadQuestions(lessonId, { withCorrect: !!attempt });
  if (attempt) {
    const rows = await q('SELECT question_id, option_id FROM quiz_answers WHERE attempt_id = ?', [attempt.id]);
    attempt.answers = Object.fromEntries(rows.map((r) => [r.question_id, r.option_id]));
  }
  return { lessonId, title: lesson.title, questions, attempt };
}

// Teacher/owner view: questions + options WITH correct flags (for editing).
export async function getQuizForEdit(lessonId) {
  const lesson = (await q('SELECT id, title FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  const questions = await loadQuestions(lessonId, { withCorrect: true });
  return { lessonId, title: lesson.title, questions };
}

// Re-grade every stored attempt for a quiz against its current answer key.
// Called after an edit so a corrected correct-answer updates students' scores.
async function regradeAttempts(lessonId) {
  const questions = await q('SELECT id FROM quiz_questions WHERE lesson_id = ?', [lessonId]);
  const maxScore = questions.length;
  const correct = questions.length
    ? await q(`SELECT question_id, id FROM quiz_options WHERE is_correct = 1 AND question_id IN (${questions.map(() => '?').join(',')})`,
        questions.map((r) => r.id))
    : [];
  const correctByQ = Object.fromEntries(correct.map((r) => [r.question_id, r.id]));

  const attempts = await q('SELECT id FROM quiz_attempts WHERE lesson_id = ?', [lessonId]);
  for (const a of attempts) {
    const ans = await q('SELECT question_id, option_id FROM quiz_answers WHERE attempt_id = ?', [a.id]);
    const chosen = Object.fromEntries(ans.map((r) => [r.question_id, r.option_id]));
    let score = 0;
    for (const qq of questions) if (chosen[qq.id] != null && Number(chosen[qq.id]) === correctByQ[qq.id]) score++;
    await q('UPDATE quiz_attempts SET score = ?, max_score = ? WHERE id = ?', [score, maxScore, a.id]);
  }
}

// Save the quiz, preserving question/option IDs so existing student answers stay
// linked. Anything the editor removed is deleted; then every attempt is re-graded
// against the updated answer key (a fixed correct answer updates old scores).
export async function saveQuiz(body) {
  const lessonId = Number(body.lessonId);
  const lesson = (await q('SELECT id FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  const questions = Array.isArray(body.questions) ? body.questions : [];

  const existingQ = await q('SELECT id FROM quiz_questions WHERE lesson_id = ?', [lessonId]);
  const keepQ = new Set();

  for (let i = 0; i < questions.length; i++) {
    const qq = questions[i];
    if (!qq.question || !String(qq.question).trim()) continue;
    const qtext = String(qq.question).trim();
    let qid = qq.id && existingQ.some((e) => e.id === Number(qq.id)) ? Number(qq.id) : null;
    if (qid) {
      await q('UPDATE quiz_questions SET question = ?, position = ? WHERE id = ? AND lesson_id = ?', [qtext, i, qid, lessonId]);
    } else {
      const res = await q('INSERT INTO quiz_questions (lesson_id, question, position) VALUES (?,?,?)', [lessonId, qtext, i]);
      qid = res.insertId;
    }
    keepQ.add(qid);

    const existingO = await q('SELECT id FROM quiz_options WHERE question_id = ?', [qid]);
    const keepO = new Set();
    const options = Array.isArray(qq.options) ? qq.options : [];
    for (let j = 0; j < options.length; j++) {
      const o = options[j];
      if (!o.text || !String(o.text).trim()) continue;
      const otext = String(o.text).trim();
      let oid = o.id && existingO.some((e) => e.id === Number(o.id)) ? Number(o.id) : null;
      if (oid) {
        await q('UPDATE quiz_options SET text = ?, is_correct = ?, position = ? WHERE id = ? AND question_id = ?', [otext, o.isCorrect ? 1 : 0, j, oid, qid]);
      } else {
        const res = await q('INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES (?,?,?,?)', [qid, otext, o.isCorrect ? 1 : 0, j]);
        oid = res.insertId;
      }
      keepO.add(oid);
    }
    const dropO = existingO.filter((e) => !keepO.has(e.id)).map((e) => e.id);
    if (dropO.length) await q(`DELETE FROM quiz_options WHERE id IN (${dropO.map(() => '?').join(',')})`, dropO);
  }

  const dropQ = existingQ.filter((e) => !keepQ.has(e.id)).map((e) => e.id);
  if (dropQ.length) await q(`DELETE FROM quiz_questions WHERE id IN (${dropQ.map(() => '?').join(',')})`, dropQ); // options + answers cascade

  await regradeAttempts(lessonId);
  return getQuizForEdit(lessonId);
}

// Grade a submission against stored correct options; upsert the attempt.
export async function submitAttempt(body) {
  const lessonId = Number(body.lessonId);
  const studentId = Number(body.studentId);
  const studentName = body.studentName || null;
  const answers = body.answers || {}; // { questionId: optionId }
  if (!lessonId || !studentId) throw new HttpError(400, { error: 'invalid_attempt' });

  const questions = await q('SELECT id FROM quiz_questions WHERE lesson_id = ?', [lessonId]);
  if (!questions.length) throw new HttpError(400, { error: 'empty_quiz' });
  const correct = await q(
    `SELECT question_id, id FROM quiz_options WHERE is_correct = 1 AND question_id IN (${questions.map(() => '?').join(',')})`,
    questions.map((r) => r.id));
  const correctByQ = Object.fromEntries(correct.map((r) => [r.question_id, r.id]));

  let score = 0;
  for (const qq of questions) if (Number(answers[qq.id]) === correctByQ[qq.id]) score++;
  const maxScore = questions.length;

  // upsert attempt
  await q(
    `INSERT INTO quiz_attempts (lesson_id, student_id, student_name, score, max_score, submitted_at)
     VALUES (?,?,?,?,?,NOW())
     ON DUPLICATE KEY UPDATE student_name=VALUES(student_name), score=VALUES(score),
       max_score=VALUES(max_score), submitted_at=NOW()`,
    [lessonId, studentId, studentName, score, maxScore]);
  const attempt = (await q('SELECT id FROM quiz_attempts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]))[0];

  await q('DELETE FROM quiz_answers WHERE attempt_id = ?', [attempt.id]);
  for (const qq of questions) {
    const chosen = answers[qq.id] != null ? Number(answers[qq.id]) : null;
    await q('INSERT INTO quiz_answers (attempt_id, question_id, option_id) VALUES (?,?,?)', [attempt.id, qq.id, chosen]);
  }
  // return the correct option per question so the student can review wrong answers immediately
  return { lessonId, score, maxScore, correct: correctByQ };
}

// Create a new quiz-type lesson (teacher/owner). Auto-creates a module if the
// course has none yet, so a teacher isn't blocked by the owner-only module tools.
export async function createQuizLesson(body) {
  let moduleId = body.moduleId != null ? Number(body.moduleId) : null;
  const courseId = body.courseId != null ? Number(body.courseId) : null;

  if (moduleId) {
    const mod = await q('SELECT id FROM modules WHERE id = ? LIMIT 1', [moduleId]);
    if (!mod.length) throw new HttpError(404, { error: 'module_not_found' });
  } else {
    if (!courseId) throw new HttpError(400, { error: 'course_or_module_required' });
    const course = await q('SELECT id FROM courses WHERE id = ? LIMIT 1', [courseId]);
    if (!course.length) throw new HttpError(404, { error: 'course_not_found' });
    const existing = await q('SELECT id FROM modules WHERE course_id = ? ORDER BY position, id LIMIT 1', [courseId]);
    if (existing.length) moduleId = existing[0].id;
    else {
      const res = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,1)', [courseId, 'কুইজ']);
      moduleId = res.insertId;
    }
  }

  const title = body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন কুইজ';
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [moduleId]);
  const res = await q('INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,?,?,0,?)',
    [moduleId, title, 'quiz', null, p]);
  return { lessonId: res.insertId, moduleId };
}

// Teacher/owner: every student's attempt for a quiz.
export async function getQuizResults(lessonId) {
  const rows = await q(
    `SELECT student_id AS studentId, student_name AS studentName, score, max_score AS maxScore, submitted_at AS submittedAt
     FROM quiz_attempts WHERE lesson_id = ? ORDER BY score DESC, submitted_at`, [lessonId]);
  return rows;
}
