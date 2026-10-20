'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useFlash } from '@/components/ui/motion';

const BADGE_DEFAULTS = { badgeTopRatedMin: '4.5', badgeTopRatedReviews: '10', badgeNewDays: '30' };

export default function SettingsTab() {
  const { t, lang, api, showToast } = useApp();
  const en = lang === 'en';
  const [s, setS] = useState(null);
  const [base, setBase] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [flash, doFlash] = useFlash();

  const load = () => api.getSettings().then((d) => { const v = { ...BADGE_DEFAULTS, ...d }; setS(v); setBase(JSON.stringify(v)); setLoadErr(false); }).catch(() => setLoadErr(true));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }));
  const dirty = s && JSON.stringify(s) !== base;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const d = await api.saveSettings(s); const v = { ...BADGE_DEFAULTS, ...d }; setS(v); setBase(JSON.stringify(v)); doFlash(); showToast(t.setSaved, 'success'); }
    catch { showToast(t.errGeneric, 'error'); } finally { setBusy(false); }
  };

  if (loadErr) return <div className="state surface" role="alert"><p>{en ? 'Couldn’t load settings.' : 'সেটিংস লোড করা যায়নি।'}</p><button type="button" className="btn btn-secondary btn-sm" onClick={load}>{en ? 'Try again' : 'আবার চেষ্টা করুন'}</button></div>;
  if (!s) return <div className="surface surface-pad stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div>;
  const maint = s.maintenance === '1';

  return (
    <form onSubmit={save}>
      <div className="editor-grid">
        <div className="stack" style={{ '--gap': '18px' }}>
          <section className="surface surface-pad stack" aria-labelledby="set-site">
            <h2 id="set-site" className="h4">{en ? 'Site' : 'সাইট'}</h2>
            <div className="field"><label htmlFor="set-title">{t.setSiteTitle}</label><input id="set-title" className="input" value={s.siteTitle || ''} onChange={set('siteTitle')} maxLength={120} /></div>
            <div className="field"><label htmlFor="set-seo">{t.setSeo}</label><textarea id="set-seo" className="textarea" rows={3} value={s.seoDescription || ''} onChange={set('seoDescription')} maxLength={300} /><p className="help">{en ? 'Used for search results and share previews.' : 'সার্চ ফলাফল ও শেয়ার প্রিভিউতে ব্যবহৃত হয়।'}</p></div>
          </section>

          <section className="surface surface-pad stack" aria-labelledby="set-support">
            <h2 id="set-support" className="h4">{en ? 'Support contact' : 'সাপোর্ট যোগাযোগ'}</h2>
            <div className="form-grid">
              <div className="field"><label htmlFor="set-phone">{t.setSupportPhone}</label><input id="set-phone" className="input" inputMode="tel" value={s.supportPhone || ''} onChange={set('supportPhone')} /></div>
              <div className="field"><label htmlFor="set-email">{t.setSupportEmail}</label><input id="set-email" className="input" type="email" value={s.supportEmail || ''} onChange={set('supportEmail')} /></div>
            </div>
          </section>

          <section className="surface surface-pad stack" aria-labelledby="set-badges">
            <h2 id="set-badges" className="h4">{en ? 'Course badges' : 'কোর্স ব্যাজ'}</h2>
            <p className="small muted">{en ? 'Badges are computed from real data. “Top rated” counts only published reviews from verified purchasers; “New” counts from a course’s first publication.' : 'ব্যাজ প্রকৃত ডেটা থেকে হিসাব হয়। “সেরা রেটিং” শুধু যাচাইকৃত ক্রেতাদের প্রকাশিত রিভিউ গণনা করে; “নতুন” কোর্সের প্রথম প্রকাশের দিন থেকে গণনা হয়।'}</p>
            <div className="form-grid">
              <div className="field"><label htmlFor="set-trm">{en ? 'Top rated: minimum average' : 'সেরা রেটিং: ন্যূনতম গড়'}</label><input id="set-trm" className="input" type="number" min={1} max={5} step={0.1} value={s.badgeTopRatedMin} onChange={set('badgeTopRatedMin')} /></div>
              <div className="field"><label htmlFor="set-trr">{en ? 'Top rated: minimum reviews' : 'সেরা রেটিং: ন্যূনতম রিভিউ'}</label><input id="set-trr" className="input" type="number" min={1} step={1} value={s.badgeTopRatedReviews} onChange={set('badgeTopRatedReviews')} /></div>
              <div className="field"><label htmlFor="set-nd">{en ? 'New: days after first publication' : 'নতুন: প্রথম প্রকাশের পর কত দিন'}</label><input id="set-nd" className="input" type="number" min={1} max={365} step={1} value={s.badgeNewDays} onChange={set('badgeNewDays')} /></div>
            </div>
          </section>
        </div>

        <aside className="stack editor-side" style={{ '--gap': '18px' }}>
          <section className="surface surface-pad stack" aria-labelledby="set-maint">
            <h2 id="set-maint" className="h4">{t.setMaintenance}</h2>
            <label className="check"><input type="checkbox" checked={maint} onChange={(e) => setS((x) => ({ ...x, maintenance: e.target.checked ? '1' : '0' }))} />{maint ? t.setMaintenanceOn : t.setMaintenanceOff}</label>
            {maint && <div className="field"><label htmlFor="set-mm">{t.setMaintenanceMsg}</label><textarea id="set-mm" className="textarea" rows={3} value={s.maintenanceMsg || ''} onChange={set('maintenanceMsg')} /></div>}
          </section>
          <div className="row" style={{ '--gap': '10px' }}>
            <button type="submit" className={`btn btn-primary ${flash && !dirty ? 'is-success' : ''}`} disabled={busy || (!dirty && !flash)} aria-busy={busy}>
              {busy ? <span className="spinner" aria-hidden="true" /> : flash && !dirty ? <Icon name="check" size={16} /> : null}{flash && !dirty ? (en ? 'Saved' : 'সংরক্ষিত') : t.setSave}
            </button>
            {dirty && <span className="small muted" role="status">{en ? 'Unsaved changes' : 'সংরক্ষণ করা হয়নি'}</span>}
          </div>
        </aside>
      </div>
    </form>
  );
}
