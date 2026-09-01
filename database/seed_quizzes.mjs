// Seed a demo MCQ quiz for the sample quiz-lesson (id 114, course 1 — physics).
// Standalone:  node database/seed_quizzes.mjs   (idempotent — clears the lesson's questions first)
import mysql from 'mysql2/promise';

const LESSON_ID = 114;
const QUESTIONS = [
  {
    question: 'কাজের একক কোনটি?',
    options: [{ text: 'নিউটন', correct: false }, { text: 'জুল', correct: true }, { text: 'ওয়াট', correct: false }, { text: 'প্যাসকেল', correct: false }]
  },
  {
    question: 'ক্ষমতার একক কোনটি?',
    options: [{ text: 'ওয়াট', correct: true }, { text: 'জুল', correct: false }, { text: 'নিউটন', correct: false }, { text: 'অ্যাম্পিয়ার', correct: false }]
  },
  {
    question: 'গতিশক্তির সূত্র কোনটি?',
    options: [{ text: 'mgh', correct: false }, { text: '½mv²', correct: true }, { text: 'mv', correct: false }, { text: 'Fd', correct: false }]
  }
];

const pool = mysql.createPool({
  socketPath: process.env.MYSQL_SOCKET || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'e-learning',
  charset: 'utf8mb4_unicode_ci'
});

try {
  const [[lesson]] = await pool.query('SELECT id FROM lessons WHERE id=? AND type="quiz"', [LESSON_ID]);
  if (!lesson) { console.error(`Lesson ${LESSON_ID} (type quiz) not found — nothing seeded.`); process.exit(1); }
  await pool.query('DELETE FROM quiz_questions WHERE lesson_id=?', [LESSON_ID]);
  for (let i = 0; i < QUESTIONS.length; i++) {
    const qq = QUESTIONS[i];
    const [res] = await pool.query('INSERT INTO quiz_questions (lesson_id, question, position) VALUES (?,?,?)', [LESSON_ID, qq.question, i]);
    for (let j = 0; j < qq.options.length; j++) {
      const o = qq.options[j];
      await pool.query('INSERT INTO quiz_options (question_id, text, is_correct, position) VALUES (?,?,?,?)', [res.insertId, o.text, o.correct ? 1 : 0, j]);
    }
    console.log(`  ✓ Q${i + 1}: ${qq.question}`);
  }
  console.log(`\nDone. Seeded ${QUESTIONS.length} questions for lesson ${LESSON_ID}.`);
} catch (e) {
  console.error('Seed failed:', e.message); process.exitCode = 1;
} finally {
  await pool.end();
}
