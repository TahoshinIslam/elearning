'use client';

import { useMemo, useState, useEffect } from 'react';
import Icon from '@/components/Icon';

const T = {
  bn: { search: 'খুঁজুন', all: 'সব', rows: 'প্রতি পৃষ্ঠায়', of: (a, b, n) => `${a}–${b} / মোট ${n}`, prev: 'আগের পৃষ্ঠা', next: 'পরের পৃষ্ঠা', empty: 'কোনো রেকর্ড নেই।', noMatch: 'ফিল্টারের সাথে কিছু মেলেনি।', clear: 'ফিল্টার মুছুন', error: 'ডেটা লোড করা যায়নি।', retry: 'আবার চেষ্টা করুন', loading: 'লোড হচ্ছে…', actions: 'কাজ' },
  en: { search: 'Search', all: 'All', rows: 'Rows per page', of: (a, b, n) => `${a}–${b} of ${n}`, prev: 'Previous page', next: 'Next page', empty: 'No records yet.', noMatch: 'Nothing matches these filters.', clear: 'Clear filters', error: 'Couldn’t load data.', retry: 'Try again', loading: 'Loading…', actions: 'Actions' }
};

// Client-side table for admin lists of real records (hundreds, not
// millions): search, select filters, sortable columns, pagination, row
// actions, and loading / empty / error states. Overflow scrolls inside the
// table region, never the page.
//   columns: [{ key, label, render?(row), sort?(row) => value, align?, nowrap?, minWidth? }]
//   filters: [{ key, label, options: [{ value, label }], test(row, value) }]
export default function DataTable({
  lang = 'bn', caption, columns, rows, rowKey = (r) => r.id, searchText, filters = [], toolbar,
  rowActions, initialSort, pageSizes = [10, 25, 50], loading = false, error = null, onRetry, emptyState
}) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const [query, setQuery] = useState('');
  const [fv, setFv] = useState({});
  const [sort, setSort] = useState(initialSort || null); // { key, dir }
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSizes[0]);

  const filtered = useMemo(() => {
    const qn = query.trim().toLowerCase();
    let out = rows || [];
    if (qn && searchText) out = out.filter((r) => String(searchText(r) || '').toLowerCase().includes(qn));
    for (const f of filters) if (fv[f.key]) out = out.filter((r) => f.test(r, fv[f.key]));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sort || ((r) => r[sort.key]);
      out = [...out].sort((a, b) => {
        const x = val(a), y = val(b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), lang === 'en' ? 'en' : 'bn');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, query, fv, sort, columns, filters, searchText, lang]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const start = (page - 1) * size;
  const visible = filtered.slice(start, start + size);
  const active = query || Object.values(fv).some(Boolean);
  const toggleSort = (key) => setSort((s) => (!s || s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));

  return (
    <div className="dt">
      <div className="ws-toolbar">
        {searchText && (
          <div className="input-group grow" style={{ maxWidth: 420 }}>
            <Icon name="search" size={16} />
            <label className="sr-only" htmlFor={`dt-q-${caption}`}>{t.search}</label>
            <input id={`dt-q-${caption}`} type="search" className="input" placeholder={t.search} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} style={{ minHeight: 40 }} />
          </div>
        )}
        {filters.map((f) => (
          <div key={f.key} className="row" style={{ '--gap': '6px' }}>
            <label className="small muted nowrap" htmlFor={`dt-f-${caption}-${f.key}`}>{f.label}</label>
            <select id={`dt-f-${caption}-${f.key}`} className="select" style={{ width: 'auto', minHeight: 40, fontSize: 14.5 }} value={fv[f.key] || ''} onChange={(e) => { setFv((x) => ({ ...x, [f.key]: e.target.value })); setPage(1); }}>
              <option value="">{t.all}</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        {active && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setFv({}); setPage(1); }}>{t.clear}</button>}
        {toolbar && <div className="row" style={{ marginLeft: 'auto', '--gap': '8px', flexWrap: 'wrap' }}>{toolbar}</div>}
      </div>

      <div className="table-wrap" aria-busy={loading || undefined}>
        <table className="table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => {
                const sorted = sort?.key === c.key ? sort.dir : null;
                return (
                  <th key={c.key} scope="col" aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined} style={{ textAlign: c.align || 'left', minWidth: c.minWidth }}>
                    {c.sortable === false || !c.label ? c.label : (
                      <button type="button" className="th-sort" onClick={() => toggleSort(c.key)}>
                        {c.label}<Icon name={sorted === 'desc' ? 'arrowDown' : 'arrowUp'} size={13} style={{ opacity: sorted ? 1 : 0.25 }} />
                      </button>
                    )}
                  </th>
                );
              })}
              {rowActions && <th scope="col" style={{ textAlign: 'right' }}><span className="sr-only">{t.actions}</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk${i}`}>{columns.map((c) => <td key={c.key}><div className="skeleton" style={{ height: 14, width: '70%' }} /></td>)}{rowActions && <td />}</tr>
              ))
            ) : error ? (
              <tr><td colSpan={columns.length + (rowActions ? 1 : 0)}>
                <div className="state" role="alert" style={{ padding: 28 }}><Icon name="alert" size={22} /><p>{error === true ? t.error : error}</p>{onRetry && <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}><Icon name="refresh" size={14} />{t.retry}</button>}</div>
              </td></tr>
            ) : !visible.length ? (
              <tr><td colSpan={columns.length + (rowActions ? 1 : 0)}>
                <div className="state" style={{ padding: 28 }}>{active ? <><p>{t.noMatch}</p><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setFv({}); }}>{t.clear}</button></> : (emptyState || <p>{t.empty}</p>)}</div>
              </td></tr>
            ) : visible.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => <td key={c.key} style={{ textAlign: c.align || 'left', whiteSpace: c.nowrap ? 'nowrap' : undefined }}>{c.render ? c.render(r) : r[c.key]}</td>)}
                {rowActions && <td className="nowrap" style={{ textAlign: 'right' }}><div className="row" style={{ justifyContent: 'flex-end', '--gap': '6px' }}>{rowActions(r)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !error && filtered.length > pageSizes[0] && (
        <div className="dt-foot">
          <div className="row" style={{ '--gap': '6px' }}>
            <label className="small muted" htmlFor={`dt-s-${caption}`}>{t.rows}</label>
            <select id={`dt-s-${caption}`} className="select" style={{ width: 'auto', minHeight: 34, fontSize: 14 }} value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
              {pageSizes.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="row" style={{ '--gap': '6px' }}>
            <span className="small muted tabular">{t.of(start + 1, Math.min(start + size, filtered.length), filtered.length)}</span>
            <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label={t.prev}><Icon name="chevronLeft" size={16} /></button>
            <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label={t.next}><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
