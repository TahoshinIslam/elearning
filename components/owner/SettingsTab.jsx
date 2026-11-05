'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { useFlash } from '@/components/ui/motion';

const BADGE_DEFAULTS = { badgeTopRatedMin: '4.5', badgeTopRatedReviews: '10', badgeNewDays: '30' };

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

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

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 40 * 1024) { showToast(en ? 'The logo must be under 40 KB.' : 'লোগো ৪০ কেবি-র কম হতে হবে।', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setS((x) => ({ ...x, poweredByLogo: reader.result }));
    reader.readAsDataURL(file);
  };

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

          <section className="surface surface-pad stack" aria-labelledby="set-footer">
            <h2 id="set-footer" className="h4">{en ? 'Footer' : 'ফুটার'}</h2>
            <p className="small muted">{en ? '{year} becomes the current year and {name} the site title.' : '{year} বর্তমান বছর এবং {name} সাইটের নাম হয়ে দেখাবে।'}</p>
            <div className="form-grid">
              <div className="field"><label htmlFor="set-copy-bn">{en ? 'Copyright (Bangla)' : 'কপিরাইট (বাংলা)'}</label><input id="set-copy-bn" className="input" value={s.footerCopyrightBn || ''} onChange={set('footerCopyrightBn')} maxLength={200} /></div>
              <div className="field"><label htmlFor="set-copy-en">{en ? 'Copyright (English)' : 'কপিরাইট (ইংরেজি)'}</label><input id="set-copy-en" className="input" value={s.footerCopyright || ''} onChange={set('footerCopyright')} maxLength={200} /></div>
              <div className="field"><label htmlFor="set-pow-bn">{en ? 'Powered by text (Bangla)' : 'পাওয়ার্ড বাই লেখা (বাংলা)'}</label><input id="set-pow-bn" className="input" value={s.poweredByTextBn || ''} onChange={set('poweredByTextBn')} maxLength={60} /></div>
              <div className="field"><label htmlFor="set-pow-en">{en ? 'Powered by text (English)' : 'পাওয়ার্ড বাই লেখা (ইংরেজি)'}</label><input id="set-pow-en" className="input" value={s.poweredByText || ''} onChange={set('poweredByText')} maxLength={60} /></div>
            </div>
            <div className="field"><label htmlFor="set-pow-url">{en ? 'Powered by link' : 'পাওয়ার্ড বাই লিংক'}</label><input id="set-pow-url" className="input" type="url" value={s.poweredByUrl || ''} onChange={set('poweredByUrl')} /></div>
            <div className="field">
              <label htmlFor="set-pow-logo">{en ? 'Powered by logo' : 'পাওয়ার্ড বাই লোগো'}</label>
              {/* The footer is dark: the preview sits on the same colour. eslint-disable-next-line @next/next/no-img-element */}
              {s.poweredByLogo ? <img src={s.poweredByLogo} alt="" style={{ height: 40, width: 'auto', padding: 8, borderRadius: 0, background: '#1C1917' }} /> : null}
              <input id="set-pow-logo" type="file" accept="image/png,image/webp" onChange={pickLogo} />
              <p className="help">{en ? 'PNG or WebP with a transparent background and light text, under 40 KB.' : 'স্বচ্ছ ব্যাকগ্রাউন্ড ও হালকা রঙের লেখাসহ PNG বা WebP, ৪০ কেবি-র কম।'}</p>
              {s.poweredByLogo ? <button type="button" className="btn btn-sm" style={{ width: 'fit-content' }} onClick={() => setS((x) => ({ ...x, poweredByLogo: '' }))}>{en ? 'Remove logo' : 'লোগো সরান'}</button> : null}
            </div>
          </section>

          <section className="surface surface-pad stack" aria-labelledby="set-social">
            <h2 id="set-social" className="h4">{en ? 'Social & chat' : 'সোশ্যাল ও চ্যাট'}</h2>
            <p className="small muted">{en ? 'Shown as icons in the footer. Leave a field empty to hide it. Links must start with https://' : 'ফুটারে আইকন হিসেবে দেখাবে। ফাঁকা রাখলে দেখাবে না। লিংক https:// দিয়ে শুরু হতে হবে।'}</p>
            <div className="form-grid">
              {[
                ['socialFacebook', 'facebook', 'Facebook page', 'https://facebook.com/yourpage'],
                ['socialMessenger', 'messenger', 'Messenger', 'https://m.me/yourpage'],
                ['socialYoutube', 'youtube', 'YouTube', 'https://youtube.com/@channel'],
                ['socialInstagram', 'instagram', 'Instagram', 'https://instagram.com/handle'],
                ['socialLinkedin', 'linkedin', 'LinkedIn', 'https://linkedin.com/company/…'],
                ['socialTiktok', 'tiktok', 'TikTok', 'https://tiktok.com/@handle'],
                ['socialTelegram', 'telegram', 'Telegram', 'https://t.me/channel']
              ].map(([key, icon, label, ph]) => (
                <div key={key} className="field">
                  <label htmlFor={`set-${key}`} className="row" style={{ '--gap': '6px' }}><Icon name={icon} size={16} />{label}</label>
                  <input id={`set-${key}`} className="input" type="url" inputMode="url" pattern="https://.+" placeholder={ph} value={s[key] || ''} onChange={set(key)} maxLength={300}
                    title={en ? 'A full link starting with https://' : 'https:// দিয়ে শুরু পূর্ণ লিংক'} />
                </div>
              ))}
              <div className="field">
                <label htmlFor="set-wa" className="row" style={{ '--gap': '6px' }}><Icon name="whatsapp" size={16} />{en ? 'WhatsApp number' : 'হোয়াটসঅ্যাপ নম্বর'}</label>
                <input id="set-wa" className="input" type="tel" inputMode="tel" pattern="\+?[0-9][0-9 \-]{6,18}" placeholder="+8801712345678" value={s.socialWhatsapp || ''} onChange={set('socialWhatsapp')}
                  title={en ? 'Digits with an optional + country code' : 'অঙ্ক, চাইলে শুরুতে + দেশের কোড'} />
              </div>
              <div className="field">
                <label htmlFor="set-chat">{en ? 'Floating chat button' : 'ভাসমান চ্যাট বাটন'}</label>
                <select id="set-chat" className="select" value={s.chatButton || 'off'} onChange={set('chatButton')}>
                  <option value="off">{en ? 'Hidden' : 'দেখাবে না'}</option>
                  <option value="whatsapp" disabled={!s.socialWhatsapp}>WhatsApp</option>
                  <option value="messenger" disabled={!s.socialMessenger}>Messenger</option>
                </select>
              </div>
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
            {maint && (
              <>
                <div className="field"><label htmlFor="set-mt">{en ? 'Headline' : 'শিরোনাম'}</label><input id="set-mt" className="input" maxLength={120} value={s.maintenanceTitle || ''} onChange={set('maintenanceTitle')} placeholder={en ? 'We’re upgrading the classroom' : 'আমরা ক্লাসরুম আপগ্রেড করছি'} /></div>
                <div className="field"><label htmlFor="set-mm">{t.setMaintenanceMsg}</label><textarea id="set-mm" className="textarea" rows={3} value={s.maintenanceMsg || ''} onChange={set('maintenanceMsg')} /></div>
                <div className="field">
                  <label htmlFor="set-mu">{en ? 'Back online at (countdown)' : 'আবার চালু হবে (কাউন্টডাউন)'}</label>
                  <input id="set-mu" className="input" type="datetime-local" value={toLocalInput(s.maintenanceUntil)} onChange={(e) => setS((x) => ({ ...x, maintenanceUntil: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                  <div className="cluster" style={{ '--gap': '6px' }}>
                    {[[15, en ? '+15 min' : '+১৫ মিনিট'], [60, en ? '+1 hour' : '+১ ঘণ্টা'], [240, en ? '+4 hours' : '+৪ ঘণ্টা'], [1440, en ? '+1 day' : '+১ দিন']].map(([m, l]) => (
                      <button key={m} type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => setS((x) => ({ ...x, maintenanceUntil: new Date(Date.now() + m * 60000).toISOString() }))}>{l}</button>
                    ))}
                    {s.maintenanceUntil && <button type="button" className="btn btn-ghost btn-sm" data-confirm="off" onClick={() => setS((x) => ({ ...x, maintenanceUntil: '' }))}>{en ? 'No timer' : 'টাইমার ছাড়া'}</button>}
                  </div>
                  <span className="help">{en ? 'Visitors see a live countdown; the site reopens by itself at this time. Staff can still sign in and work.' : 'দর্শকরা লাইভ কাউন্টডাউন দেখবেন; এই সময়ে সাইট নিজে থেকেই খুলে যাবে। স্টাফরা লগইন করে কাজ করতে পারবেন।'}</span>
                </div>
              </>
            )}
          </section>
          <section className="surface surface-pad stack" aria-labelledby="set-pre">
            <h2 id="set-pre" className="h4">{en ? 'Loading animation' : 'লোডিং অ্যানিমেশন'}</h2>
            <label className="check"><input type="checkbox" checked={s.preloader !== 'off'} onChange={(e) => setS((x) => ({ ...x, preloader: e.target.checked ? 'on' : 'off' }))} />{en ? 'Show the logo splash when a visitor opens the site (once per visit)' : 'সাইট খোলার সময় লোগো অ্যানিমেশন দেখাবে (প্রতি ভিজিটে একবার)'}</label>
            <span className="help">{en ? 'Page-to-page navigation always shows a slim progress bar.' : 'এক পেজ থেকে আরেক পেজে যাওয়ার সময় সবসময় একটি সরু প্রগ্রেস বার দেখায়।'}</span>
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
