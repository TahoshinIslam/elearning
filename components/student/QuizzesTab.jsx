'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

const PASS = 0.5;

// Take-quiz modal: loads questions, collects answers, submits, shows the score.
function QuizModal({ lessonId, onClose, onDone }) {
  const { t, api, showToast } = useApp();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [reveal, setReveal] = useState({});     // questionId -> correct optionId (shown after submit)
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getQuiz(lessonId, 'take').then((q) => {
      if (!alive) return;
      setQuiz(q);
      if (q.attempt) {
        setAnswers(q.attempt.answers || {});
        setResult({ score: q.attempt.score, maxScore: q.attempt.maxScore });
        // server includes correct flags once attempted → derive the correct option per question
        const map = {};
        for (const qq of q.questions || []) {
          const c = (qq.options || []).find((o) => o.isCorrect);
          if (c) map[qq.id] = c.id;
        }
        setReveal(map);
      }
    }).catch(() => showToast(t.errGeneric));
    return () => { alive = false; };
  }, [lessonId]);

  const submit = async () => {
    if (Object.keys(answers).length < (quiz?.questions.length || 0)) { showToast(t.quizAnswerAll); return; }
    setBusy(true);
    try {
      const r = await api.submitQuiz(lessonId, answers);
      setResult(r);
      setReveal(r.correct || {});
      onDone?.(lessonId, r);
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  const passed = result && result.maxScore > 0 && result.score / result.maxScore >= PASS;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 80, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="panel anim-in" style={{ width: 'min(560px,100%)', maxHeight: '90vh', overflow: 'auto', padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{quiz?.title || '…'}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>

        {result && (
          <div style={{ background: passed ? '#e9f7ef' : '#fdecec', color: passed ? '#1b7a44' : '#c92a2a', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontWeight: 700 }}>
            {t.quizYouScored} {result.score}/{result.maxScore} · {Math.round((result.score / result.maxScore) * 100)}%
          </div>
        )}

        {!quiz ? <div style={{ color: 'var(--muted)' }}>…</div> : quiz.questions.map((qq, i) => (
          <div key={qq.id} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>{i + 1}. {qq.question}</div>
            <div style={{ display: 'grid', gap: 7 }}>
              {qq.options.map((o) => {
                const chosen = Number(answers[qq.id]) === o.id;
                const correctId = reveal[qq.id];
                const isCorrect = result && correctId != null && o.id === correctId;
                const isWrongChoice = result && chosen && !isCorrect;
                const border = isCorrect ? '2px solid #1b7a44' : isWrongChoice ? '2px solid #c92a2a' : chosen ? '2px solid var(--brand)' : '1.5px solid var(--line)';
                const bg = isCorrect ? '#e9f7ef' : isWrongChoice ? '#fdecec' : chosen ? 'var(--brand-wash)' : 'var(--paper)';
                return (
                  <label key={o.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, cursor: result ? 'default' : 'pointer',
                    border, background: bg, fontSize: 13.5
                  }}>
                    <input type="radio" name={`q${qq.id}`} checked={chosen} disabled={!!result}
                      onChange={() => setAnswers((a) => ({ ...a, [qq.id]: o.id }))} />
                    <span style={{ flex: 1 }}>{o.text}</span>
                    {isCorrect && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1b7a44' }}>✓ {t.quizCorrectAns}</span>}
                    {isWrongChoice && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#c92a2a' }}>✗ {t.quizYourAns}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {!result && quiz && (
          <button className="btn btn-primary-lg" disabled={busy} onClick={submit}>{busy ? '…' : `${t.quizSubmit} →`}</button>
        )}
        {result && <button className="btn-dark" style={{ width: '100%', borderRadius: 11, padding: '11px' }} onClick={onClose}>{t.quizClose}</button>}
      </div>
    </div>
  );
}

export default function QuizzesTab() {
  const { t, auth, courses: allCourses, enrollments, api } = useApp();
  const STUDENT_ID = auth?.studentId;
  const [open, setOpen] = useState(null);        // lessonId being taken
  const [scores, setScores] = useState({});      // lessonId -> {score,maxScore} | null

  // quiz-type lessons across the student's enrolled courses
  const quizzes = useMemo(() => {
    const courseIds = new Set(enrollments.filter((e) => e.studentId === STUDENT_ID).map((e) => e.courseId));
    const out = [];
    for (const c of allCourses) {
      if (!courseIds.has(c.id)) continue;
      for (const m of c.modules || []) for (const l of m.lessons || []) {
        if (l.type === 'quiz') out.push({ lessonId: l.id, title: l.title, courseTitle: c.title });
      }
    }
    return out;
  }, [allCourses, enrollments, STUDENT_ID]);

  // load each quiz's existing attempt once
  useEffect(() => {
    let alive = true;
    quizzes.forEach((z) => {
      if (scores[z.lessonId] !== undefined) return;
      api.getQuiz(z.lessonId, 'take')
        .then((q) => alive && setScores((s) => ({ ...s, [z.lessonId]: q.attempt ? { score: q.attempt.score, maxScore: q.attempt.maxScore } : null })))
        .catch(() => alive && setScores((s) => ({ ...s, [z.lessonId]: null })));
    });
    return () => { alive = false; };
  }, [quizzes]);

  const onDone = useCallback((lessonId, r) => setScores((s) => ({ ...s, [lessonId]: r })), []);

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.sQuizzes}</div>

      {quizzes.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.quizNoQuizzes}</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {quizzes.map((z) => {
            const s = scores[z.lessonId];
            const done = s && s.maxScore > 0;
            return (
              <div key={z.lessonId} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
                <div style={{ fontSize: 22 }}>❓</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{z.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>{z.courseTitle}</div>
                </div>
                {done && (
                  <span className={`chip ${s.score / s.maxScore >= PASS ? 'chip-green' : 'chip-orange'}`}>
                    {t.quizScore}: {s.score}/{s.maxScore}
                  </span>
                )}
                <button className="btn-primary" style={{ borderRadius: 10, fontSize: 13.5 }} onClick={() => setOpen(z.lessonId)}>
                  {done ? t.quizRetake : t.quizTake}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open && <QuizModal lessonId={open} onClose={() => setOpen(null)} onDone={onDone} />}
    </div>
  );
}
