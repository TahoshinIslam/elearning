'use client';

import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import CareerAdmin from '@/components/superadmin/CareerAdmin';
import CourseReviewQueue from '@/components/superadmin/CourseReviewQueue';
import AuditLogView from '@/components/superadmin/AuditLogView';

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
    background: p === 'Pro' ? 'var(--brand-tint)' : p === 'Basic' ? 'var(--surface-2)' : 'var(--info-tint)',
    color: p === 'Pro' ? 'var(--brand-ink)' : 'var(--ink-2)'
  });

  const statusStyle = (st) => ({
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 99,
    padding: '4px 11px',
    background: st === 'active' ? 'var(--success-tint)' : st === 'trial' ? 'var(--info-tint)' : 'var(--danger-tint)',
    color: st === 'active' ? '#14532D' : st === 'trial' ? '#1E3A8A' : '#7F1D1D'
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
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div className="display" style={{ fontSize: 34, marginTop: 4, color }}>{value}</div>
    </div>
  );

  return (
    <>
    <SiteNav />
    <div className="anim-in" style={{ minHeight: 'calc(100vh - var(--header-h))', padding: '30px 20px 90px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t.superT}</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.superS}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 14, marginBottom: 26 }}>
          {statCard(t.activeCenters, activeCount, 'var(--brand)')}
          {statCard('MRR', '৳' + mrrTotal.toLocaleString('en-IN'))}
          {statCard(t.trials, trialCount)}
                  </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.4fr', gap: 10, padding: '12px 20px',
              fontSize: 12, fontWeight: 700, color: 'var(--muted)', borderBottom: '1px solid var(--border)'
            }}
          >
            <div>{t.thCenter}</div><div>{t.thPlan}</div><div>{t.students}</div><div>MRR</div><div>{t.thStatus}</div>
          </div>

          {tenants.map((tn) => (
            <div
              key={tn.id}
              style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.4fr', gap: 10, padding: '14px 20px',
                borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 14
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{tn.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{tn.sub}.leolearning.app</div>
              </div>
              <div><span style={planStyle(tn.plan)}>{tn.plan}</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{tn.students}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>৳{Number(tn.mrr).toLocaleString('en-IN')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={statusStyle(tn.status)}>{statusLabel(tn.status)}</span>
                <button
                  onClick={() => handleToggle(tn)}
                  style={{
                    border: '1px solid var(--border)', background: 'none', color: 'var(--muted)',
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

        {/* security/audit trail */}
        <AuditLogView />
      </div>
    </div>
    </>
  );
}

export default function SuperAdminPage() {
  return <RoleGuard allow="superadmin"><SuperAdminPageInner /></RoleGuard>;
}
