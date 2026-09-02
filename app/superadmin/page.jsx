'use client';

import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import CareerAdmin from '@/components/superadmin/CareerAdmin';
import CourseReviewQueue from '@/components/superadmin/CourseReviewQueue';

function SuperAdminPageInner() {
  const { t, lang, tenants, toggleTenant, showToast } = useApp();

  const activeCount = tenants.filter((x) => x.status === 'active').length;
  const trialCount = tenants.filter((x) => x.status === 'trial').length;
  const mrrTotal = tenants.reduce((a, x) => a + Number(x.mrr), 0);

  const planStyle = (p) => ({
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 99,
    padding: '3px 11px',
    background: p === 'Pro' ? '#ff8a3d' : p === 'Basic' ? 'rgba(255,255,255,.14)' : 'rgba(124,58,237,.35)',
    color: p === 'Pro' ? 'var(--coal)' : '#fff'
  });

  const statusStyle = (st) => ({
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 99,
    padding: '4px 11px',
    background: st === 'active' ? 'rgba(14,159,110,.22)' : st === 'trial' ? 'rgba(124,58,237,.25)' : 'rgba(220,38,38,.25)',
    color: st === 'active' ? '#4ade80' : st === 'trial' ? '#c4b5fd' : '#fca5a5'
  });

  const statusLabel = (st) => (st === 'active' ? t.active : st === 'trial' ? t.trial : t.suspended);

  const handleToggle = async (tn) => {
    const updated = await toggleTenant(tn.id);
    if (!updated) return;
    showToast(
      lang === 'bn'
        ? updated.status === 'active' ? `${tn.name} আবার চালু হয়েছে` : `${tn.name} স্থগিত করা হয়েছে`
        : updated.status === 'active' ? `${tn.name} reactivated` : `${tn.name} suspended`
    );
  };

  const statCard = (label, value, color) => (
    <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>{label}</div>
      <div className="display" style={{ fontSize: 34, marginTop: 4, color }}>{value}</div>
    </div>
  );

  return (
    <>
    <SiteNav />
    <div className="anim-in" style={{ background: 'var(--coal)', minHeight: 'calc(100vh - 51px)', color: '#fff', padding: '30px 32px 90px' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.superT}</h2>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>{t.superS}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 14, marginBottom: 26 }}>
          {statCard(t.activeCenters, activeCount, '#ff8a3d')}
          {statCard('MRR', '৳' + mrrTotal.toLocaleString('en-IN'))}
          {statCard(t.trials, trialCount)}
          {statCard(t.churn, '2.1%')}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.4fr', gap: 10, padding: '12px 20px',
              fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.1)'
            }}
          >
            <div>{t.thCenter}</div><div>{t.thPlan}</div><div>{t.students}</div><div>MRR</div><div>{t.thStatus}</div>
          </div>

          {tenants.map((tn) => (
            <div
              key={tn.id}
              style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.4fr', gap: 10, padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,.07)', alignItems: 'center', fontSize: 14
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{tn.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{tn.sub}.leolearning.app</div>
              </div>
              <div><span style={planStyle(tn.plan)}>{tn.plan}</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{tn.students}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>৳{Number(tn.mrr).toLocaleString('en-IN')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={statusStyle(tn.status)}>{statusLabel(tn.status)}</span>
                <button
                  onClick={() => handleToggle(tn)}
                  style={{
                    border: '1px solid rgba(255,255,255,.25)', background: 'none', color: 'rgba(255,255,255,.8)',
                    borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 600
                  }}
                >
                  {tn.status === 'suspended' ? t.activate : t.suspend}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* course publishing oversight */}
        <CourseReviewQueue />

        {/* career portal management */}
        <CareerAdmin />
      </div>
    </div>
    </>
  );
}

export default function SuperAdminPage() {
  return <RoleGuard allow="superadmin"><SuperAdminPageInner /></RoleGuard>;
}
