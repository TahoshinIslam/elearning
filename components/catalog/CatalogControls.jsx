'use client';

import { createContext, useContext, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import Drawer from '@/components/ui/Drawer';
import { copy, num } from '@/lib/copy';
import { modeLabel } from '@/lib/modes';

// One transition shared by every control, so the results region can show a
// single pending state while the server renders the new page of results.
const PendingCtx = createContext(null);

export function CatalogShell({ children }) {
  const [pending, start] = useTransition();
  return <PendingCtx.Provider value={{ pending, start }}><div className="catalog-layout">{children}</div></PendingCtx.Provider>;
}

export function CatalogResults({ children, labelledBy }) {
  const ctx = useContext(PendingCtx);
  return <section className="catalog-results" aria-labelledby={labelledBy} aria-busy={ctx?.pending || undefined} data-pending={ctx?.pending || undefined}>{children}</section>;
}

// URL is the single source of truth for catalog state: every change pushes a
// new query string (shareable, back/forward-safe) and the server re-renders.
function useCatalogNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const own = useTransition();
  const ctx = useContext(PendingCtx);
  const [pending, start] = ctx ? [ctx.pending, ctx.start] : own;
  const set = (changes) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) { if (v) sp.set(k, v); else sp.delete(k); }
    sp.delete('page');
    const s = sp.toString();
    start(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };
  return { set, pending };
}

function Group({ name, legend, options, value, onChange, lang, allLabel }) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-title">{legend}</legend>
      <label className="filter-opt">
        <input type="radio" name={name} checked={!value} onChange={() => onChange('')} />
        <span>{allLabel}</span>
      </label>
      {options.map((o) => (
        <label key={o.value} className="filter-opt">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
          {o.count != null && <span className="count">{num(lang, o.count)}</span>}
        </label>
      ))}
    </fieldset>
  );
}

function Groups({ lang, query, facets, onChange, idPrefix }) {
  const c = copy(lang);
  const en = lang === 'en';
  const classOpts = [...facets.classes.map((x) => ({ value: x.value, label: x.name, count: x.count })), ...(facets.nonClassCount ? [{ value: 'other', label: c.otherCourses, count: facets.nonClassCount }] : [])];
  return (
    <>
      {facets.sections?.length > 0 && <Group name={`${idPrefix}-sec`} legend={en ? 'Section' : 'সেকশন'} allLabel={c.priceAll} lang={lang} value={query.section}
        options={facets.sections.map((x) => ({ value: x.value, label: en ? x.nameEn : x.nameBn, count: x.count }))} onChange={(v) => onChange({ section: v, class: '', category: '' })} />}
      {classOpts.length > 0 && <Group name={`${idPrefix}-class`} legend={c.filterClass} allLabel={c.priceAll} lang={lang} value={query.class} options={classOpts} onChange={(v) => onChange({ class: v })} />}
      {facets.categories.length > 0 && <Group name={`${idPrefix}-cat`} legend={en ? 'Subject' : 'বিষয়'} allLabel={c.priceAll} lang={lang} value={query.category} options={facets.categories} onChange={(v) => onChange({ category: v })} />}
      {facets.modes?.length > 0 && <Group name={`${idPrefix}-mode`} legend={en ? 'Class type' : 'ক্লাসের ধরন'} allLabel={c.priceAll} lang={lang} value={query.mode}
        options={facets.modes.map((m) => ({ value: m.value, label: modeLabel(lang, m.value), count: m.count }))} onChange={(v) => onChange({ mode: v })} />}
      <Group name={`${idPrefix}-price`} legend={c.filterPrice} allLabel={c.priceAll} lang={lang} value={query.price}
        options={[{ value: 'free', label: c.priceFree, count: facets.price.free }, { value: 'paid', label: c.pricePaid, count: facets.price.paid }]} onChange={(v) => onChange({ price: v })} />
      <Group name={`${idPrefix}-coll`} legend={c.filterCollection} allLabel={c.priceAll} lang={lang} value={query.collection}
        options={[{ value: 'featured', label: c.featuredSection }, { value: 'new', label: c.newSection }, { value: 'upcoming', label: c.upcomingSection }]} onChange={(v) => onChange({ collection: v })} />
      {facets.levels.length > 1 && <Group name={`${idPrefix}-level`} legend={c.filterLevel} allLabel={c.priceAll} lang={lang} value={query.level} options={facets.levels.map((l) => ({ value: l.value, label: l.value, count: l.count }))} onChange={(v) => onChange({ level: v })} />}
      {facets.languages.length > 1 && <Group name={`${idPrefix}-lang`} legend={c.filterLanguage} allLabel={c.priceAll} lang={lang} value={query.language} options={facets.languages.map((l) => ({ value: l.value, label: l.value, count: l.count }))} onChange={(v) => onChange({ language: v })} />}
    </>
  );
}

// Section tabs above the results ("All · School · College · Admission …").
export function SectionTabs({ lang, query, facets }) {
  const { set, pending } = useCatalogNav();
  const en = lang === 'en';
  if (!facets.sections?.length) return null;
  const all = [{ value: '', label: en ? 'All courses' : 'সব কোর্স' }, ...facets.sections.map((x) => ({ value: x.value, label: en ? x.nameEn : x.nameBn, count: x.count }))];
  return (
    <nav className="sec-tabs" aria-label={en ? 'Sections' : 'সেকশন'} aria-busy={pending || undefined}>
      {all.map((t) => (
        <button key={t.value || 'all'} type="button" className="sec-tab" aria-pressed={(query.section || '') === t.value}
          onClick={() => set({ section: t.value, class: '', category: '' })}>
          {t.label}{t.count != null && <span className="count">{num(lang, t.count)}</span>}
        </button>
      ))}
    </nav>
  );
}

export function FilterPanel(props) {
  const { set, pending } = useCatalogNav();
  return <div aria-busy={pending}><Groups {...props} onChange={set} idPrefix="side" /></div>;
}

export function MobileFilters(props) {
  const c = copy(props.lang);
  const [open, setOpen] = useState(false);
  const { set } = useCatalogNav();
  const active = ['section', 'category', 'class', 'mode', 'collection', 'level', 'language', 'price'].filter((k) => props.query[k]).length;
  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm mobile-only" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="filter" size={16} />{c.filters}{active ? ` (${num(props.lang, active)})` : ''}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={c.filters} side="left" closeLabel={c.close}
        footer={<button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>{c.applyFilters}</button>}>
        <Groups {...props} onChange={set} idPrefix="drawer" />
      </Drawer>
    </>
  );
}

export function SortSelect({ lang, sort, hasQuery }) {
  const c = copy(lang);
  const { set, pending } = useCatalogNav();
  const options = ['relevance', 'popular', 'newest', 'rating', 'price-asc', 'price-desc'];
  return (
    <div className="row" style={{ '--gap': '8px' }}>
      <label htmlFor="sort" className="small muted nowrap">{c.sortBy}</label>
      <select id="sort" className="select" style={{ minHeight: 38, width: 'auto', fontSize: 14.5 }} value={sort} onChange={(e) => set({ sort: e.target.value === 'relevance' ? '' : e.target.value })} aria-busy={pending}>
        {options.map((o) => <option key={o} value={o}>{c[`sort_${o}`]}</option>)}
      </select>
    </div>
  );
}

export function ActiveFilters({ lang, query, facets }) {
  const c = copy(lang);
  const { set } = useCatalogNav();
  const chips = [];
  if (query.q) chips.push({ key: 'q', label: `“${query.q}”` });
  if (query.section) { const sx = facets.sections?.find((x) => x.value === query.section); chips.push({ key: 'section', label: sx ? (lang === 'en' ? sx.nameEn : sx.nameBn) : query.section }); }
  if (query.mode) chips.push({ key: 'mode', label: modeLabel(lang, query.mode) });
  if (query.category) chips.push({ key: 'category', label: facets.categories.find((x) => x.value === query.category)?.label || query.category });
  if (query.class) chips.push({ key: 'class', label: query.class === 'other' ? c.otherCourses : (facets.classesAll || facets.classes)?.find((x) => x.value === query.class)?.name || query.class });
  if (query.collection) chips.push({ key: 'collection', label: c[`${query.collection === 'featured' ? 'featured' : query.collection === 'new' ? 'new' : 'upcoming'}Section`] });
  if (query.level) chips.push({ key: 'level', label: query.level });
  if (query.language) chips.push({ key: 'language', label: query.language });
  if (query.price) chips.push({ key: 'price', label: query.price === 'free' ? c.priceFree : c.pricePaid });
  if (!chips.length) return null;
  return (
    <div className="cluster" style={{ '--gap': '8px' }}>
      {chips.map((ch) => (
        <button key={ch.key} type="button" className="chip-filter" onClick={() => set({ [ch.key]: '' })} aria-label={`${c.removeItem}: ${ch.label}`}>
          {ch.label}<Icon name="x" size={14} />
        </button>
      ))}
      {chips.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ q: '', section: '', category: '', class: '', mode: '', collection: '', level: '', language: '', price: '' })}>{c.clearFilters}</button>}
    </div>
  );
}
