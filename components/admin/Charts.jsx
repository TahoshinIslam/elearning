'use client';

import { useState } from 'react';

// Small dependency-free charts in the notebook style: flat fills, black
// outlines, hard shadows. Every chart has a text alternative (table or
// list) so screen-reader users get the same numbers.

const fmtDay = (d, lang) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short' });

// Daily columns with a hover/focus readout.
export function ColumnChart({ data, valueKey, label, format = (v) => v, color = 'var(--c-yellow)', lang = 'bn', height = 180 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const total = data.reduce((a, d) => a + d[valueKey], 0);
  const shown = hover != null ? data[hover] : null;
  return (
    <figure className="chart">
      <figcaption className="chart-cap">
        <span>{label}</span>
        <strong className="tabular">{shown ? `${fmtDay(shown.date, lang)} · ${format(shown[valueKey])}` : format(total)}</strong>
      </figcaption>
      <div className="chart-cols" style={{ height }} onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button key={d.date} type="button" className={`chart-col ${hover === i ? 'is-on' : ''}`}
            style={{ '--h': `${(d[valueKey] / max) * 100}%`, '--c': color }}
            onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            aria-label={`${fmtDay(d.date, lang)}: ${format(d[valueKey])}`}>
            <span />
          </button>
        ))}
      </div>
      <div className="chart-axis" aria-hidden="true">
        <span>{data[0] && fmtDay(data[0].date, lang)}</span>
        <span>{data.length > 2 && fmtDay(data[Math.floor(data.length / 2)].date, lang)}</span>
        <span>{data.length && fmtDay(data[data.length - 1].date, lang)}</span>
      </div>
    </figure>
  );
}

// Horizontal ranked bars (top courses, sources …).
export function BarList({ rows, valueKey, labelKey = 'title', format = (v) => v, color = 'var(--c-cyan)', empty = '—', sub }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <ol className="barlist">
      {rows.map((r, i) => (
        <li key={r.id ?? r[labelKey] ?? i} style={{ '--w': `${Math.max(4, (r[valueKey] / max) * 100)}%`, '--c': color }}>
          <span className="barlist-bar" aria-hidden="true" />
          <span className="barlist-label clamp-1">{r[labelKey]}</span>
          {sub && <span className="barlist-sub muted">{sub(r)}</span>}
          <strong className="barlist-val tabular">{format(r[valueKey])}</strong>
        </li>
      ))}
    </ol>
  );
}

// Learning funnel per course: enrolled → started → halfway → completed.
export function Funnel({ row, labels }) {
  const steps = [['enrolled', 'var(--c-yellow)'], ['started', 'var(--c-cyan)'], ['halfway', 'var(--c-violet)'], ['completed', 'var(--c-lime)']];
  const max = Math.max(1, row.enrolled);
  return (
    <div className="funnel">
      {steps.map(([k, c]) => (
        <div key={k} className="funnel-step" style={{ '--w': `${Math.max(6, (row[k] / max) * 100)}%`, '--c': c }}>
          <span className="funnel-bar" aria-hidden="true" />
          <span className="funnel-label">{labels[k]}</span>
          <strong className="tabular">{row[k]}</strong>
        </div>
      ))}
    </div>
  );
}

// Delta chip: ▲ 12% / ▼ 4% vs previous period.
export function Delta({ value, lang = 'bn' }) {
  if (value == null) return <span className="delta is-flat">{lang === 'en' ? 'new' : 'নতুন'}</span>;
  const up = value >= 0;
  return <span className={`delta ${up ? 'is-up' : 'is-down'}`}>{up ? '▲' : '▼'} {Math.abs(value)}%</span>;
}
