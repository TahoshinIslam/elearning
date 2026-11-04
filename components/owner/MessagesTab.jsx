'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function MessagesTab() {
  const { t, api } = useApp();
  const [messages, setMessages] = useState([]);

  const load = () => api.getMessages().then(setMessages).catch(() => {});
  useEffect(() => { load(); }, []);

  const unread = messages.filter((m) => !m.isRead).length;
  const markOne = async (id) => setMessages(await api.markMessage({ id }));
  const markAll = async () => setMessages(await api.markMessage({ all: true }));

  return (
    <div className="anim-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{t.messagesInbox}{unread > 0 ? ` · ${unread}` : ''}</div>
        {unread > 0 && <button className="btn-dark" style={{ borderRadius: 0 }} onClick={markAll}>{t.markAllRead}</button>}
      </div>

      {messages.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t.messagesEmpty}</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {messages.map((m) => (
            <div key={m.id} className="card" style={{ padding: '16px 18px', background: m.isRead ? undefined : 'var(--brand-wash)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{m.name}</span>
                {m.email && <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{m.email}</span>}
                {!m.isRead && <span style={{ width: 8, height: 8, borderRadius: 0, background: 'var(--brand)' }} />}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--faint)' }}>{String(m.createdAt).replace('T', ' ').slice(0, 16)}</span>
              </div>
              {m.subject && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.subject}</div>}
              <div style={{ fontSize: 13.5, color: '#44403c', lineHeight: 1.6 }}>{m.message}</div>
              {!m.isRead && (
                <button onClick={() => markOne(m.id)} className="chip" style={{ marginTop: 10, cursor: 'pointer', border: '1.5px solid var(--line)' }}>{t.markRead}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
