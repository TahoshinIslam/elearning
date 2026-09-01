'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ROLES, ROLE_PERMISSIONS, STAFF_SECTIONS } from '@/lib/rbac';

const ROLE_CHIP = { superadmin: 'chip-orange', owner: 'chip-orange', teacher: 'chip-green', student: '' };

const fieldStyle = {
  border: '1px solid var(--field-line)', background: '#fff', borderRadius: 8,
  padding: '9px 11px', fontSize: 13.5, fontFamily: 'inherit', width: '100%'
};

export default function UsersTab() {
  const { t, api, showToast, auth } = useApp();
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', sections: ['dash', 'classes', 'attendance', 'submissions', 'quizzes'] });

  // label for a dashboard section key
  const secLabel = (k) => ({ dash: t.dash, students: t.students, classes: t.tClasses, attendance: t.tAttendance, submissions: t.tSubmissions, quizzes: t.tQuizzes, announce: t.announce }[k] || k);

  const load = () => api.getUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const changeRole = async (u, role) => { setUsers(await api.setUserRole(u.id, role)); showToast(t.userRoleChanged); };
  const toggleStatus = async (u) => setUsers(await api.setUserStatus(u.id, u.status === 'disabled' ? 'active' : 'disabled'));

  const toggleFormSection = (k) => setF((s) => ({ ...s, sections: s.sections.includes(k) ? s.sections.filter((x) => x !== k) : [...s.sections, k] }));
  const createStaff = async () => {
    if (!f.name.trim() || !f.email.trim() || f.password.length < 6) { showToast(t.staffInvalid); return; }
    try {
      await api.createStaff({ name: f.name.trim(), email: f.email.trim(), password: f.password, sections: f.sections });
      setF({ name: '', email: '', password: '', sections: ['dash', 'classes', 'attendance', 'submissions', 'quizzes'] });
      await load();
      showToast(t.staffCreated);
    } catch (e) { showToast(e?.data?.error === 'email_taken' ? t.emailTaken : t.errGeneric); }
  };

  // toggle one section on an existing teacher and persist
  const toggleUserSection = async (u, k) => {
    const cur = (u.sections || '').split(',').map((x) => x.trim()).filter(Boolean);
    const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
    setUsers(await api.setUserSections(u.id, next));
    showToast(t.sectionsSaved);
  };

  return (
    <div className="anim-in">
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t.userMgmt}</div>

      {/* create teacher (staff) account */}
      <div className="panel" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>➕ {t.staffCreate}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 10, marginBottom: 12 }}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t.contactName} style={fieldStyle} />
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t.emailLabel} style={fieldStyle} />
          <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} type="password" placeholder={t.staffPass} style={fieldStyle} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>{t.staffSections}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {STAFF_SECTIONS.map((k) => {
            const on = f.sections.includes(k);
            return (
              <button key={k} type="button" onClick={() => toggleFormSection(k)}
                className={`chip ${on ? 'chip-green' : ''}`} style={{ cursor: 'pointer', border: on ? 'none' : '1.5px solid var(--line)' }}>
                {on ? '✓ ' : ''}{secLabel(k)}
              </button>
            );
          })}
        </div>
        <button className="btn-primary" style={{ borderRadius: 9 }} onClick={createStaff}>{t.staffCreateBtn}</button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.5fr .9fr .8fr auto', gap: 10, padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--faint)', borderBottom: '1.5px solid var(--line)' }}>
          <div>{t.contactName}</div><div>{t.emailLabel}</div><div>{t.userRole}</div><div>{t.userStatus}</div><div />
        </div>
        {users.map((u) => {
          const self = u.id === auth?.id;
          return (
            <div key={u.id} className="row-line" style={{ padding: '12px 18px', fontSize: 13.5 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.5fr .9fr .8fr auto', gap: 10, alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                <div>
                  <select value={u.role} disabled={self} onChange={(e) => changeRole(u, e.target.value)}
                    style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '5px 8px', fontSize: 12.5, fontFamily: 'inherit', background: '#fff' }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><span className={`chip ${u.status === 'disabled' ? '' : 'chip-green'}`} style={{ border: u.status === 'disabled' ? '1.5px solid var(--line)' : 'none' }}>{u.status === 'disabled' ? t.userDisabled : t.userActive}</span></div>
                <div>
                  {!self && (
                    <button onClick={() => toggleStatus(u)} className="chip" style={{ cursor: 'pointer', border: '1.5px solid var(--line)', color: u.status === 'disabled' ? 'var(--green)' : 'var(--danger,#c92a2a)' }}>
                      {u.status === 'disabled' ? t.userEnable : t.userDisable}
                    </button>
                  )}
                </div>
              </div>

              {/* per-teacher section grants */}
              {u.role === 'teacher' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingLeft: 2 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)', alignSelf: 'center' }}>{t.staffSections}:</span>
                  {STAFF_SECTIONS.map((k) => {
                    const on = (u.sections || '').split(',').map((x) => x.trim()).includes(k);
                    return (
                      <button key={k} type="button" onClick={() => toggleUserSection(u, k)}
                        className={`chip ${on ? 'chip-green' : ''}`} style={{ cursor: 'pointer', fontSize: 11, border: on ? 'none' : '1.5px solid var(--line)' }}>
                        {on ? '✓ ' : ''}{secLabel(k)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* read-only RBAC permission matrix */}
      <div style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>{t.rbacTitle}</div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>{t.rbacNote}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(230px,100%),1fr))', gap: 12 }}>
        {ROLES.map((r) => (
          <div key={r} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 8 }}>{r}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(ROLE_PERMISSIONS[r] || []).map((p) => (
                <span key={p} className="mono" style={{ fontSize: 10.5, fontWeight: 600, background: p === '*:*' ? 'var(--brand-wash)' : 'var(--line-softer)', color: p === '*:*' ? 'var(--brand-deep)' : 'var(--ink-soft)', borderRadius: 6, padding: '2px 7px' }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
