'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import CourseMenu from '@/components/CourseMenu';

const DEMO_CATS = [
  { id: 'all', bn: 'সব', en: 'All' },
  { id: 'phy', bn: 'ফিজিক্স', en: 'Physics' },
  { id: 'math', bn: 'গণিত', en: 'Math' },
  { id: 'chem', bn: 'কেমিস্ট্রি', en: 'Chemistry' }
];

const DEMO_CLASSES = [
  { cat: 'phy', title: 'ভেক্টর: এক ক্লাসে বেসিক ক্লিয়ার', date: 'শুক্রবার, ৪ জুলাই · রাত ৯:০০' },
  { cat: 'math', title: 'ক্যালকুলাস শুরুর আগে যা জানতেই হবে', date: 'শনিবার, ৫ জুলাই · রাত ৮:০০' },
  { cat: 'chem', title: 'জৈব রসায়ন: ভয় নয়, মজায় শিখি', date: 'রবিবার, ৬ জুলাই · রাত ৯:০০' },
  { cat: 'phy', title: 'নিউটনের সূত্র দিয়ে সমস্যা সমাধান', date: 'সোমবার, ৭ জুলাই · রাত ৯:০০' }
];

const TESTIMONIALS = [
  { name: 'সুমাইয়া ইসলাম', batch: 'HSC ফিজিক্স — ব্যাচ ২', c: '#E8590C', quote: 'ছোট গ্রুপে পড়ানোর কারণে প্রতিটা প্রশ্ন করার সুযোগ পেয়েছি। মডেল টেস্টগুলোই আমার A+ এর আসল কারণ।' },
  { name: 'রাকিব হাসান', batch: 'SSC গণিত — ব্যাচ ৪', c: '#1D4ED8', quote: 'ক্লাস মিস করলেও রেকর্ডিং দেখে কভার করতে পারতাম। স্যারদের সাপোর্ট ছিল অসাধারণ।' },
  { name: 'নুসরাত জাহান', batch: 'ভর্তি প্রস্তুতি — ব্যাচ ১', c: '#0E9F6E', quote: 'প্রতি সপ্তাহের টেস্টের র‍্যাংকিং দেখে নিজের দুর্বলতা বুঝতে পারতাম। ভার্সিটিতে চান্স পাওয়ার পেছনে এই ব্যাচের অবদান অনেক।' }
];

const TRUST_CHIPS = ['সিটি কলেজ', 'মডেল হাই স্কুল', 'আইডিয়াল একাডেমি', 'ল্যাব স্কুল'];

const FEATURE_COLORS = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED', '#DB2777', '#D97706'];

export default function LandingPage() {
  const { t, lang, centerDisplay, slug, brandColor, showToast, courses, batches } = useApp();
  const [demoCat, setDemoCat] = useState('all');
  const router = useRouter();

  const enroll = () => showToast(lang === 'bn' ? 'ভর্তি ফর্ম খুলছে… (ডেমো)' : 'Opening enrollment form… (demo)');
  const goEnroll = () => router.push('/login?role=student');

  // only PUBLISHED courses appear on the public site (step 3: publish → website)
  const listings = batches
    .filter((b) => b.courseId != null)
    .map((b) => ({ batch: b, course: courses.find((c) => c.id === b.courseId) }))
    .filter((x) => x.course && x.course.published);
  const demoRows = DEMO_CLASSES.filter((c) => demoCat === 'all' || c.cat === demoCat);
  const features = [t.f1, t.f2, t.f3, t.f4, t.f5, t.f6];

  return (
    <div className="anim-in">
      {/* platform navbar (public + logged-in states) */}
      <SiteNav />

      {/* hero */}
      <div style={{ maxWidth: 1280, margin: '22px auto 0', padding: '0 20px' }}>
        <div style={{ background: `linear-gradient(135deg,#fff 40%,${brandColor}14)`, border: '1.5px solid var(--line)', borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 44, alignItems: 'center', padding: '60px 56px' }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', background: `${brandColor}1A`, color: brandColor, borderRadius: 99, padding: '6px 14px' }}>
                {t.admissionOpen}
              </div>
              <h1 style={{ margin: '16px 0 0', fontSize: 'clamp(34px,4.8vw,56px)', lineHeight: 1.15, fontWeight: 700 }}>
                {t.landH1} <span style={{ color: brandColor }}>{t.landH1b}</span>
              </h1>
              <p style={{ margin: '18px 0 0', color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1.65, maxWidth: 500 }}>{t.landingSub}</p>
              <button
                onClick={enroll}
                style={{ marginTop: 30, border: 'none', background: brandColor, color: '#fff', borderRadius: 14, padding: '17px 38px', fontSize: 17.5, fontWeight: 800, fontFamily: 'inherit' }}
              >
                {t.startLearning} →
              </button>

              <div style={{ marginTop: 30, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t.trustLine}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {TRUST_CHIPS.map((n) => (
                  <span key={n} style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', background: 'var(--line-softer)', borderRadius: 99, padding: '5px 13px' }}>{n}</span>
                ))}
              </div>
            </div>
            <div className="placeholder-art" style={{ alignSelf: 'stretch', minHeight: 320, borderRadius: 16 }}>hero banner · 640×480</div>
          </div>
        </div>
      </div>

      {/* promo strip */}
      <div style={{ maxWidth: 1280, margin: '18px auto 0', padding: '0 20px' }}>
        <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t.promoT}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.62)', marginTop: 2 }}>{t.promoS}</div>
          </div>
          <button
            onClick={enroll}
            style={{ border: 'none', background: brandColor, color: '#fff', borderRadius: 11, padding: '12px 22px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {t.seeDetails} →
          </button>
        </div>
      </div>

      {/* course categories — two-panel browser */}
      <div style={{ maxWidth: 1280, margin: '44px auto 0', padding: '0 20px' }}>
        <div className="panel" style={{ padding: '28px 30px' }}>
          <CourseMenu
            t={t}
            lang={lang}
            courses={courses}
            variant="section"
            onNavigate={(path) => router.push(path)}
          />
        </div>
      </div>

      {/* upcoming batches — real PUBLISHED courses only */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 20px 8px' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 34, fontWeight: 700, textAlign: 'center' }}>{t.upcomingBatches}</h2>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <button onClick={() => router.push('/courses')} style={{ border: 'none', background: 'none', color: 'var(--brand-deep)', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
            {t.browseAll} →
          </button>
        </div>
        {listings.length === 0 ? (
          <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--faint)' }}>{t.landComingSoon}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {listings.map(({ batch, course }) => (
              <div
                key={batch.id}
                className="card"
                onClick={() => router.push(`/course/${course.slug}`)}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              >
                <div className="placeholder-art" style={{ height: 120, fontSize: 11 }}>{course.thumb || 'course'} · banner</div>
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag chip-stone">{batch.name}</span>
                    <span className="tag chip-orange">{batch.students} {t.enrolledCount}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.4 }}>{course.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{batch.time}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                    <div className="display" style={{ fontSize: 18 }}>
                      ৳{batch.fee}
                      <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>/{t.month}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/course/${course.slug}`); }}
                      style={{ border: 'none', background: brandColor, color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit' }}
                    >
                      {t.cdViewDetails}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* free demo classes (dark band) */}
      <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 20px' }}>
        <div style={{ background: 'var(--coal)', borderRadius: 22, padding: '36px 28px', color: '#fff' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 30, fontWeight: 700, textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#dc2626', borderRadius: 6, padding: '3px 9px', verticalAlign: 'middle', letterSpacing: '.06em', marginRight: 10 }}>LIVE</span>
            {t.freeDemoT}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 22 }}>
            {DEMO_CATS.map((c) => (
              <button key={c.id} className={`pill-tab-dark ${demoCat === c.id ? 'active' : ''}`} onClick={() => setDemoCat(c.id)}>
                {lang === 'bn' ? c.bn : c.en}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
            {demoRows.map((dc, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', color: 'var(--ink)' }}>
                <div
                  style={{
                    height: 104,
                    background: 'repeating-linear-gradient(45deg,#2a2620,#2a2620 10px,#3b352c 10px,#3b352c 20px)',
                    display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.55)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, position: 'relative'
                  }}
                >
                  class thumbnail
                  <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, background: '#fff', color: '#b91c1c', borderRadius: 99, padding: '3px 9px' }}>
                    <span className="live-dot" />{t.liveWord}
                  </span>
                </div>
                <div style={{ padding: '13px 15px 15px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.45 }}>{dc.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--brand-deep)', fontWeight: 600, marginTop: 6 }}>{dc.date}</div>
                  <button
                    onClick={enroll}
                    style={{ marginTop: 12, width: '100%', border: '1.5px solid var(--line)', background: 'var(--paper)', borderRadius: 9, padding: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}
                  >
                    {t.seeDetails} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* what you get */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 20px 0' }}>
        <h2 style={{ margin: '0 0 22px', fontSize: 30, fontWeight: 700, textAlign: 'center' }}>{t.whatYouGet}</h2>
        <div className="panel" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
          {features.map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 24px', borderBottom: '1px solid var(--line-soft)', borderRight: '1px solid var(--line-soft)' }}>
              <div style={{ width: 12, height: 12, flex: 'none', borderRadius: 4, background: FEATURE_COLORS[i] }} />
              <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* stats band */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {[
            { v: '1,240+', l: t.stat1, bg: '#e4f5ea' },
            { v: '92%', l: t.stat2, bg: '#e8eefb' },
            { v: '12', l: t.stat3, bg: '#fdede2' },
            { v: '8', l: t.stat4, bg: '#fbf3d9' }
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 16, padding: 24 }}>
              <div className="display" style={{ fontSize: 34 }}>{s.v}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* testimonials */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 20px 8px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, textAlign: 'center' }}>{t.testiT}</h2>
        <p style={{ margin: '0 0 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>{t.testiS}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, alignItems: 'start' }}>
          {TESTIMONIALS.map((ts, i) => (
            <div key={i} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#44403c' }}>&ldquo;{ts.quote}&rdquo;</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                <div className="avatar" style={{ width: 36, height: 36, background: ts.c + '22', color: ts.c, fontSize: 14 }}>{ts.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ts.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{ts.batch}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* contact */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 20px 0' }}>
        <div style={{ background: 'var(--coal)', color: '#fff', borderRadius: 18, padding: '26px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{t.contactT}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{t.contactS}</div>
          </div>
          <a
            href="tel:01712334455"
            style={{ textDecoration: 'none', background: brandColor, color: '#fff', borderRadius: 12, padding: '13px 24px', fontSize: 15, fontWeight: 700 }}
          >
            📞 01712-334455
          </a>
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: '1.5px solid var(--line)', marginTop: 44, background: 'var(--field)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 20px 40px', display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1.4, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: brandColor, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 }}>
                {centerDisplay[0]}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>{centerDisplay}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.7 }}>{t.footAddr}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--faint)', letterSpacing: '.06em', marginBottom: 10 }}>{t.quickLinks}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
              <span>{t.upcomingBatches}</span>
              <span>{t.freeDemoT}</span>
              <span>{t.contactT}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 170 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--faint)', letterSpacing: '.06em', marginBottom: 10 }}>{t.contactT}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
              <span>01712-334455</span>
              <span className="mono" style={{ fontSize: 12 }}>{slug}@leolearning.app</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '0 20px 26px', fontSize: 12, color: 'var(--faint)' }}>
          Powered by <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--muted)' }}>LEO LEARNING</span>
        </div>
      </div>
    </div>
  );
}
