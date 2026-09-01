'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const ROLE_BADGE = { teacher: 'chip-orange', owner: 'chip-green', superadmin: 'chip-green' };
const STAFF = ['teacher', 'owner', 'superadmin'];

// Per-lesson discussion thread. Reading is open; posting requires a session.
export default function LessonQAModal({ lesson, onClose }) {
  const { t, auth, api, showToast } = useApp();
  const [thread, setThread] = useState(null);
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState({}); // { [questionId]: text }
  const [openReply, setOpenReply] = useState(null);

  const load = () => api.getThread(lesson.id).then(setThread).catch(() => setThread([]));
  useEffect(() => { load(); }, [lesson.id]);

  const submitAsk = async () => {
    if (!ask.trim()) { showToast(t.qaNeedText); return; }
    try { setThread(await api.askQuestion(lesson.id, ask.trim())); setAsk(''); showToast(t.qaPosted); }
    catch { showToast(t.errGeneric); }
  };
  const submitReply = async (qid) => {
    const text = (reply[qid] || '').trim();
    if (!text) { showToast(t.qaNeedText); return; }
    try {
      setThread(await api.postAnswer(qid, text));
      setReply((r) => ({ ...r, [qid]: '' })); setOpenReply(null); showToast(t.qaPosted);
    } catch { showToast(t.errGeneric); }
  };

  const Badge = ({ role }) => STAFF.includes(role)
    ? <span className={`chip ${ROLE_BADGE[role] || ''}`} style={{ fontSize: 10, padding: '1px 8px' }}>{role}</span> : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 90, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="panel anim-in" style={{ width: 'min(600px,100%)', maxHeight: '88vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t.qaTitle}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{lesson.title}</div>

        {/* ask box */}
        {auth ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={t.qaAskPh}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAsk(); }}
              style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, fontFamily: 'inherit' }} />
            <button className="btn-primary" style={{ borderRadius: 10 }} onClick={submitAsk}>{t.qaAsk}</button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>🔒 {t.qaLoginToPost}</div>
        )}

        {thread === null ? (
          <div style={{ color: 'var(--faint)', textAlign: 'center', padding: 20 }}>…</div>
        ) : thread.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 24, fontSize: 13.5 }}>{t.qaEmpty}</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {thread.map((qq) => (
              <div key={qq.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{qq.authorName}</span>
                  <Badge role={qq.role} />
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--faint)' }}>{String(qq.createdAt).replace('T', ' ').slice(0, 16)}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55 }}>{qq.body}</div>

                {/* answers */}
                {qq.answers.length > 0 && (
                  <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid var(--line)', display: 'grid', gap: 8 }}>
                    {qq.answers.map((a) => (
                      <div key={a.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5 }}>{a.authorName}</span>
                          <Badge role={a.role} />
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#44403c' }}>{a.body}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* reply */}
                {auth && (openReply === qq.id ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input value={reply[qq.id] || ''} onChange={(e) => setReply((r) => ({ ...r, [qq.id]: e.target.value }))} placeholder={t.qaAnswerPh}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitReply(qq.id); }}
                      style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                    <button className="btn-dark" style={{ borderRadius: 8 }} onClick={() => submitReply(qq.id)}>{t.qaAnswer}</button>
                  </div>
                ) : (
                  <button onClick={() => setOpenReply(qq.id)} style={{ marginTop: 8, border: 'none', background: 'none', color: 'var(--brand-deep)', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>↳ {t.qaReply}</button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
