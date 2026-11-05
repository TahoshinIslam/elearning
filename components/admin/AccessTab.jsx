'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import Dialog from '@/components/ui/Dialog';
import { useAdminData, send } from '@/components/owner/useAdminData';
import { sectionText, ADMIN_GROUPS } from '@/components/owner/adminNav';
import { GRANTABLE_SECTIONS, parseGrants } from '@/lib/rbac';
import { num } from '@/lib/copy';

const L = {
  bn: {
    intro: 'কে কোন সেকশন দেখতে পারবে (দেখা) আর কোথায় যোগ / এডিট / মুছতে পারবে (পরিচালনা) — এখান থেকে ঠিক করুন। পরিবর্তন সঙ্গে সঙ্গে কার্যকর হয়; আবার লগইন করতে হয় না।',
    create: 'নতুন অ্যাকাউন্ট', name: 'নাম', email: 'ইমেইল', phone: 'ফোন (ঐচ্ছিক)', password: 'অস্থায়ী পাসওয়ার্ড', gen: 'তৈরি করুন', role: 'ভূমিকা', save: 'অ্যাকাউন্ট তৈরি করুন',
    roles: { student: 'শিক্ষার্থী', teacher: 'শিক্ষক', staff: 'স্টাফ (অফিস)', owner: 'মালিক / অ্যাডমিন', superadmin: 'সুপারঅ্যাডমিন' },
    roleDesc: { student: 'নিজের কোর্স ও অগ্রগতি', teacher: 'ক্লাস নেন; যে সেকশন দেবেন শুধু সেগুলো', staff: 'অফিস / হিসাব / সাপোর্ট; যে সেকশন দেবেন শুধু সেগুলো', owner: 'পুরো অ্যাডমিন প্যানেল', superadmin: 'সব সেন্টার ও প্ল্যাটফর্ম' },
    none: 'নেই', view: 'দেখা', manage: 'পরিচালনা', presets: 'প্রিসেট', preset: { teacher: 'শিক্ষক', accounts: 'হিসাব', content: 'কনটেন্ট এডিটর', support: 'সাপোর্ট', clear: 'সব বাদ' },
    staffList: 'স্টাফ ও শিক্ষক', matrix: 'কে কী পারে', edit: 'অনুমতি এডিট', disable: 'নিষ্ক্রিয় করুন', enable: 'সক্রিয় করুন', revoke: 'সব ডিভাইস থেকে লগআউট',
    saveGrants: 'অনুমতি সংরক্ষণ', disabled: 'নিষ্ক্রিয়', noStaff: 'এখনো কোনো স্টাফ বা শিক্ষক অ্যাকাউন্ট নেই।', users: (n) => `${n} জন`, owners: 'সব সেকশন', nothing: 'কোনো সেকশন দেওয়া হয়নি',
    errs: { name: 'নাম লিখুন', email: 'সঠিক ইমেইল দিন', password: 'কমপক্ষে ৮ অক্ষর', email_taken: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে', forbidden_role: 'এই ভূমিকা তৈরির অনুমতি নেই' }
  },
  en: {
    intro: 'Decide who can see a section (View) and who can add / edit / delete in it (Manage). Changes apply immediately — nobody has to sign in again.',
    create: 'New account', name: 'Name', email: 'Email', phone: 'Phone (optional)', password: 'Temporary password', gen: 'Generate', role: 'Role', save: 'Create account',
    roles: { student: 'Student', teacher: 'Teacher', staff: 'Staff (office)', owner: 'Owner / admin', superadmin: 'Superadmin' },
    roleDesc: { student: 'Their own courses and progress', teacher: 'Teaches; only the sections you grant', staff: 'Office / accounts / support; only the sections you grant', owner: 'The whole admin panel', superadmin: 'Every centre and the platform' },
    none: 'None', view: 'View', manage: 'Manage', presets: 'Presets', preset: { teacher: 'Teacher', accounts: 'Accounts', content: 'Content editor', support: 'Support', clear: 'Clear all' },
    staffList: 'Staff & teachers', matrix: 'Who can do what', edit: 'Edit access', disable: 'Disable', enable: 'Enable', revoke: 'Sign out everywhere',
    saveGrants: 'Save access', disabled: 'Disabled', noStaff: 'No staff or teacher accounts yet.', users: (n) => `${n}`, owners: 'All sections', nothing: 'No sections granted',
    errs: { name: 'Enter a name', email: 'Enter a valid email', password: 'At least 8 characters', email_taken: 'An account with this email already exists', forbidden_role: 'You can’t create this role' }
  }
};

const PRESETS = {
  teacher: { dash: 'view', students: 'view', classes: 'manage', attendance: 'manage', submissions: 'manage', quizzes: 'manage', announce: 'manage' },
  accounts: { dash: 'view', analytics: 'view', payments: 'manage', fees: 'manage', coupons: 'view', offers: 'view', reports: 'view', students: 'view' },
  content: { dash: 'view', courses: 'manage', categories: 'manage', levels: 'manage', paths: 'manage', blog: 'manage', homepage: 'manage', campaigns: 'manage' },
  support: { dash: 'view', students: 'view', enroll: 'manage', messages: 'manage', reviews: 'manage', activity: 'view' }
};

const genPassword = () => {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(r, (b) => a[b % a.length]).join('');
};

// Section × level picker, grouped like the sidebar.
function GrantMatrix({ grants, onChange, l, lang }) {
  const groups = ADMIN_GROUPS.map((g) => ({ ...g, items: g.items.filter((k) => GRANTABLE_SECTIONS.includes(k)) })).filter((g) => g.items.length);
  const set = (k, v) => { const next = { ...grants }; if (v === 'none') delete next[k]; else next[k] = v; onChange(next); };
  return (
    <div className="grant-matrix">
      <div className="cluster" style={{ '--gap': '6px' }}>
        <span className="small strong">{l.presets}:</span>
        {Object.keys(PRESETS).map((p) => <button key={p} type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => onChange({ ...PRESETS[p] })}>{l.preset[p]}</button>)}
        <button type="button" className="btn btn-ghost btn-sm" data-confirm="off" onClick={() => onChange({})}>{l.preset.clear}</button>
      </div>
      {groups.map((g) => (
        <fieldset key={g.key} className="grant-group">
          <legend>{lang === 'en' ? g.en : g.bn}</legend>
          {g.items.map((k) => {
            const st = sectionText(k, lang);
            const v = grants[k] || 'none';
            return (
              <div key={k} className={`grant-row is-${v}`}>
                <span className="grant-name"><Icon name={st.icon} size={15} />{st.label}</span>
                <div className="segmented" role="radiogroup" aria-label={st.label}>
                  {['none', 'view', 'manage'].map((lv) => (
                    <button key={lv} type="button" role="radio" aria-checked={v === lv} aria-pressed={v === lv} data-confirm="off" onClick={() => set(k, lv)}>{l[lv]}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

// Admin → Access: create accounts for this panel and decide, per person and
// per section, what they can see and do. Enforced on the server by
// requireStaffSection(section, level) in every admin API.
export default function AccessTab() {
  const { lang, auth } = useApp();
  const l = L[lang === 'en' ? 'en' : 'bn'];
  const users = useAdminData('/api/users');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'staff', grants: { ...PRESETS.support } });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const roleChoices = auth?.role === 'superadmin' ? ['staff', 'teacher', 'student', 'owner'] : ['staff', 'teacher', 'student'];

  const list = users.data || [];
  const staff = list.filter((u) => u.role === 'teacher' || u.role === 'staff');
  const counts = useMemo(() => list.reduce((a, u) => ({ ...a, [u.role]: (a[u.role] || 0) + 1 }), {}), [list]);

  const create = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = l.errs.name;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) er.email = l.errs.email;
    if (form.password.length < 8) er.password = l.errs.password;
    setErrs(er);
    if (Object.keys(er).length) { document.getElementById(`acc-${Object.keys(er)[0]}`)?.focus(); return; }
    setBusy(true);
    try {
      await send('/api/users', 'POST', { ...form, name: form.name.trim(), email: form.email.trim(), grants: ['teacher', 'staff'].includes(form.role) ? form.grants : undefined });
      setForm({ name: '', email: '', phone: '', password: '', role: form.role, grants: form.grants });
      users.reload();
    } catch (err) {
      setErrs({ form: l.errs[err.message] || err.message });
    } finally { setBusy(false); }
  };

  const patch = async (body) => { users.setData(await send('/api/users', 'PATCH', body)); };

  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <p className="notice notice-info"><Icon name="shield" size={18} />{l.intro}</p>

      <div className="kpi-grid">
        {['owner', 'staff', 'teacher', 'student'].map((r) => (
          <div key={r} className="kpi"><span className="kpi-label">{l.roles[r]}</span><span className="kpi-value">{num(lang, counts[r] || 0)}</span><span className="xsmall">{l.roleDesc[r]}</span></div>
        ))}
      </div>

      <section className="surface surface-pad stack" aria-labelledby="acc-new">
        <h2 id="acc-new" className="h4"><Icon name="plus" size={18} /> {l.create}</h2>
        <form className="stack" onSubmit={create} noValidate>
          <div className="form-grid">
            <div className="field"><label htmlFor="acc-name" className="req">{l.name}</label><input id="acc-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errs.name} />{errs.name && <span className="field-error">{errs.name}</span>}</div>
            <div className="field"><label htmlFor="acc-email" className="req">{l.email}</label><input id="acc-email" className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errs.email} />{errs.email && <span className="field-error">{errs.email}</span>}</div>
            <div className="field"><label htmlFor="acc-phone">{l.phone}</label><input id="acc-phone" className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label htmlFor="acc-password" className="req">{l.password}</label>
              <div className="row" style={{ '--gap': '6px' }}><input id="acc-password" className="input" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errs.password} /><button type="button" className="btn btn-secondary btn-sm" data-confirm="off" onClick={() => setForm({ ...form, password: genPassword() })}>{l.gen}</button></div>
              {errs.password && <span className="field-error">{errs.password}</span>}</div>
            <div className="field"><label htmlFor="acc-role">{l.role}</label>
              <select id="acc-role" className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, grants: e.target.value === 'teacher' ? { ...PRESETS.teacher } : form.grants })}>
                {roleChoices.map((r) => <option key={r} value={r}>{l.roles[r]}</option>)}
              </select>
              <span className="help">{l.roleDesc[form.role]}</span></div>
          </div>
          {['teacher', 'staff'].includes(form.role) && <GrantMatrix grants={form.grants} onChange={(g) => setForm({ ...form, grants: g })} l={l} lang={lang} />}
          {errs.form && <div className="notice notice-danger" role="alert"><Icon name="alert" size={18} />{errs.form}</div>}
          <div><button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />}<Icon name="plus" size={16} />{l.save}</button></div>
        </form>
      </section>

      <section className="stack" aria-labelledby="acc-matrix" style={{ '--gap': '10px' }}>
        <h2 id="acc-matrix" className="h4">{l.matrix}</h2>
        {users.loading && !users.data ? <div className="skeleton" style={{ height: 160 }} /> : !staff.length ? <p className="muted">{l.noStaff}</p> : (
          <div className="table-wrap">
            <table className="table access-table">
              <thead><tr><th>{l.staffList}</th>{GRANTABLE_SECTIONS.map((k) => <th key={k} title={sectionText(k, lang).label}><Icon name={sectionText(k, lang).icon} size={15} /><span className="sr-only">{sectionText(k, lang).label}</span></th>)}<th /></tr></thead>
              <tbody>
                {staff.map((u) => {
                  const g = parseGrants(u.sections);
                  return (
                    <tr key={u.id} className={u.status === 'disabled' ? 'is-disabled' : ''}>
                      <th scope="row"><div className="strong">{u.name}</div><div className="xsmall muted">{l.roles[u.role]} · {u.email}</div>{u.status === 'disabled' && <span className="badge badge-danger">{l.disabled}</span>}</th>
                      {GRANTABLE_SECTIONS.map((k) => (
                        <td key={k} className={`cell-${g[k] || 'none'}`} title={`${sectionText(k, lang).label}: ${l[g[k] || 'none']}`}>
                          {g[k] === 'manage' ? <Icon name="edit" size={14} label={l.manage} /> : g[k] === 'view' ? <Icon name="eye" size={14} label={l.view} /> : <span aria-label={l.none}>·</span>}
                        </td>
                      ))}
                      <td>
                        <div className="row" style={{ '--gap': '6px' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing({ ...u, grants: g })}><Icon name="shield" size={14} />{l.edit}</button>
                          <button type="button" className="btn btn-sm" onClick={() => patch({ id: u.id, status: u.status === 'disabled' ? 'active' : 'disabled' })} data-confirm={u.status === 'disabled' ? 'off' : `${l.disable}: ${u.name}`}>{u.status === 'disabled' ? l.enable : l.disable}</button>
                          <button type="button" className="btn btn-ghost btn-sm" data-confirm={`${l.revoke}: ${u.name}`} onClick={async () => { await send('/api/users', 'POST', { id: u.id, action: 'revoke_sessions' }); }}><Icon name="logout" size={14} /><span className="sr-only">{l.revoke}</span></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing ? `${l.edit} — ${editing.name}` : ''} wide
        footer={editing && (
          <>
            <button type="button" className="btn btn-secondary" data-confirm="off" onClick={() => setEditing(null)}>{lang === 'en' ? 'Cancel' : 'বাতিল'}</button>
            <button type="button" className="btn btn-primary" onClick={async () => { await patch({ id: editing.id, grants: editing.grants }); setEditing(null); }}><Icon name="check" size={16} />{l.saveGrants}</button>
          </>
        )}>
        {editing && <GrantMatrix grants={editing.grants} onChange={(g) => setEditing({ ...editing, grants: g })} l={l} lang={lang} />}
      </Dialog>
    </div>
  );
}
