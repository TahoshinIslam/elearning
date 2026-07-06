'use client';

import { useApp } from '@/context/AppContext';
import { courseCompletion } from '@/lib/progress';

const STUDENT_ID = 1;

export default function ParentPage() {
  const { t, lang, centerDisplay, studentPaid, showToast, courses, enrollments, submissions, attendance } = useApp();

  // real attendance + completion for the monitored student (id 1) in course 1
  const course1 = courses.find((c) => c.id === 1);
  const comp = courseCompletion(STUDENT_ID, course1, { enrollments, submissions, attendance });
  const myAtt = attendance
    .filter((a) => a.studentId === STUDENT_ID)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const presentCount = myAtt.filter((a) => a.present).length;

  const tests = [
    { name: lang === 'bn' ? 'মডেল টেস্ট ৭' : 'Model Test 7', date: lang === 'bn' ? '২৫ জুন' : 'Jun 25', marks: '42/50', rank: lang === 'bn' ? '১২/৬৪' : '12/64' },
    { name: lang === 'bn' ? 'মডেল টেস্ট ৬' : 'Model Test 6', date: lang === 'bn' ? '১৮ জুন' : 'Jun 18', marks: '38/50', rank: lang === 'bn' ? '১৮/৬৪' : '18/64' },
    { name: lang === 'bn' ? 'সাপ্তাহিক কুইজ ১২' : 'Weekly Quiz 12', date: lang === 'bn' ? '১৪ জুন' : 'Jun 14', marks: '9/10', rank: lang === 'bn' ? '৫/৬৪' : '5/64' }
  ];

  const fees = [
    { month: lang === 'bn' ? 'জুলাই ২০২৬' : 'July 2026', amount: '1,500', paid: studentPaid },
    { month: lang === 'bn' ? 'জুন ২০২৬' : 'June 2026', amount: '1,500', paid: true },
    { month: lang === 'bn' ? 'মে ২০২৬' : 'May 2026', amount: '1,500', paid: true }
  ];

  const statCard = (label, node) => (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      {node}
    </div>
  );

  return (
    <div className="anim-in" style={{ minHeight: 'calc(100vh - 51px)', padding: '30px 20px 90px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: 52, height: 52, background: 'var(--brand)', color: '#fff', fontSize: 20 }}>তা</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', color: 'var(--brand)' }}>{t.parentT}</div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>তানভীর আহমেদ</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>HSC ফিজিক্স — ব্যাচ ৩ · {centerDisplay}</div>
          </div>
          <button className="btn-dark" style={{ borderRadius: 11, fontSize: 13.5 }} onClick={() => showToast(t.teacherMsg)}>
            {t.contactTeacher}
          </button>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
          {statCard(t.attendanceRate, <div className="display" style={{ fontSize: 32, marginTop: 4, color: 'var(--green)' }}>{comp.attendanceRate ?? 0}%</div>)}
          {statCard(t.completion, <div className="display" style={{ fontSize: 32, marginTop: 4, color: 'var(--brand)' }}>{comp.completion}%</div>)}
          {statCard(t.feeStatus, (
            <div style={{ marginTop: 12 }}>
              <span className={`chip ${studentPaid ? 'chip-green' : 'chip-orange'}`}>
                {studentPaid ? t.paid : t.due} · জুলাই
              </span>
            </div>
          ))}
          {statCard(t.classesThisMonth, (
            <div className="display" style={{ fontSize: 32, marginTop: 4 }}>
              {presentCount}<span style={{ fontSize: 15, color: 'var(--faint)' }}>/{myAtt.length}</span>
            </div>
          ))}
        </div>

        {/* tests + attendance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 20, alignItems: 'start' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>{t.recentTests}</div>
            {tests.map((pt, i) => (
              <div key={i} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{pt.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{pt.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontWeight: 800, fontSize: 15 }}>{pt.marks}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t.rankW}: {pt.rank}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>{t.attLog}</div>
            {myAtt.map((pa) => (
              <div key={pa.id} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                  {pa.title}
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 400 }}>{pa.date}</div>
                </div>
                <span className={`chip ${pa.present ? 'chip-green' : 'chip-red'}`}>{pa.present ? t.present : t.absent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* fee history */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ padding: '14px 20px', fontWeight: 700, fontSize: 15, borderBottom: '1.5px solid var(--line)' }}>{t.feeHistory}</div>
          {fees.map((pf, i) => (
            <div key={i} className="row-line" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{pf.month}</div>
              <div className="display" style={{ fontWeight: 800, fontSize: 14.5 }}>৳{pf.amount}</div>
              <span className={`chip ${pf.paid ? 'chip-green' : 'chip-orange'}`}>{pf.paid ? t.paid : t.due}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, background: 'var(--brand-wash)', border: '1px dashed #f2b28a',
            borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#9a3412', fontWeight: 600
          }}
        >
          ✉ {t.smsNote}
        </div>
      </div>
    </div>
  );
}
