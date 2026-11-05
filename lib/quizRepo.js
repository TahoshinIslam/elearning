// ============================================================
// Quiz engine. Quizzes hang off quiz-type lessons.
//  Question types: single (one right option), multiple (all right options,
//  nothing else), true_false, short (typed answer matched against accepted
//  answers, case/space/digit-script insensitive).
//  Settings: time limit, pass mark %, attempt limit, shuffle questions /
//  options, when to reveal answers, instructions.
// Grading is server-side; correct answers are only sent to a student when
// the reveal rule allows it.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export const QUESTION_TYPES = ['single', 'multiple', 'true_false', 'short'];
const REVEAL = ['after_submit', 'after_pass', 'never'];
const GRACE_SEC = 30; // network slack on timed quizzes

const DEFAULT_SETTINGS = { timeLimitSec: null, passPercent: 0, maxAttempts: 0, shuffleQuestions: false, shuffleOptions: false, showAnswers: 'after_submit', instructions: '' };

// Bangla digits → ASCII, lower-case, collapse spaces/punctuation.
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function normalizeAnswer(v) {
  return String(v || '')
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .toLowerCase().normalize('NFC')
    .replace(/[\s.,;:!?'"()\-–—]+/g, ' ').trim();
}

async function getSettings(lessonId) {
  const [r] = await q('SELECT * FROM quiz_settings WHERE lesson_id = ? LIMIT 1', [lessonId]);
  if (!r) return { ...DEFAULT_SETTINGS };
  return {
    timeLimitSec: r.time_limit_sec || null, passPercent: Number(r.pass_percent) || 0, maxAttempts: Number(r.max_attempts) || 0,
    shuffleQuestions: !!r.shuffle_questions, shuffleOptions: !!r.shuffle_options, showAnswers: r.show_answers || 'after_submit', instructions: r.instructions || ''
  };
}

async function loadQuestions(lessonId, { withKey }) {
  const questions = await q(
    'SELECT id, question, type, points, explanation, accepted_answers, position FROM quiz_questions WHERE lesson_id = ? ORDER BY position, id', [lessonId]);
  if (!questions.length) return [];
  const qIds = questions.map((r) => r.id);
  const opts = await q(
    `SELECT id, question_id, text, is_correct, position FROM quiz_options WHERE question_id IN (${qIds.map(() => '?').join(',')}) ORDER BY position, id`, qIds);
  return questions.map((qq) => {
    let accepted = [];
    try { accepted = qq.accepted_answers ? JSON.parse(qq.accepted_answers) : []; } catch { accepted = []; }
    return {
      id: qq.id, question: qq.question, type: qq.type || 'single', points: Number(qq.points) || 1,
      ...(withKey ? { explanation: qq.explanation || '', acceptedAnswers: accepted } : {}),
      options: opts.filter((o) => o.question_id === qq.id).map((o) => ({ id: o.id, text: o.text, ...(withKey ? { isCorrect: !!o.is_correct } : {}) }))
    };
  });
}

function shuffle(list, seed) {
  const a = [...list];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Grade one answer against one question. → boolean
export function gradeAnswer(question, answer) {
  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
  switch (question.type) {
    case 'multiple': {
      const chosen = (Array.isArray(answer) ? answer : []).map(Number).filter(Boolean);
      return chosen.length === correctIds.length && chosen.every((id) => correctIds.includes(id));
    }
    case 'short': {
      const given = normalizeAnswer(answer);
      return !!given && question.acceptedAnswers.some((a) => normalizeAnswer(a) === given);
    }
    default:
      return correctIds.length === 1 && Number(answer) === correctIds[0];
  }
}

async function attemptRow(lessonId, studentId) {
  const [a] = await q(
    `SELECT id, score, max_score AS maxScore, best_score AS bestScore, attempts_used AS attemptsUsed, passed, submitted_at AS submittedAt, time_spent_sec AS timeSpentSec
     FROM quiz_attempts WHERE lesson_id = ? AND student_id = ? LIMIT 1`, [lessonId, studentId]);
  return a || null;
}

// Student view. Correct answers / explanations only when the reveal rule allows.
export async function getQuizForStudent(lessonId, studentId) {
  const lesson = (await q('SELECT id, title FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  const settings = await getSettings(lessonId);
  const attempt = studentId ? await attemptRow(lessonId, studentId) : null;
  const attemptsLeft = settings.maxAttempts ? Math.max(0, settings.maxAttempts - (attempt?.attemptsUsed || 0)) : null;
  const reveal = !!attempt && (settings.showAnswers === 'after_submit'
    || (settings.showAnswers === 'after_pass' && (attempt.passed || attemptsLeft === 0)));
  let questions = await loadQuestions(lessonId, { withKey: reveal });
  if (settings.shuffleQuestions) questions = shuffle(questions, Number(studentId) * 31 + lessonId);
  if (settings.shuffleOptions) questions = questions.map((qq) => (qq.type === 'true_false' ? qq : { ...qq, options: shuffle(qq.options, Number(studentId) * 17 + qq.id) }));
  if (attempt) {
    const rows = await q('SELECT question_id, option_id, selected, text_answer, is_correct FROM quiz_answers WHERE attempt_id = ?', [attempt.id]);
    attempt.answers = Object.fromEntries(rows.map((r) => [r.question_id, r.selected ? JSON.parse(r.selected) : r.text_answer != null ? r.text_answer : r.option_id]));
    if (reveal) attempt.results = Object.fromEntries(rows.map((r) => [r.question_id, !!r.is_correct]));
  }
  let startedAt = null;
  if (studentId && settings.timeLimitSec) {
    const [s] = await q('SELECT started_at FROM quiz_starts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]);
    startedAt = s?.started_at || null;
  }
  return {
    lessonId, title: lesson.title, settings, questions, attempt, attemptsLeft, revealed: reveal,
    canAttempt: attemptsLeft === null || attemptsLeft > 0, startedAt,
    maxScore: questions.reduce((a, x) => a + x.points, 0)
  };
}

export async function getQuizForEdit(lessonId) {
  const lesson = (await q('SELECT id, title FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  return { lessonId, title: lesson.title, settings: await getSettings(lessonId), questions: await loadQuestions(lessonId, { withKey: true }) };
}

// Start (or resume) a timed attempt. Returns the server deadline.
export async function startQuiz(lessonId, studentId) {
  const settings = await getSettings(lessonId);
  const attempt = await attemptRow(lessonId, studentId);
  if (settings.maxAttempts && (attempt?.attemptsUsed || 0) >= settings.maxAttempts) throw new HttpError(403, { error: 'no_attempts_left' });
  if (!settings.timeLimitSec) return { timeLimitSec: null, deadline: null };
  await q('INSERT INTO quiz_starts (lesson_id, student_id, started_at) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE started_at = started_at', [lessonId, studentId]);
  const [s] = await q('SELECT started_at, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed FROM quiz_starts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]);
  return { timeLimitSec: settings.timeLimitSec, secondsLeft: Math.max(0, settings.timeLimitSec - Number(s.elapsed)), startedAt: s.started_at };
}

async function regradeAttempts(lessonId) {
  const questions = await loadQuestions(lessonId, { withKey: true });
  const settings = await getSettings(lessonId);
  const maxScore = questions.reduce((a, x) => a + x.points, 0);
  const attempts = await q('SELECT id FROM quiz_attempts WHERE lesson_id = ?', [lessonId]);
  if (!attempts.length) return;
  const answers = await q(`SELECT attempt_id, question_id, option_id, selected, text_answer FROM quiz_answers WHERE attempt_id IN (${attempts.map(() => '?').join(',')})`, attempts.map((a) => a.id));
  for (const a of attempts) {
    let score = 0;
    for (const qq of questions) {
      const r = answers.find((x) => x.attempt_id === a.id && x.question_id === qq.id);
      const given = !r ? null : r.selected ? JSON.parse(r.selected) : r.text_answer != null ? r.text_answer : r.option_id;
      const ok = r ? gradeAnswer(qq, given) : false;
      if (ok) score += qq.points;
      if (r) await q('UPDATE quiz_answers SET is_correct = ? WHERE attempt_id = ? AND question_id = ?', [ok ? 1 : 0, a.id, qq.id]);
    }
    const passed = settings.passPercent ? (maxScore ? (score / maxScore) * 100 >= settings.passPercent : false) : null;
    await q('UPDATE quiz_attempts SET score = ?, max_score = ?, best_score = GREATEST(best_score, ?), passed = ? WHERE id = ?', [score, maxScore, score, passed == null ? null : passed ? 1 : 0, a.id]);
  }
}

function cleanSettings(s = {}) {
  const lim = Number(s.timeLimitSec);
  return {
    timeLimitSec: Number.isFinite(lim) && lim >= 30 ? Math.min(lim, 6 * 3600) : null,
    passPercent: Math.max(0, Math.min(100, Math.round(Number(s.passPercent) || 0))),
    maxAttempts: Math.max(0, Math.min(20, Math.round(Number(s.maxAttempts) || 0))),
    shuffleQuestions: !!s.shuffleQuestions, shuffleOptions: !!s.shuffleOptions,
    showAnswers: REVEAL.includes(s.showAnswers) ? s.showAnswers : 'after_submit',
    instructions: String(s.instructions || '').slice(0, 2000)
  };
}

// Validate one question from the editor. Returns a normalised question or throws.
function cleanQuestion(qq, i) {
  const type = QUESTION_TYPES.includes(qq.type) ? qq.type : 'single';
  const text = String(qq.question || '').trim();
  if (!text) return null;
  const points = Math.max(1, Math.min(100, Math.round(Number(qq.points) || 1)));
  let options = (Array.isArray(qq.options) ? qq.options : []).map((o) => ({ id: o.id, text: String(o.text || '').trim().slice(0, 500), isCorrect: !!o.isCorrect })).filter((o) => o.text);
  const accepted = (Array.isArray(qq.acceptedAnswers) ? qq.acceptedAnswers : String(qq.acceptedAnswers || '').split('\n')).map((a) => String(a).trim()).filter(Boolean).slice(0, 20);
  if (type === 'true_false') {
    const truth = options.find((o) => o.isCorrect)?.text;
    const tIsTrue = truth ? /^(true|সত্য|সঠিক)$/i.test(truth) : true;
    options = [{ id: options[0]?.id, text: 'সত্য / True', isCorrect: tIsTrue }, { id: options[1]?.id, text: 'মিথ্যা / False', isCorrect: !tIsTrue }];
  }
  if (type === 'short') {
    if (!accepted.length) throw new HttpError(400, { error: 'short_answer_needs_accepted', question: i + 1 });
    options = [];
  } else {
    if (options.length < 2) throw new HttpError(400, { error: 'question_needs_two_options', question: i + 1 });
    const right = options.filter((o) => o.isCorrect).length;
    if (type !== 'multiple' && right !== 1) throw new HttpError(400, { error: 'question_needs_one_correct', question: i + 1 });
    if (type === 'multiple' && right < 1) throw new HttpError(400, { error: 'question_needs_a_correct', question: i + 1 });
  }
  return { id: qq.id, type, text: text.slice(0, 4000), points, explanation: String(qq.explanation || '').slice(0, 2000) || null, accepted, options };
}

// Save quiz settings + questions, keeping question/option ids so existing
// answers stay linked; then re-grade every attempt against the new key.
export async function saveQuiz(body) {
  const lessonId = Number(body.lessonId);
  const lesson = (await q('SELECT id FROM lessons WHERE id = ? AND type = "quiz" LIMIT 1', [lessonId]))[0];
  if (!lesson) throw new HttpError(404, { error: 'quiz_not_found' });
  const questions = (Array.isArray(body.questions) ? body.questions : []).map(cleanQuestion).filter(Boolean);
  const st = cleanSettings(body.settings);
  await q(`INSERT INTO quiz_settings (lesson_id, time_limit_sec, pass_percent, max_attempts, shuffle_questions, shuffle_options, show_answers, instructions)
           VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE time_limit_sec = VALUES(time_limit_sec), pass_percent = VALUES(pass_percent),
           max_attempts = VALUES(max_attempts), shuffle_questions = VALUES(shuffle_questions), shuffle_options = VALUES(shuffle_options),
           show_answers = VALUES(show_answers), instructions = VALUES(instructions)`,
  [lessonId, st.timeLimitSec, st.passPercent, st.maxAttempts, st.shuffleQuestions ? 1 : 0, st.shuffleOptions ? 1 : 0, st.showAnswers, st.instructions]);

  const existingQ = await q('SELECT id FROM quiz_questions WHERE lesson_id = ?', [lessonId]);
  const keepQ = new Set();
  for (let i = 0; i < questions.length; i++) {
    const qq = questions[i];
    let qid = qq.id && existingQ.some((e) => e.id === Number(qq.id)) ? Number(qq.id) : null;
    const accepted = qq.accepted.length ? JSON.stringify(qq.accepted) : null;
    if (qid) {
      await q('UPDATE quiz_questions SET question = ?, type = ?, points = ?, explanation = ?, accepted_answers = ?, position = ? WHERE id = ? AND lesson_id = ?',
        [qq.text, qq.type, qq.points, qq.explanation, accepted, i, qid, lessonId]);
    } else {
      const res = await q('INSERT INTO quiz_questions (lesson_id, question, type, points, explanation, accepted_answers, position) VALUES (?,?,?,?,?,?,?)',
        [lessonId, qq.text, qq.type, qq.points, qq.explanation, accepted, i]);
      qid = res.insertId;
    }
    keepQ.add(qid);
    const existingO = await q('SELECT id FROM quiz_options WHERE question_id = ?', [qid]);
    const keepO = new Set();
    for (let j = 0; j < qq.options.length; j++) {
      const o = qq.options[j];
      let oid = o.id && existingO.some((e) => e.id === Number(o.id)) ? Number(o.id) : null;
      if (oid) await q('UPDATE quiz_options SET text = ?, is_correct = ?, position = ? WHERE id = ? AND question_id = ?', [o.text, o.isCorrect ? 1 : 0, j, oid, qid]);
      else oid = (await q('INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES (?,?,?,?)', [qid, o.text, o.isCorrect ? 1 : 0, j])).insertId;
      keepO.add(oid);
    }
    const dropO = existingO.filter((e) => !keepO.has(e.id)).map((e) => e.id);
    if (dropO.length) await q(`DELETE FROM quiz_options WHERE id IN (${dropO.map(() => '?').join(',')})`, dropO);
  }
  const dropQ = existingQ.filter((e) => !keepQ.has(e.id)).map((e) => e.id);
  if (dropQ.length) await q(`DELETE FROM quiz_questions WHERE id IN (${dropQ.map(() => '?').join(',')})`, dropQ);

  await regradeAttempts(lessonId);
  return getQuizForEdit(lessonId);
}

// Grade a submission and record the attempt.
// answers: { [questionId]: optionId | optionId[] | text }
export async function submitAttempt(body) {
  const lessonId = Number(body.lessonId);
  const studentId = Number(body.studentId);
  const studentName = body.studentName || null;
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  if (!lessonId || !studentId) throw new HttpError(400, { error: 'invalid_attempt' });

  const settings = await getSettings(lessonId);
  const questions = await loadQuestions(lessonId, { withKey: true });
  if (!questions.length) throw new HttpError(400, { error: 'empty_quiz' });
  const prev = await attemptRow(lessonId, studentId);
  if (settings.maxAttempts && (prev?.attemptsUsed || 0) >= settings.maxAttempts) throw new HttpError(403, { error: 'no_attempts_left' });

  let timeSpent = null;
  if (settings.timeLimitSec) {
    const [s] = await q('SELECT TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed FROM quiz_starts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]);
    if (!s) throw new HttpError(400, { error: 'quiz_not_started' });
    timeSpent = Number(s.elapsed);
    if (timeSpent > settings.timeLimitSec + GRACE_SEC) {
      await q('DELETE FROM quiz_starts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]);
      // the attempt still counts — with what arrived in time, nothing
      for (const k of Object.keys(answers)) delete answers[k];
    }
  }

  let score = 0;
  const graded = questions.map((qq) => {
    const given = answers[qq.id];
    const ok = given != null && given !== '' ? gradeAnswer(qq, given) : false;
    if (ok) score += qq.points;
    return { qq, given, ok };
  });
  const maxScore = questions.reduce((a, x) => a + x.points, 0);
  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const passed = settings.passPercent ? percent >= settings.passPercent : null;

  await q(
    `INSERT INTO quiz_attempts (lesson_id, student_id, student_name, score, max_score, best_score, attempts_used, passed, time_spent_sec, submitted_at)
     VALUES (?,?,?,?,?,?,1,?,?,NOW())
     ON DUPLICATE KEY UPDATE student_name = VALUES(student_name), score = VALUES(score), max_score = VALUES(max_score),
       best_score = GREATEST(best_score, VALUES(score)), attempts_used = attempts_used + 1,
       passed = IF(passed = 1, 1, VALUES(passed)), time_spent_sec = VALUES(time_spent_sec), submitted_at = NOW()`,
    [lessonId, studentId, studentName, score, maxScore, score, passed == null ? null : passed ? 1 : 0, timeSpent]);
  const attempt = await attemptRow(lessonId, studentId);
  await q('DELETE FROM quiz_answers WHERE attempt_id = ?', [attempt.id]);
  for (const g of graded) {
    const isMulti = g.qq.type === 'multiple';
    const isShort = g.qq.type === 'short';
    await q('INSERT INTO quiz_answers (attempt_id, question_id, option_id, selected, text_answer, is_correct) VALUES (?,?,?,?,?,?)', [
      attempt.id, g.qq.id,
      !isMulti && !isShort && g.given != null && g.given !== '' ? Number(g.given) : null,
      isMulti ? JSON.stringify((Array.isArray(g.given) ? g.given : []).map(Number)) : null,
      isShort ? String(g.given ?? '').slice(0, 500) : null,
      g.ok ? 1 : 0
    ]);
  }
  await q('DELETE FROM quiz_starts WHERE lesson_id = ? AND student_id = ?', [lessonId, studentId]);

  const attemptsLeft = settings.maxAttempts ? Math.max(0, settings.maxAttempts - attempt.attemptsUsed) : null;
  const reveal = settings.showAnswers === 'after_submit' || (settings.showAnswers === 'after_pass' && (attempt.passed || attemptsLeft === 0));
  return {
    lessonId, score, maxScore, percent, passed, passPercent: settings.passPercent, attemptsLeft, bestScore: attempt.bestScore,
    results: Object.fromEntries(graded.map((g) => [g.qq.id, g.ok])),
    ...(reveal ? {
      correct: Object.fromEntries(questions.map((qq) => [qq.id, qq.type === 'short' ? qq.acceptedAnswers[0] : qq.type === 'multiple' ? qq.options.filter((o) => o.isCorrect).map((o) => o.id) : qq.options.find((o) => o.isCorrect)?.id])),
      explanations: Object.fromEntries(questions.filter((qq) => qq.explanation).map((qq) => [qq.id, qq.explanation]))
    } : {})
  };
}

// Create a new quiz-type lesson (teacher/owner).
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
    else moduleId = (await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,1)', [courseId, 'কুইজ'])).insertId;
  }
  const title = body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন কুইজ';
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [moduleId]);
  const res = await q('INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,?,?,0,?)', [moduleId, title, 'quiz', null, p]);
  return { lessonId: res.insertId, moduleId };
}

// Teacher/owner: every student's latest attempt + per-question item analysis.
export async function getQuizResults(lessonId) {
  const rows = await q(
    `SELECT student_id AS studentId, student_name AS studentName, score, max_score AS maxScore, best_score AS bestScore,
            attempts_used AS attemptsUsed, passed, time_spent_sec AS timeSpentSec, submitted_at AS submittedAt
     FROM quiz_attempts WHERE lesson_id = ? ORDER BY score DESC, submitted_at`, [lessonId]);
  return rows.map((r) => ({ ...r, passed: r.passed == null ? null : !!r.passed }));
}

export async function getQuizItemStats(lessonId) {
  return q(
    `SELECT qq.id, qq.question, qq.type, COUNT(a.id) AS answered, SUM(a.is_correct = 1) AS correct
     FROM quiz_questions qq LEFT JOIN quiz_answers a ON a.question_id = qq.id
     WHERE qq.lesson_id = ? GROUP BY qq.id, qq.question, qq.type ORDER BY qq.position, qq.id`, [lessonId]);
}

// The course a quiz lesson belongs to (for teacher course-scoping).
export async function quizCourse(lessonId) {
  const [r] = await q('SELECT c.id, c.instructor_id FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE l.id = ? LIMIT 1', [lessonId]);
  return r || null;
}
