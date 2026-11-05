'use client';

import { useApp } from '@/context/AppContext';
import RoleGuard from '@/components/RoleGuard';
import SiteNav from '@/components/SiteNav';
import CareerAdmin from '@/components/superadmin/CareerAdmin';
import CourseReviewQueue from '@/components/superadmin/CourseReviewQueue';
import AuditLogView from '@/components/superadmin/AuditLogView';
import ActionFeedback from '@/components/admin/ActionFeedback';
import AccessTab from '@/components/admin/AccessTab';
import ActivityTab from '@/components/admin/ActivityTab';

function SuperAdminPageInner() {
  const { t, lang, tenants, toggleTenant, showToast } = useApp();

  const activeCount = tenants.filter((x) => x.status === 'active').length;
  const trialCount = tenants.filter((x) => x.status === 'trial').length;
  const mrrTotal = tenants.reduce((a, x) => a + Number(x.mrr), 0);

  const planClass = (p) => `badge ${p === 'Pro' ? 'badge-brand' : p === 'Basic' ? '' : 'badge-info'}`;
  const statusClass = (st) => `badge ${st === 'active' ? 'badge-success' : st === 'trial' ? 'badge-info' : 'badge-danger'}`;

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

  const statCard = (label, value) => (
    <div className="surface stat-tile">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );

  return (
    <>
    <SiteNav />
    <main id="main" className="dash-main" style={{ maxWidth: 1600, marginInline: 'auto' }}>
      <div className="stack" style={{ '--gap': '28px' }}>
        <div className="ws-head">
          <span className="eyebrow"><span className="sticker sticker-cyan" style={{ fontSize: 13 }}>Superadmin</span></span>
          <h1 className="ws-title" style={{ marginTop: 14 }}>{t.superT}</h1>
          <p className="ws-desc">{t.superS}</p>
        </div>

        <div className="stat-tiles">
          {statCard(t.activeCenters, activeCount)}
          {statCard('MRR', '৳' + mrrTotal.toLocaleString('en-IN'))}
          {statCard(t.trials, trialCount)}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>{t.thCenter}</th><th>{t.thPlan}</th><th>{t.students}</th><th>MRR</th><th>{t.thStatus}</th></tr>
            </thead>
            <tbody>
              {tenants.map((tn) => (
                <tr key={tn.id}>
                  <td>
                    <div className="strong">{tn.name}</div>
                    <div className="mono xsmall muted">{tn.sub}.leolearning.app</div>
                  </td>
                  <td><span className={planClass(tn.plan)}>{tn.plan}</span></td>
                  <td className="display">{tn.students}</td>
                  <td className="display">৳{Number(tn.mrr).toLocaleString('en-IN')}</td>
                  <td>
                    <div className="cluster" style={{ '--gap': '10px' }}>
                      <span className={statusClass(tn.status)}>{statusLabel(tn.status)}</span>
                      <button type="button" className={`btn btn-sm ${tn.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`} onClick={() => handleToggle(tn)}>
                        {tn.status === 'suspended' ? t.activate : t.suspend}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="stack" aria-labelledby="sa-access" style={{ '--gap': '14px' }}>
          <h2 id="sa-access" className="h3">{lang === 'en' ? 'Accounts & access' : 'অ্যাকাউন্ট ও অনুমতি'}</h2>
          <AccessTab />
        </section>

        <section className="stack" aria-labelledby="sa-act" style={{ '--gap': '14px' }}>
          <h2 id="sa-act" className="h3">{lang === 'en' ? 'Recent activity' : 'সাম্প্রতিক কার্যক্রম'}</h2>
          <ActivityTab />
        </section>

        {/* course publishing oversight */}
        <CourseReviewQueue />

        {/* career portal management */}
        <CareerAdmin />

        {/* security/audit trail */}
        <AuditLogView />
      </div>
    </main>
    </>
  );
}

export default function SuperAdminPage() {
  return <RoleGuard allow="superadmin"><ActionFeedback><SuperAdminPageInner /></ActionFeedback></RoleGuard>;
}
