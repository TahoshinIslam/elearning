'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import SiteNav from '@/components/SiteNav';
import CourseCategoryGrid from '@/components/CourseCategoryGrid';

const DEMO_CATS = [
  { id: 'all', bn: 'সব', en: 'All' },
  { id: 'phy', bn: 'ফিজিক্স', en: 'Physics' },
  { id: 'math', bn: 'গণিত', en: 'Math' },
  { id: 'chem', bn: 'কেমিস্ট্রি', en: 'Chemistry' }
];

const TESTIMONIALS = [
  { name: 'সুমাইয়া ইসলাম', batch: 'HSC ফিজিক্স — ব্যাচ ২', c: '#E8590C', quote: 'ছোট গ্রুপে পড়ানোর কারণে প্রতিটা প্রশ্ন করার সুযোগ পেয়েছি। মডেল টেস্টগুলোই আমার A+ এর আসল কারণ।' },
  { name: 'রাকিব হাসান', batch: 'SSC গণিত — ব্যাচ ৪', c: '#1D4ED8', quote: 'ক্লাস মিস করলেও রেকর্ডিং দেখে কভার করতে পারতাম। স্যারদের সাপোর্ট ছিল অসাধারণ।' },
  { name: 'নুসরাত জাহান', batch: 'ভর্তি প্রস্তুতি — ব্যাচ ১', c: '#0E9F6E', quote: 'প্রতি সপ্তাহের টেস্টের র‍্যাংকিং দেখে নিজের দুর্বলতা বুঝতে পারতাম। ভার্সিটিতে চান্স পাওয়ার পেছনে এই ব্যাচের অবদান অনেক।' }
];

const TRUST_CHIPS = ['সিটি কলেজ', 'মডেল হাই স্কুল', 'আইডিয়াল একাডেমি', 'ল্যাব স্কুল'];

const FEATURE_COLORS = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED', '#DB2777', '#D97706'];

const TESTI_COLORS = ['#E8590C', '#1D4ED8', '#0E9F6E', '#7C3AED', '#DB2777'];
const STAT_BG = ['#e4f5ea', '#e8eefb', '#fdede2', '#fbf3d9'];

export default function LandingPage() {
  const { t, lang, centerDisplay, slug, brandColor, showToast, courses, batches, api } = useApp();
  const [demoCat, setDemoCat] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [cms, setCms] = useState(null); // homepage CMS overrides (null until loaded)
  const [upcomingDemos, setUpcomingDemos] = useState([]);
  const [recordedDemos, setRecordedDemos] = useState([]);
  const router = useRouter();

  useEffect(() => { api.getHomepage().then(setCms).catch(() => setCms({})); }, []);
  useEffect(() => {
    api.getDemoClasses('upcoming').then(setUpcomingDemos).catch(() => {});
    api.getDemoClasses('recorded').then(setRecordedDemos).catch(() => {});
  }, []);

  // CMS overlays with fallback to the built-in defaults
  const hero = {
    badge: cms?.hero?.badge || t.admissionOpen,
    title: cms?.hero?.title || t.landH1,
    highlight: cms?.hero?.highlight || t.landH1b,
    subtitle: cms?.hero?.subtitle || t.landingSub
  };
  const testimonials = (cms?.testimonials?.length ? cms.testimonials : TESTIMONIALS)
    .map((ts, i) => ({ ...ts, c: ts.c || TESTI_COLORS[i % TESTI_COLORS.length] }));
  const partners = cms?.partners?.length ? cms.partners : TRUST_CHIPS;
  const stats = (cms?.stats?.length ? cms.stats : [
    { v: '1,240+', l: t.stat1 }, { v: '92%', l: t.stat2 }, { v: '12', l: t.stat3 }, { v: '8', l: t.stat4 }
  ]).map((s, i) => ({ ...s, bg: STAT_BG[i % STAT_BG.length] }));
  const faqs = cms?.faqs?.length ? cms.faqs : [];

  const goEnroll = () => router.push('/login?role=student');

  // only PUBLISHED courses appear on the public site (step 3: publish → website)
  const listings = batches
    .filter((b) => b.courseId != null)
    .map((b) => ({ batch: b, course: courses.find((c) => c.id === b.courseId) }))
    .filter((x) => x.course && x.course.published);
  const features = [t.f1, t.f2, t.f3, t.f4, t.f5, t.f6];

  // ---- items for the tabbed card grids ----
  const published = courses.filter((c) => c.published);
  const catLabel = (key) => t[`cat_${key}`] || key;
  const courseItems = published.map((c) => ({
    id: c.id, category: c.category || 'skills', thumb: c.thumb, title: c.title,
    learners: c.ratingCount || 0, price: c.price, free: c.price === 0,
    onClick: () => router.push(`/course/${c.slug}`)
  }));
  const demoCatLabel = (key) => ({ phy: 'ফিজিক্স', math: 'গণিত', chem: 'কেমিস্ট্রি' }[key] || key);
  // real free demo classes → each card opens its detail page (/demo/[slug])
  const upcomingItems = upcomingDemos.map((d) => ({
    id: `up-${d.id}`, category: d.category, thumb: 'class', title: d.title, subtitle: d.instructor, date: d.schedule,
    learners: d.learners, free: true, price: 0, onClick: () => router.push(`/demo/${d.slug}`)
  }));
  const recordedItems = recordedDemos.map((d) => ({
    id: `rec-${d.id}`, category: d.category, thumb: 'class', title: d.title,
    learners: d.learners, free: true, price: 0, onClick: () => router.push(`/demo/${d.slug}`)
  }));

  return (
    <div className="anim-in">
      {/* platform navbar (public + logged-in states) */}
      <SiteNav />

      {/* hero */}
      <div style={{ maxWidth: 1280, margin: '22px auto 0', padding: '0 20px' }}>
        <div style={{ background: `linear-gradient(135deg,#fff 40%,${brandColor}14)`, border: '1.5px solid var(--line)', borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 'clamp(24px,4vw,44px)', alignItems: 'center', padding: 'clamp(28px,5vw,60px) clamp(20px,5vw,56px)' }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', background: `${brandColor}1A`, color: brandColor, borderRadius: 99, padding: '6px 14px' }}>
                {hero.badge}
              </div>
              <h1 style={{ margin: '16px 0 0', fontSize: 'clamp(34px,4.8vw,56px)', lineHeight: 1.15, fontWeight: 700 }}>
                {hero.title} <span style={{ color: brandColor }}>{hero.highlight}</span>
              </h1>
              <p style={{ margin: '18px 0 0', color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1.65, maxWidth: 500 }}>{hero.subtitle}</p>
              <button
                onClick={() => router.push('/courses')}
                style={{ marginTop: 30, border: 'none', background: brandColor, color: '#fff', borderRadius: 14, padding: '17px 38px', fontSize: 17.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {t.startLearning} →
              </button>

              <div style={{ marginTop: 30, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t.trustLine}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {partners.map((n) => (
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
            onClick={() => router.push('/courses')}
            style={{ border: 'none', background: brandColor, color: '#fff', borderRadius: 11, padding: '12px 22px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {t.seeDetails} →
          </button>
        </div>
      </div>

      {/* section 1 — recorded free crash courses (real PUBLISHED courses) */}
      <div style={{ maxWidth: 1280, margin: '44px auto 0', padding: '0 20px' }}>
        <CourseCategoryGrid
          t={t} title={t.recordedCrashT} subtitle={t.recordedCrashS} icon="📺"
          items={courseItems} catLabel={catLabel} variant="course"
        />
      </div>

      {/* section 2 — upcoming free live demo classes */}
      <div style={{ maxWidth: 1280, margin: '44px auto 0', padding: '0 20px' }}>
        <CourseCategoryGrid
          t={t} title={t.liveDemoUpcomingT} icon="🔴"
          items={upcomingItems} catLabel={demoCatLabel} variant="live"
          footerMore onMore={() => router.push('/courses')}
        />
      </div>

      {/* section 3 — previous recorded live demo classes */}
      <div style={{ maxWidth: 1280, margin: '44px auto 0', padding: '0 20px' }}>
        <CourseCategoryGrid
          t={t} title={t.prevRecordedT} icon="📺"
          items={recordedItems} catLabel={demoCatLabel} variant="course"
        />
      </div>

      {/* what you get */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 20px 0' }}>
        <h2 style={{ margin: '0 0 22px', fontSize: 30, fontWeight: 700, textAlign: 'center' }}>{t.whatYouGet}</h2>
        <div className="panel" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 14 }}>
          {stats.map((s, i) => (
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 16, alignItems: 'start' }}>
          {testimonials.map((ts, i) => (
            <div key={i} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#44403c' }}>&ldquo;{ts.quote}&rdquo;</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                <div className="avatar" style={{ width: 36, height: 36, background: ts.c + '22', color: ts.c, fontSize: 14 }}>{(ts.name || '?')[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ts.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{ts.batch}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ (CMS-managed) */}
      {faqs.length > 0 && (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '52px 20px 0' }}>
          <h2 style={{ margin: '0 0 22px', fontSize: 30, fontWeight: 700, textAlign: 'center' }}>{t.cdFaq}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((f, i) => (
              <div key={i} className="card" style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontWeight: 600, fontSize: 15 }}>
                  <span>{f.q}</span><span style={{ color: 'var(--faint)' }}>{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && <div style={{ marginTop: 10, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

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
              {[['/about', t.about], ['/blog', t.blog], ['/contact', t.contact], ['/privacy', t.privacy], ['/terms', t.terms]].map(([href, label]) => (
                <Link key={href} href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{label}</Link>
              ))}
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
