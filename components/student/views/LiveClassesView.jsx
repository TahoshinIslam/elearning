'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { copy, dateLabel } from '@/lib/copy';

// Live classes for batches the student is enrolled in. The meeting link is
// only released by the access-checked join endpoint when the class is live.
export default function LiveClassesView({ lang }) {
  const c = copy(lang);
  const en = lang === 'en';
  const { liveClasses, loaded, api } = useApp();
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const join = async (cls) => {
    setBusy(cls.id); setMsg(null);
    try {
      const { url } = await api.joinClass(cls.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      const r = e?.data?.error;
      if (r === 'ended' && e.data.recordingUrl) { window.open(e.data.recordingUrl, '_blank', 'noopener,noreferrer'); }
      else setMsg({ id: cls.id, t: r === 'not_started' ? (en ? 'This class hasn’t started yet.' : 'ক্লাস এখনো শুরু হয়নি।') : r === 'ended' ? (en ? 'This class has ended.' : 'ক্লাসটি শেষ হয়েছে।') : c.err_generic });
    } finally { setBusy(null); }
  };
  const label = { scheduled: en ? 'Scheduled' : 'নির্ধারিত', live: en ? 'Live now' : 'এখন লাইভ', ended: en ? 'Ended' : 'শেষ' };
  return (
    <div className="stack" style={{ '--gap': '20px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>{c.liveClasses}</h1></div></div>
      {!loaded ? <div className="skeleton" style={{ height: 160 }} /> : !liveClasses.length ? (
        <div className="surface state"><div className="state-icon"><Icon name="video" size={24} /></div><p>{en ? 'No live classes for your batches.' : 'আপনার ব্যাচের কোনো লাইভ ক্লাস নেই।'}</p></div>
      ) : (
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, '--gap': '10px' }}>
          {liveClasses.map((cls) => (
            <li key={cls.id} className="surface surface-pad row between" style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="strong">{cls.title}</div>
                <div className="small muted">{dateLabel(lang, cls.classDate)} {cls.startTime && `· ${cls.startTime}`}{cls.endTime && `–${cls.endTime}`}</div>
              </div>
              <div className="row" style={{ '--gap': '10px', flexWrap: 'wrap' }}>
                <span className={`badge ${cls.status === 'live' ? 'badge-danger' : cls.status === 'ended' ? '' : 'badge-info'}`}>{label[cls.status] || cls.status}</span>
                {(cls.status === 'live' || (cls.status === 'ended' && cls.recordingUrl)) && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => join(cls)} disabled={busy === cls.id}>{busy === cls.id ? <span className="spinner" aria-hidden="true" /> : <Icon name={cls.status === 'live' ? 'video' : 'play'} size={15} />}{cls.status === 'live' ? (en ? 'Join' : 'জয়েন করুন') : (en ? 'Recording' : 'রেকর্ডিং')}</button>
                )}
              </div>
              {msg?.id === cls.id && <p className="small muted" role="status" style={{ flexBasis: '100%' }}>{msg.t}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
