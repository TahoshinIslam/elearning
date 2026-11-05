'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { copy, dateLabel, num } from '@/lib/copy';

function useFetch(url, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || String(res.status));
      setState({ loading: false, data, error: null });
    } catch (e) { setState({ loading: false, data: null, error: e.message }); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);
  return { ...state, reload: load };
}

function Loading() { return <div className="row muted small" style={{ '--gap': '8px' }}><span className="spinner" aria-hidden="true" /><span role="status">…</span></div>; }
function Failed({ c, onRetry }) {
  return <div className="notice" role="alert"><Icon name="alert" size={18} /><div>{c.err_generic} <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>{c.retry}</button></div></div>;
}

const fmtSize = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function ResourcesPanel({ lessonId, lang }) {
  const c = copy(lang);
  const { loading, data, error, reload } = useFetch(`/api/lessons/${lessonId}/resources`, [lessonId]);
  const [busy, setBusy] = useState(null);
  const open = async (r) => {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/resources/${r.id}/download`, { cache: 'no-store' });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      if (out.external) window.open(out.url, '_blank', 'noopener,noreferrer'); else window.location.assign(out.url);
    } catch { reload(); } finally { setBusy(null); }
  };
  if (loading) return <Loading />;
  if (error) return <Failed c={c} onRetry={reload} />;
  if (!data.length) return <p className="muted">{c.noResources}</p>;
  return (
    <ul className="surface" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {data.map((r, i) => (
        <li key={r.id} className="row" style={{ padding: '12px 16px', borderTop: i ? '1px solid var(--stage-border)' : 0 }}>
          <Icon name={r.kind === 'link' ? 'link' : 'file'} size={18} />
          <span className="grow"><span style={{ display: 'block' }}>{r.title}</span>{r.sizeBytes ? <span className="xsmall muted">{fmtSize(r.sizeBytes)}</span> : null}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => open(r)} disabled={busy === r.id}>
            {busy === r.id ? <span className="spinner" aria-hidden="true" /> : <Icon name={r.kind === 'link' ? 'external' : 'download'} size={15} />}
            {r.kind === 'link' ? c.openLink : c.download}<span className="sr-only">: {r.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function QAPanel({ lessonId, lang }) {
  const c = copy(lang);
  const en = lang === 'en';
  const { loading, data, error, reload } = useFetch(`/api/qa?lessonId=${lessonId}`, [lessonId]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const ask = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, body: text.trim() }) });
      if (!res.ok) throw new Error();
      setText(''); setMsg({ ok: true, t: en ? 'Question posted.' : 'প্রশ্ন পোস্ট হয়েছে।' }); reload();
    } catch { setMsg({ ok: false, t: c.err_generic }); } finally { setBusy(false); }
  };
  return (
    <div className="stack" style={{ '--gap': '18px' }}>
      <form className="stack" style={{ '--gap': '10px' }} onSubmit={ask}>
        <label htmlFor={`qa-${lessonId}`} className="label" style={{ color: 'var(--stage-ink)' }}>{en ? 'Ask a question about this lesson' : 'এই লেসন নিয়ে প্রশ্ন করুন'}</label>
        <textarea id={`qa-${lessonId}`} className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} style={{ minHeight: 90 }} />
        <div className="row" style={{ '--gap': '10px' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>{busy && <span className="spinner" aria-hidden="true" />}{en ? 'Post question' : 'প্রশ্ন পোস্ট করুন'}</button>
          {msg && <span className={`small ${msg.ok ? '' : 'field-error'}`} role="status">{msg.t}</span>}
        </div>
      </form>
      {loading ? <Loading /> : error ? <Failed c={c} onRetry={reload} /> : !data.length ? (
        <p className="muted">{en ? 'No questions yet — be the first to ask.' : 'এখনো কোনো প্রশ্ন নেই — প্রথম প্রশ্নটি করুন।'}</p>
      ) : (
        <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, '--gap': '12px' }}>
          {data.map((qn) => (
            <li key={qn.id} className="surface" style={{ padding: 16 }}>
              <p className="small muted">{qn.authorName} · {dateLabel(lang, qn.createdAt)}</p>
              <p style={{ marginTop: 4, color: 'var(--stage-ink)', whiteSpace: 'pre-line' }}>{qn.body}</p>
              {qn.answers?.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: '0 0 0 14px', borderLeft: '2px solid var(--stage-border)', display: 'grid', gap: 10 }}>
                  {qn.answers.map((a) => (
                    <li key={a.id}>
                      <p className="small muted">{a.authorName}{a.role !== 'student' && <span className="badge badge-brand" style={{ marginLeft: 6 }}>{en ? 'Instructor' : 'ইন্সট্রাক্টর'}</span>}</p>
                      <p style={{ color: 'var(--stage-ink)', whiteSpace: 'pre-line' }}>{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReadingPanel({ lesson, lang, learner, completed, onChange }) {
  const c = copy(lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!learner) return null;
  const toggle = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !completed }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(!!data.completed);
    } catch { setError(c.err_generic); } finally { setBusy(false); }
  };
  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <p className="small muted">{c.readingHint}</p>
      <div className="row" style={{ '--gap': '10px' }}>
        <button type="button" className={`btn ${completed ? 'btn-secondary' : 'btn-primary'}`} onClick={toggle} disabled={busy} aria-pressed={completed}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name={completed ? 'replay' : 'check'} size={16} />}
          {completed ? c.markIncomplete : c.markComplete}
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

const clockOf = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

// Student quiz player: single / multiple / true-false / short answers,
// optional timer (server-enforced deadline), attempt limit, pass mark, and
// answers + explanations revealed only when the quiz settings allow.
export function QuizPanel({ lesson, lang, learner, onSubmitted }) {
  const c = copy(lang);
  const en = lang === 'en';
  const { loading, data, error, reload } = useFetch(`/api/quizzes?lessonId=${lesson.id}`, [lesson.id]);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [deadline, setDeadline] = useState(null); // ms timestamp
  const [now, setNow] = useState(Date.now());
  const [started, setStarted] = useState(false);
  useEffect(() => { if (data?.attempt?.answers) setAnswers(data.attempt.answers); }, [data]);
  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [deadline]);
  const secondsLeft = deadline ? Math.ceil((deadline - now) / 1000) : null;

  const doSubmit = async (auto = false) => {
    setBusy(true); setSubmitError(null);
    try {
      const res = await fetch('/api/quizzes/attempt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id, answers }) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error);
      setResult(out); setDeadline(null); setStarted(false); onSubmitted(); reload();
      if (auto) setSubmitError(en ? 'Time’s up — your answers were submitted.' : 'সময় শেষ — আপনার উত্তর জমা হয়েছে।');
    } catch (err) {
      setSubmitError(err.message === 'no_attempts_left' ? (en ? 'No attempts left.' : 'আর কোনো চেষ্টা বাকি নেই।') : c.err_generic);
    } finally { setBusy(false); }
  };
  useEffect(() => { if (secondsLeft != null && secondsLeft <= 0 && !busy) doSubmit(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [secondsLeft]);

  if (loading) return <Loading />;
  if (error) return <Failed c={c} onRetry={reload} />;
  if (!data.questions.length) return <p className="muted">{en ? 'This quiz has no questions yet.' : 'এই কুইজে এখনো প্রশ্ন যোগ হয়নি।'}</p>;

  const st = data.settings || {};
  const attempt = result || data.attempt;
  const revealed = result ? !!result.correct : data.revealed;
  const correct = result?.correct || (data.revealed ? Object.fromEntries(data.questions.map((qq) => [qq.id, qq.type === 'short' ? (qq.acceptedAnswers || [])[0] : qq.type === 'multiple' ? qq.options.filter((o) => o.isCorrect).map((o) => o.id) : qq.options.find((o) => o.isCorrect)?.id])) : null);
  const explanations = result?.explanations || (data.revealed ? Object.fromEntries(data.questions.filter((qq) => qq.explanation).map((qq) => [qq.id, qq.explanation])) : {});
  const perQ = result?.results || data.attempt?.results || null;
  const attemptsLeft = result ? result.attemptsLeft : data.attemptsLeft;
  const canAttempt = learner && (attemptsLeft == null || attemptsLeft > 0);
  const timed = !!st.timeLimitSec;
  const mustStart = timed && canAttempt && !started;

  const start = async () => {
    setSubmitError(null);
    const res = await fetch('/api/quizzes/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { setSubmitError(out.error === 'no_attempts_left' ? (en ? 'No attempts left.' : 'আর কোনো চেষ্টা বাকি নেই।') : c.err_generic); return; }
    if (!result) setAnswers({});
    setResult(null);
    setStarted(true);
    if (out.secondsLeft != null) { setDeadline(Date.now() + out.secondsLeft * 1000); setNow(Date.now()); }
  };

  const submit = (e) => {
    e.preventDefault();
    const missing = data.questions.filter((qq) => answers[qq.id] == null || answers[qq.id] === '' || (Array.isArray(answers[qq.id]) && !answers[qq.id].length)).length;
    if (missing) { setSubmitError(en ? `Answer all questions (${missing} left).` : `সব প্রশ্নের উত্তর দিন (${num(lang, missing)}টি বাকি)।`); return; }
    doSubmit(false);
  };

  const percent = attempt?.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const passMark = st.passPercent || 0;
  const passed = result ? result.passed : attempt?.passed;
  const locked = mustStart || !learner || (!canAttempt && !started);

  return (
    <form className="stack quiz" style={{ '--gap': '18px' }} onSubmit={submit}>
      <div className="quiz-bar">
        {timed && <span className="badge"><Icon name="clock" size={13} />{clockOf(st.timeLimitSec)}</span>}
        {passMark > 0 && <span className="badge">{en ? 'Pass' : 'পাস'} {num(lang, passMark)}%</span>}
        {attemptsLeft != null && <span className="badge">{en ? `${attemptsLeft} attempt(s) left` : `আর ${num(lang, attemptsLeft)} বার চেষ্টা`}</span>}
        <span className="badge">{num(lang, data.maxScore)} {en ? 'points' : 'নম্বর'}</span>
        {secondsLeft != null && <span className={`quiz-timer ${secondsLeft <= 30 ? 'is-low' : ''}`} role="timer" aria-live="off"><Icon name="clock" size={15} />{clockOf(secondsLeft)}</span>}
      </div>
      {st.instructions && !attempt && <p className="notice"><Icon name="info" size={18} />{st.instructions}</p>}
      {attempt && (
        <div className={`quiz-score ${passed === false ? 'is-fail' : 'is-pass'}`} role="status">
          <Icon name="award" size={20} />
          <strong>{num(lang, attempt.score)} / {num(lang, attempt.maxScore)} · {num(lang, percent)}%</strong>
          {passed != null && <span className="badge">{passed ? (en ? 'Passed' : 'পাস') : (en ? 'Not passed yet' : 'এখনো পাস হয়নি')}</span>}
          {!revealed && <span className="small">{en ? 'Correct answers are hidden for this quiz.' : 'এই কুইজে সঠিক উত্তর দেখানো হয় না।'}</span>}
        </div>
      )}
      {mustStart ? (
        <div className="surface quiz-start"><p>{en ? `Timed quiz: you’ll have ${clockOf(st.timeLimitSec)} once you start. The clock keeps running if you leave.` : `সময়সীমাযুক্ত কুইজ: শুরু করলে ${clockOf(st.timeLimitSec)} সময় পাবেন। পেজ ছেড়ে গেলেও সময় চলতে থাকবে।`}</p>
          <button type="button" className="btn btn-primary" onClick={start}><Icon name="play" size={16} />{attempt ? (en ? 'Start a new attempt' : 'নতুন চেষ্টা শুরু করুন') : (en ? 'Start quiz' : 'কুইজ শুরু করুন')}</button></div>
      ) : data.questions.map((qq, i) => {
        const given = answers[qq.id];
        const right = correct ? correct[qq.id] : undefined;
        const ok = perQ ? perQ[qq.id] : null;
        return (
          <fieldset key={qq.id} className={`surface quiz-q ${ok === true ? 'is-right' : ok === false ? 'is-wrong' : ''}`} disabled={locked}>
            <legend className="strong">{num(lang, i + 1)}. {qq.question} <span className="xsmall muted">({num(lang, qq.points)} {en ? 'pt' : 'নম্বর'}{qq.type === 'multiple' ? (en ? ' · choose all that apply' : ' · একাধিক উত্তর হতে পারে') : ''})</span></legend>
            {qq.type === 'short' ? (
              <div className="stack" style={{ '--gap': '6px' }}>
                <label className="sr-only" htmlFor={`qa-${qq.id}`}>{en ? 'Your answer' : 'আপনার উত্তর'}</label>
                <input id={`qa-${qq.id}`} className="input" value={given ?? ''} maxLength={500} onChange={(e) => setAnswers((a) => ({ ...a, [qq.id]: e.target.value }))} />
                {revealed && right != null && <span className="small">{en ? 'Accepted answer' : 'গ্রহণযোগ্য উত্তর'}: <strong>{right}</strong></span>}
              </div>
            ) : (
              <div className="stack" style={{ '--gap': '6px', marginTop: 6 }}>
                {qq.options.map((o) => {
                  const multi = qq.type === 'multiple';
                  const picked = multi ? (Array.isArray(given) ? given.map(Number).includes(o.id) : false) : Number(given) === o.id;
                  const isRight = revealed && (multi ? (right || []).includes(o.id) : right === o.id);
                  return (
                    <label key={o.id} className={`check quiz-opt ${isRight ? 'is-right' : revealed && picked ? 'is-wrong' : ''}`}>
                      <input type={multi ? 'checkbox' : 'radio'} name={`q-${qq.id}`} checked={picked}
                        onChange={(e) => setAnswers((a) => ({ ...a, [qq.id]: multi ? (e.target.checked ? [...(a[qq.id] || []), o.id] : (a[qq.id] || []).filter((x) => Number(x) !== o.id)) : o.id }))} />
                      <span>{o.text}{isRight && <span className="sr-only"> ({en ? 'correct answer' : 'সঠিক উত্তর'})</span>}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {explanations[qq.id] && <p className="quiz-explain"><Icon name="info" size={14} />{explanations[qq.id]}</p>}
          </fieldset>
        );
      })}
      {submitError && <p className="field-error" role="alert">{submitError}</p>}
      {learner && !mustStart && canAttempt && <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{attempt && !started ? (en ? 'Submit again' : 'আবার জমা দিন') : (en ? 'Submit quiz' : 'কুইজ জমা দিন')}</button></div>}
    </form>
  );
}

export function AssignmentPanel({ lesson, lang, learner, onSubmitted }) {
  const c = copy(lang);
  const en = lang === 'en';
  const { loading, data, error, reload } = useFetch(`/api/submissions`, [lesson.id]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  if (!learner) return null;
  if (loading) return <Loading />;
  if (error) return <Failed c={c} onRetry={reload} />;
  const mine = (data || []).find((s) => s.lessonId === lesson.id);
  if (mine) {
    return (
      <div className="surface stack" style={{ padding: 16, '--gap': '8px' }}>
        <p className="strong" style={{ color: 'var(--stage-ink)' }}>{en ? 'Submitted' : 'জমা দেওয়া হয়েছে'} · {dateLabel(lang, mine.submittedAt)}</p>
        <p style={{ whiteSpace: 'pre-line', color: 'var(--stage-ink)' }}>{mine.content}</p>
        {mine.status === 'graded'
          ? <p className="badge badge-success" style={{ alignSelf: 'flex-start' }}>{en ? 'Marks' : 'নম্বর'}: {num(lang, mine.marks ?? 0)} / {num(lang, mine.maxMarks)}</p>
          : <p className="small muted">{en ? 'Waiting for the instructor to grade.' : 'ইন্সট্রাক্টরের মূল্যায়নের অপেক্ষায়।'}</p>}
        {mine.feedback && <p className="small" style={{ color: 'var(--stage-ink)' }}>{mine.feedback}</p>}
      </div>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setSubmitError(c.required); return; }
    setBusy(true); setSubmitError(null);
    try {
      const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id, content: text.trim() }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error);
      onSubmitted(); reload();
    } catch { setSubmitError(c.err_generic); } finally { setBusy(false); }
  };
  return (
    <form className="stack" style={{ '--gap': '10px' }} onSubmit={submit}>
      <label htmlFor={`asg-${lesson.id}`} className="label" style={{ color: 'var(--stage-ink)' }}>{c.submitAssignment}</label>
      <textarea id={`asg-${lesson.id}`} className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={10000} aria-invalid={!!submitError} />
      {submitError && <p className="field-error" role="alert">{submitError}</p>}
      <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}{c.submitAssignment}</button></div>
    </form>
  );
}
