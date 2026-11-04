'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';

const PASS = 0.5;
const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 0,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};
const blankQuestion = () => ({ question: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] });

export default function TeacherQuizzes() {
  const { t, courses, batches, api, showToast } = useApp();
  const [lessonId, setLessonId] = useState(null);
  const [sub, setSub] = useState('edit');       // 'edit' | 'results'
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  // create-new-quiz form: pick a batch (→ its course/subject), optional module, a name
  const [nb, setNb] = useState({ batchId: '', moduleId: '', title: '' });
  const nbBatch = batches.find((b) => b.id === Number(nb.batchId));
  const nbCourse = nbBatch ? courses.find((c) => c.id === nbBatch.courseId) : null;
  const nbModules = nbCourse?.modules || [];

  const createNewQuiz = async () => {
    if (!nb.batchId) { showToast(t.quizNeedBatch); return; }
    if (!nbBatch?.courseId) { showToast(t.quizBatchNoCourse); return; }
    setBusy(true);
    try {
      const { lessonId: newId } = await api.createQuiz({
        courseId: nbBatch.courseId,
        moduleId: nb.moduleId ? Number(nb.moduleId) : null,
        title: nb.title.trim()
      });
      setNb({ batchId: '', moduleId: '', title: '' });
      setLessonId(newId);      // select the new quiz once Courses refetches
      setSub('edit');
      showToast(t.quizCreated);
    } catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  // every quiz-type lesson across all courses
  const quizLessons = useMemo(() => {
    const out = [];
    for (const c of courses) for (const m of c.modules || []) for (const l of m.lessons || []) {
      if (l.type === 'quiz') out.push({ lessonId: l.id, title: l.title, courseTitle: c.title });
    }
    return out;
  }, [courses]);

  // default-select the first quiz lesson
  useEffect(() => { if (lessonId == null && quizLessons.length) setLessonId(quizLessons[0].lessonId); }, [quizLessons, lessonId]);

  // load selected quiz's questions (edit mode = with correct flags)
  useEffect(() => {
    if (lessonId == null) return;
    api.getQuiz(lessonId, 'edit').then((quiz) => {
      // keep question/option ids so edits re-grade existing attempts instead of orphaning them
      setQuestions((quiz.questions || []).map((qq) => ({
        id: qq.id,
        question: qq.question,
        options: qq.options.map((o) => ({ id: o.id, text: o.text, isCorrect: !!o.isCorrect }))
      })));
    }).catch(() => showToast(t.errGeneric));
  }, [lessonId]);

  // load results when switching to the results tab
  useEffect(() => {
    if (sub !== 'results' || lessonId == null) return;
    api.getQuizResults(lessonId).then(setResults).catch(() => setResults([]));
  }, [sub, lessonId]);

  const setQ = (i, patch) => setQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const setOpt = (qi, oi, patch) => setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : {
    ...q, options: q.options.map((o, j) => j === oi ? { ...o, ...patch } : o)
  }));
  const markCorrect = (qi, oi) => setQuestions((qs) => qs.map((q, idx) => idx !== qi ? q : {
    ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi }))
  }));

  const save = async () => {
    setBusy(true);
    try { await api.saveQuiz(lessonId, questions); showToast(t.quizSaved); }
    catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  const avg = results.length
    ? Math.round(results.reduce((a, r) => a + (r.maxScore ? r.score / r.maxScore : 0), 0) / results.length * 100)
    : 0;

  const createPanel = (
    <div className="panel" style={{ padding: 18, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>➕ {t.quizNewTitle}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(160px,100%),1fr))', gap: 10, marginBottom: 10 }}>
        <select value={nb.batchId} onChange={(e) => setNb({ batchId: e.target.value, moduleId: '', title: nb.title })} style={fieldStyle}>
          <option value="">— {t.quizPickBatch} —</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={nb.moduleId} onChange={(e) => setNb((s) => ({ ...s, moduleId: e.target.value }))} style={fieldStyle} disabled={!nbModules.length}>
          <option value="">{t.quizNoModule}</option>
          {nbModules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={nb.title} onChange={(e) => setNb((s) => ({ ...s, title: e.target.value }))} placeholder={t.quizNewName} style={{ ...fieldStyle, flex: 1 }} />
        <button className="btn-primary" style={{ borderRadius: 0 }} disabled={busy} onClick={createNewQuiz}>{t.quizCreateBtn}</button>
      </div>
    </div>
  );

  if (!quizLessons.length) {
    return <div className="anim-in"><div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.tQuizzes}</div>
      {createPanel}
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.noQuizLessons}</div></div>;
  }

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{t.tQuizzes}</div>

      {createPanel}

      {/* lesson picker + subtabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <select value={lessonId ?? ''} onChange={(e) => setLessonId(Number(e.target.value))} style={{ ...fieldStyle, width: 'auto', minWidth: 260 }}>
          {quizLessons.map((z) => <option key={z.lessonId} value={z.lessonId}>{z.courseTitle} — {z.title}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {['edit', 'results'].map((k) => (
            <button key={k} onClick={() => setSub(k)} className={`chip ${sub === k ? 'chip-orange' : ''}`}
              style={{ cursor: 'pointer', border: sub === k ? 'none' : '1.5px solid var(--line)' }}>
              {k === 'edit' ? t.quizEditTab : t.quizResultsTab}
            </button>
          ))}
        </div>
      </div>

      {sub === 'edit' ? (
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>{t.quizMarkCorrect} · {t.quizPassFail}</div>
          {questions.map((qq, qi) => (
            <div key={qi} className="card" style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--brand)', paddingTop: 8 }}>{qi + 1}.</div>
                <input value={qq.question} placeholder={t.quizQuestionPh} onChange={(e) => setQ(qi, { question: e.target.value })} style={fieldStyle} />
                <button onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== qi))}
                  style={{ border: '1.5px solid var(--line)', background: '#fff', borderRadius: 0, padding: '0 12px', color: 'var(--danger,#c92a2a)', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gap: 7, paddingLeft: 24 }}>
                {qq.options.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="radio" name={`correct-${qi}`} checked={!!o.isCorrect} onChange={() => markCorrect(qi, oi)} title={t.quizMarkCorrect} />
                    <input value={o.text} placeholder={`${t.quizOptionPh} ${oi + 1}`} onChange={(e) => setOpt(qi, oi, { text: e.target.value })} style={fieldStyle} />
                    {qq.options.length > 2 && (
                      <button onClick={() => setQ(qi, { options: qq.options.filter((_, j) => j !== oi) })}
                        style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setQ(qi, { options: [...qq.options, { text: '', isCorrect: false }] })}
                  style={{ justifySelf: 'start', border: 'none', background: 'none', color: 'var(--brand-deep)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  {t.quizAddOption}
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
              style={{ border: '1.5px dashed var(--line)', background: '#fff', borderRadius: 0, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', color: 'var(--ink-soft)' }}>
              {t.quizAddQuestion}
            </button>
            <button className="btn-primary" style={{ borderRadius: 0 }} disabled={busy} onClick={save}>{busy ? '…' : t.quizSave}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <div><span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{t.quizAttempts}: </span><b>{results.length}</b></div>
            <div><span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{t.quizAvg}: </span><b>{avg}%</b></div>
          </div>
          {results.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.quizNoResults}</div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {results.map((r) => (
                <div key={r.studentId} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{r.studentName || `#${r.studentId}`}</div>
                  <span className={`chip ${r.maxScore && r.score / r.maxScore >= PASS ? 'chip-green' : 'chip-orange'}`}>
                    {r.score}/{r.maxScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
