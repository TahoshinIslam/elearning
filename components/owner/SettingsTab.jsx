'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function SettingsTab() {
  const { t, api, showToast } = useApp();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.getSettings().then(setS).catch(() => setS({})); }, []);
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try { setS(await api.saveSettings(s)); showToast(t.setSaved); }
    catch { showToast(t.errGeneric); } finally { setBusy(false); }
  };

  if (!s) return <div className="anim-in"><div style={{ fontSize: 22, fontWeight: 700 }}>{t.settingsTitle}</div><div style={{ padding: 40, color: 'var(--faint)' }}>…</div></div>;
  const maint = s.maintenance === '1';

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.settingsTitle}</div>

      <div className="panel" style={{ padding: 24, maxWidth: 560 }}>
        <label className="label">{t.setSiteTitle}</label>
        <input value={s.siteTitle || ''} onChange={set('siteTitle')} style={{ ...fieldStyle, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div><label className="label">{t.setSupportPhone}</label><input value={s.supportPhone || ''} onChange={set('supportPhone')} style={fieldStyle} /></div>
          <div><label className="label">{t.setSupportEmail}</label><input value={s.supportEmail || ''} onChange={set('supportEmail')} style={fieldStyle} /></div>
        </div>
        <label className="label">{t.setSeo}</label>
        <textarea value={s.seoDescription || ''} onChange={set('seoDescription')} rows={2} style={{ ...fieldStyle, marginBottom: 18, resize: 'vertical' }} />

        {/* maintenance mode */}
        <div style={{ borderTop: '1.5px solid var(--line)', paddingTop: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700 }}>🚧 {t.setMaintenance}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{maint ? t.setMaintenanceOn : t.setMaintenanceOff}</div>
            </div>
            <button
              onClick={() => setS((x) => ({ ...x, maintenance: maint ? '0' : '1' }))}
              style={{ width: 52, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer', background: maint ? 'var(--brand)' : 'var(--line)', position: 'relative', transition: 'background .15s' }}
            >
              <span style={{ position: 'absolute', top: 3, left: maint ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
            </button>
          </div>
          {maint && <textarea value={s.maintenanceMsg || ''} onChange={set('maintenanceMsg')} rows={2} placeholder={t.setMaintenanceMsg} style={{ ...fieldStyle, resize: 'vertical' }} />}
        </div>

        <button className="btn-primary" style={{ borderRadius: 10 }} disabled={busy} onClick={save}>{busy ? '…' : t.setSave}</button>
      </div>
    </div>
  );
}
