'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { send } from '@/components/owner/useAdminData';
import { num } from '@/lib/copy';

const L = {
  bn: {
    pick: 'কুইজ বেছে নিন', none: 'কোনো কুইজ নেই — নিচে একটি তৈরি করুন।', newQuiz: 'নতুন কুইজ', batch: 'ব্যাচ / কোর্স', title: 'কুইজের নাম', create: 'তৈরি করুন',
    builder: 'প্রশ্ন', settings: 'সেটিংস', results: 'ফলাফল', addQ: 'প্রশ্ন যোগ', import: 'একসাথে পেস্ট করুন', importHelp: 'প্রতি প্রশ্ন: "Q: প্রশ্ন" লাইন, তারপর অপশন — সঠিকটির আগে "*", ভুলগুলোর আগে "-"। খালি লাইন দিয়ে আলাদা করুন।', importBtn: 'প্রশ্ন বানাও',
    types: { single: 'একটি সঠিক', multiple: 'একাধিক সঠিক', true_false: 'সত্য / মিথ্যা', short: 'ছোট উত্তর' },
    question: 'প্রশ্ন', points: 'নম্বর', option: 'অপশন', addOpt: 'অপশন যোগ', correct: 'সঠিক', accepted: 'গ্রহণযোগ্য উত্তর (প্রতি লাইনে একটি)', explain: 'ব্যাখ্যা (উত্তর দেখানোর সময় দেখাবে)',
    moveUp: 'উপরে', moveDown: 'নিচে', duplicate: 'কপি', remove: 'প্রশ্ন মুছুন', removeOpt: 'অপশন সরান', isTrue: 'সঠিক উত্তর: সত্য', isFalse: 'সঠিক উত্তর: মিথ্যা',
    time: 'সময়সীমা (মিনিট, ০ = নেই)', pass: 'পাস মার্ক (%)', attempts: 'সর্বোচ্চ চেষ্টা (০ = সীমাহীন)', shuffleQ: 'প্রশ্ন এলোমেলো', shuffleO: 'অপশন এলোমেলো', reveal: 'সঠিক উত্তর দেখাবে',
    revealOpts: { after_submit: 'জমা দেওয়ার পর', after_pass: 'পাস করলে / চেষ্টা শেষ হলে', never: 'কখনো না' }, instructions: 'নির্দেশনা (শিক্ষার্থী শুরুতে দেখবে)',
    save: 'কুইজ সংরক্ষণ', total: (n, p) => `${n}টি প্রশ্ন · মোট ${p} নম্বর`, student: 'শিক্ষার্থী', score: 'নম্বর', best: 'সেরা', tries: 'চেষ্টা', time2: 'সময়', passed: 'পাস', failed: 'ফেল', noRes: 'এখনো কেউ কুইজ দেয়নি।',
    items: 'প্রশ্নভিত্তিক বিশ্লেষণ', rightRate: 'সঠিক উত্তরের হার', hard: 'কঠিন', errs: { question_needs_two_options: 'কমপক্ষে ২টি অপশন লাগবে', question_needs_one_correct: 'ঠিক একটি সঠিক উত্তর বাছুন', question_needs_a_correct: 'অন্তত একটি সঠিক উত্তর বাছুন', short_answer_needs_accepted: 'অন্তত একটি গ্রহণযোগ্য উত্তর লিখুন', not_your_course: 'এটি আপনার কোর্সের কুইজ নয়' }
  },
  en: {
    pick: 'Choose a quiz', none: 'No quizzes yet — create one below.', newQuiz: 'New quiz', batch: 'Batch / course', title: 'Quiz name', create: 'Create',
    builder: 'Questions', settings: 'Settings', results: 'Results', addQ: 'Add question', import: 'Paste in bulk', importHelp: 'Per question: a "Q: question" line, then options — "*" before the correct one, "-" before wrong ones. Separate questions with a blank line.', importBtn: 'Create questions',
    types: { single: 'Single answer', multiple: 'Multiple answers', true_false: 'True / False', short: 'Short answer' },
    question: 'Question', points: 'Points', option: 'Option', addOpt: 'Add option', correct: 'Correct', accepted: 'Accepted answers (one per line)', explain: 'Explanation (shown with the answers)',
    moveUp: 'Move up', moveDown: 'Move down', duplicate: 'Duplicate', remove: 'Delete question', removeOpt: 'Remove option', isTrue: 'Correct answer: True', isFalse: 'Correct answer: False',
    time: 'Time limit (minutes, 0 = none)', pass: 'Pass mark (%)', attempts: 'Max attempts (0 = unlimited)', shuffleQ: 'Shuffle questions', shuffleO: 'Shuffle options', reveal: 'Show correct answers',
    revealOpts: { after_submit: 'After submitting', after_pass: 'After passing / out of attempts', never: 'Never' }, instructions: 'Instructions (shown before starting)',
    save: 'Save quiz', total: (n, p) => `${n} questions · ${p} points`, student: 'Student', score: 'Score', best: 'Best', tries: 'Tries', time2: 'Time', passed: 'Pass', failed: 'Fail', noRes: 'Nobody has taken this quiz yet.',
    items: 'Question analysis', rightRate: 'Answered correctly', hard: 'Hard', errs: { question_needs_two_options: 'Needs at least 2 options', question_needs_one_correct: 'Mark exactly one correct answer', question_needs_a_correct: 'Mark at least one correct answer', short_answer_needs_accepted: 'Add at least one accepted answer', not_your_course: 'This quiz isn’t in your course' }
  }
};

const blank = (type = 'single') => ({
  key: Math.random().toString(36).slice(2), type, question: '', points: 1, explanation: '', acceptedAnswers: '',
  options: type === 'short' ? [] : type === 'true_false' ? [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]
});

// "Q: …" blocks → questions
function parseBulk(text) {
  return text.split(/\n\s*\n/).map((block) => {
    const lines = block.split('\n').map((x) => x.trim()).filter(Boolean);
    const qLine = lines.find((x) => /^q[:.)]/i.test(x)) || lines[0];
    if (!qLine) return null;
    const opts = lines.filter((x) => /^[-*]/.test(x)).map((x) => ({ text: x.replace(/^[-*]\s*/, ''), isCorrect: x.startsWith('*') }));
    const right = opts.filter((o) => o.isCorrect).length;
    const type = !opts.length ? 'short' : right > 1 ? 'multiple' : 'single';
    return { ...blank(type), question: qLine.replace(/^q[:.)]\s*/i, ''), options: opts.length ? opts : [] };
  }).filter((x) => x && x.question);
}

function QuestionCard({ q, i, n, l, update, move, dup, remove }) {
  const setOpt = (j, patch) => update({ options: q.options.map((o, k) => (k === j ? { ...o, ...patch } : (patch.isCorrect && q.type !== 'multiple' ? { ...o, isCorrect: false } : o))) });
  return (
    <li className="qb-card">
      <div className="qb-head">
        <span className="qb-num">{i + 1}</span>
        <select className="select qb-type" aria-label={l.question} value={q.type} onChange={(e) => update({ ...blank(e.target.value), key: q.key, question: q.question, points: q.points, explanation: q.explanation, id: q.id })}>
          {Object.entries(l.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="qb-points"><span className="sr-only">{l.points}</span><input className="input" type="number" min={1} max={100} value={q.points} onChange={(e) => update({ points: e.target.value })} aria-label={l.points} />{l.points}</label>
        <div className="qb-tools">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => move(-1)} disabled={i === 0} aria-label={l.moveUp} data-tooltip={l.moveUp}><Icon name="arrowUp" size={15} /></button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => move(1)} disabled={i === n - 1} aria-label={l.moveDown} data-tooltip={l.moveDown}><Icon name="arrowDown" size={15} /></button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={dup} aria-label={l.duplicate} data-tooltip={l.duplicate}><Icon name="file" size={15} /></button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={remove} aria-label={l.remove}><Icon name="trash" size={15} /></button>
        </div>
      </div>
      <textarea className="textarea" rows={2} required placeholder={l.question} aria-label={`${l.question} ${i + 1}`} value={q.question} onChange={(e) => update({ question: e.target.value })} />

      {q.type === 'true_false' && (
        <div className="segmented" role="radiogroup" aria-label={l.correct}>
          <button type="button" aria-pressed={q.options[0]?.isCorrect} onClick={() => update({ options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] })}>{l.isTrue}</button>
          <button type="button" aria-pressed={q.options[1]?.isCorrect} onClick={() => update({ options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }] })}>{l.isFalse}</button>
        </div>
      )}
      {(q.type === 'single' || q.type === 'multiple') && (
        <ol className="qb-options">
          {q.options.map((o, j) => (
            <li key={j} className={o.isCorrect ? 'is-correct' : ''}>
              <label className="qb-correct" title={l.correct}>
                <input type={q.type === 'multiple' ? 'checkbox' : 'radio'} name={`c-${q.key}`} checked={o.isCorrect} onChange={(e) => setOpt(j, { isCorrect: q.type === 'multiple' ? e.target.checked : true })} />
                <span className="sr-only">{l.correct}</span>
              </label>
              <input className="input" placeholder={`${l.option} ${j + 1}`} value={o.text} onChange={(e) => setOpt(j, { text: e.target.value })} aria-label={`${l.option} ${j + 1}`} />
              <button type="button" className="btn btn-ghost btn-icon btn-sm" disabled={q.options.length <= 2} onClick={() => update({ options: q.options.filter((_, k) => k !== j) })} aria-label={l.removeOpt}><Icon name="x" size={14} /></button>
            </li>
          ))}
          {q.options.length < 8 && <li><button type="button" className="btn btn-secondary btn-sm" onClick={() => update({ options: [...q.options, { text: '', isCorrect: false }] })}><Icon name="plus" size={14} />{l.addOpt}</button></li>}
        </ol>
      )}
      {q.type === 'short' && (
        <div className="field"><label className="req">{l.accepted}</label>
          <textarea className="textarea" rows={2} required value={Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.join('\n') : q.acceptedAnswers} onChange={(e) => update({ acceptedAnswers: e.target.value })} placeholder={'9.8\n৯.৮'} /></div>
      )}
      <details className="qb-explain"><summary>{l.explain}</summary><textarea className="textarea" rows={2} value={q.explanation || ''} onChange={(e) => update({ explanation: e.target.value })} /></details>
    </li>
  );
}

// Teacher / owner quiz builder: question types, points, explanations,
// settings (timer, pass mark, attempts, shuffling, answer reveal), bulk paste,
// reorder / duplicate, and results with per-question analysis.
export default function TeacherQuizzes() {
  const { lang, t, courses, batches, api, showToast } = useApp();
  const l = L[lang === 'en' ? 'en' : 'bn'];
  const [lessonId, setLessonId] = useState(null);
  const [tab, setTab] = useState('builder');
  const [questions, setQuestions] = useState([]);
  const [settings, setSettings] = useState({ timeLimitSec: null, passPercent: 0, maxAttempts: 0, shuffleQuestions: false, shuffleOptions: false, showAnswers: 'after_submit', instructions: '' });
  const [results, setResults] = useState([]);
  const [items, setItems] = useState([]);
  const [bulk, setBulk] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nb, setNb] = useState({ batchId: '', title: '' });

  const quizLessons = useMemo(() => {
    const out = [];
    for (const c of courses) for (const m of c.modules || []) for (const x of m.lessons || []) if (x.type === 'quiz') out.push({ lessonId: x.id, title: x.title, courseTitle: c.title });
    return out;
  }, [courses]);
  useEffect(() => { if (lessonId == null && quizLessons.length) setLessonId(quizLessons[0].lessonId); }, [quizLessons, lessonId]);

  useEffect(() => {
    if (lessonId == null) return;
    setError('');
    fetch(`/api/quizzes?lessonId=${lessonId}&mode=edit`, { cache: 'no-store' }).then((r) => r.json()).then((quiz) => {
      if (quiz.error) { setError(l.errs[quiz.error] || quiz.error); setQuestions([]); return; }
      setSettings(quiz.settings);
      setQuestions(quiz.questions.map((x) => ({ ...x, key: String(x.id), acceptedAnswers: (x.acceptedAnswers || []).join('\n') })));
    }).catch(() => setQuestions([]));
    fetch(`/api/quizzes/results?lessonId=${lessonId}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setResults(Array.isArray(d) ? d : [])).catch(() => setResults([]));
    fetch(`/api/quizzes/results?lessonId=${lessonId}&items=1`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [lessonId, l]);

  const update = (i, patch) => setQuestions((list) => list.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i, d) => setQuestions((list) => { const a = [...list]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
  const totalPts = questions.reduce((a, x) => a + (Number(x.points) || 1), 0);

  const save = async (e) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setBusy(true); setError('');
    try {
      const quiz = await send('/api/quizzes', 'POST', {
        lessonId, settings,
        questions: questions.map((x) => ({ ...x, acceptedAnswers: typeof x.acceptedAnswers === 'string' ? x.acceptedAnswers.split('\n') : x.acceptedAnswers }))
      });
      setQuestions(quiz.questions.map((x) => ({ ...x, key: String(x.id), acceptedAnswers: (x.acceptedAnswers || []).join('\n') })));
      showToast(lang === 'en' ? 'Quiz saved — existing attempts re-graded' : 'কুইজ সংরক্ষিত — আগের উত্তরগুলো নতুন করে মূল্যায়ন হয়েছে', 'success');
    } catch (err) {
      const msg = l.errs[err.message] || err.message;
      setError(err.data?.question ? `${l.question} ${err.data.question}: ${msg}` : msg);
    } finally { setBusy(false); }
  };

  const createNew = async (e) => {
    e.preventDefault();
    const b = batches.find((x) => x.id === Number(nb.batchId));
    if (!b?.courseId) { showToast(t.quizBatchNoCourse || 'Pick a batch linked to a course', 'error'); return; }
    setBusy(true);
    try {
      const { lessonId: id } = await api.createQuiz({ courseId: b.courseId, title: nb.title.trim() });
      setNb({ batchId: '', title: '' }); setLessonId(id); setTab('builder');
    } catch { /* toast via ActionFeedback */ } finally { setBusy(false); }
  };

  const fmtTime = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

  return (
    <div className="stack" style={{ '--gap': '18px' }}>
      <div className="row" style={{ flexWrap: 'wrap', '--gap': '10px' }}>
        <label htmlFor="qz-pick" className="strong">{l.pick}</label>
        <select id="qz-pick" className="select" style={{ maxWidth: 520 }} value={lessonId ?? ''} onChange={(e) => setLessonId(Number(e.target.value))}>
          {!quizLessons.length && <option value="">{l.none}</option>}
          {quizLessons.map((x) => <option key={x.lessonId} value={x.lessonId}>{x.title} — {x.courseTitle}</option>)}
        </select>
      </div>

      {lessonId != null && (
        <>
          <div className="tabs" role="tablist">
            {['builder', 'settings', 'results'].map((k) => <button key={k} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l[k]}{k === 'results' && <span className="count">{num(lang, results.length)}</span>}{k === 'builder' && <span className="count">{num(lang, questions.length)}</span>}</button>)}
          </div>

          {tab !== 'results' ? (
            <form className="stack" onSubmit={save} noValidate style={{ '--gap': '16px' }}>
              {tab === 'builder' ? (
                <>
                  <p className="strong">{l.total(num(lang, questions.length), num(lang, totalPts))}</p>
                  <ol className="qb-list">
                    {questions.map((x, i) => (
                      <QuestionCard key={x.key} q={x} i={i} n={questions.length} l={l} update={(p) => update(i, p)} move={(d) => move(i, d)}
                        dup={() => setQuestions((list) => [...list.slice(0, i + 1), { ...x, id: undefined, key: Math.random().toString(36).slice(2), options: x.options.map(({ text, isCorrect }) => ({ text, isCorrect })) }, ...list.slice(i + 1)])}
                        remove={() => setQuestions((list) => list.filter((_, k) => k !== i))} />
                    ))}
                  </ol>
                  <div className="cluster">
                    {Object.keys(l.types).map((k) => <button key={k} type="button" className="btn btn-secondary btn-sm" onClick={() => setQuestions((list) => [...list, blank(k)])}><Icon name="plus" size={14} />{l.types[k]}</button>)}
                  </div>
                  <details className="surface surface-pad">
                    <summary className="strong" style={{ cursor: 'pointer' }}><Icon name="list" size={16} /> {l.import}</summary>
                    <p className="help" style={{ margin: '8px 0' }}>{l.importHelp}</p>
                    <textarea className="textarea" rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Q: g-এর মান কত?\n* 9.8 m/s²\n- 10.8 m/s²\n- 8.9 m/s²'} />
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} disabled={!bulk.trim()} onClick={() => { const add = parseBulk(bulk); setQuestions((list) => [...list, ...add]); setBulk(''); showToast(`+${add.length}`, 'success'); }}><Icon name="plus" size={14} />{l.importBtn}</button>
                  </details>
                </>
              ) : (
                <div className="surface surface-pad stack">
                  <div className="form-grid">
                    <div className="field"><label htmlFor="qs-time">{l.time}</label><input id="qs-time" className="input" type="number" min={0} max={360} value={settings.timeLimitSec ? Math.round(settings.timeLimitSec / 60) : 0} onChange={(e) => setSettings({ ...settings, timeLimitSec: Number(e.target.value) > 0 ? Number(e.target.value) * 60 : null })} /></div>
                    <div className="field"><label htmlFor="qs-pass">{l.pass}</label><input id="qs-pass" className="input" type="number" min={0} max={100} value={settings.passPercent} onChange={(e) => setSettings({ ...settings, passPercent: e.target.value })} /></div>
                    <div className="field"><label htmlFor="qs-att">{l.attempts}</label><input id="qs-att" className="input" type="number" min={0} max={20} value={settings.maxAttempts} onChange={(e) => setSettings({ ...settings, maxAttempts: e.target.value })} /></div>
                    <div className="field"><label htmlFor="qs-rev">{l.reveal}</label>
                      <select id="qs-rev" className="select" value={settings.showAnswers} onChange={(e) => setSettings({ ...settings, showAnswers: e.target.value })}>
                        {Object.entries(l.revealOpts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select></div>
                  </div>
                  <div className="cluster">
                    <label className="check"><input type="checkbox" checked={settings.shuffleQuestions} onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })} />{l.shuffleQ}</label>
                    <label className="check"><input type="checkbox" checked={settings.shuffleOptions} onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })} />{l.shuffleO}</label>
                  </div>
                  <div className="field"><label htmlFor="qs-ins">{l.instructions}</label><textarea id="qs-ins" className="textarea" rows={3} maxLength={2000} value={settings.instructions} onChange={(e) => setSettings({ ...settings, instructions: e.target.value })} /></div>
                </div>
              )}
              {error && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{error}</div>}
              <div className="editor-savebar"><button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}<Icon name="check" size={16} />{l.save}</button></div>
            </form>
          ) : (
            <div className="stack" style={{ '--gap': '18px' }}>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>{l.student}</th><th>{l.score}</th><th>{l.best}</th><th>{l.tries}</th><th>{l.time2}</th><th /></tr></thead>
                  <tbody>
                    {!results.length ? <tr><td colSpan={6} className="muted">{l.noRes}</td></tr> : results.map((r) => (
                      <tr key={r.studentId}><td className="strong">{r.studentName}</td>
                        <td className="tabular">{num(lang, r.score)}/{num(lang, r.maxScore)} <span className="muted xsmall">({num(lang, r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0)}%)</span></td>
                        <td className="tabular">{num(lang, r.bestScore ?? r.score)}</td><td className="tabular">{num(lang, r.attemptsUsed || 1)}</td><td className="tabular">{fmtTime(r.timeSpentSec)}</td>
                        <td>{r.passed == null ? null : <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>{r.passed ? l.passed : l.failed}</span>}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <section className="surface surface-pad stack">
                <h3 className="h4">{l.items}</h3>
                {!items.length ? <p className="muted">{l.noRes}</p> : (
                  <ol className="barlist">
                    {items.map((it, i) => {
                      const rate = Number(it.answered) ? Math.round((Number(it.correct) / Number(it.answered)) * 100) : 0;
                      return (
                        <li key={it.id} style={{ '--w': `${Math.max(4, rate)}%`, '--c': rate < 40 ? 'var(--c-pink)' : rate < 70 ? 'var(--c-yellow)' : 'var(--c-lime)' }}>
                          <span className="barlist-bar" aria-hidden="true" />
                          <span className="barlist-label clamp-1">{num(lang, i + 1)}. {it.question}</span>
                          <span className="barlist-sub">{l.rightRate} · {num(lang, it.correct || 0)}/{num(lang, it.answered)}{rate < 40 && Number(it.answered) > 0 ? ` · ${l.hard}` : ''}</span>
                          <strong className="barlist-val tabular">{num(lang, rate)}%</strong>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>
          )}
        </>
      )}

      <form className="surface surface-pad stack" onSubmit={createNew}>
        <h3 className="h4"><Icon name="plus" size={16} /> {l.newQuiz}</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="nq-b" className="req">{l.batch}</label>
            <select id="nq-b" className="select" required value={nb.batchId} onChange={(e) => setNb({ ...nb, batchId: e.target.value })}>
              <option value="">—</option>
              {batches.filter((b) => b.courseId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="nq-t" className="req">{l.title}</label><input id="nq-t" className="input" required maxLength={191} value={nb.title} onChange={(e) => setNb({ ...nb, title: e.target.value })} /></div>
        </div>
        <div><button type="submit" className="btn btn-secondary" disabled={busy}><Icon name="plus" size={16} />{l.create}</button></div>
      </form>
    </div>
  );
}
