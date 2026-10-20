'use client';

import { useState, useId } from 'react';
import Icon from '@/components/Icon';

// items: [{ id, title, meta?, content }]. Buttons with aria-expanded /
// aria-controls; panels are regions labelled by their trigger.
export default function Accordion({ items, defaultOpen = [], allowMultiple = true, renderControls }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  // Panels render on first open and then stay mounted so closing can animate.
  const [seen, setSeen] = useState(() => new Set(defaultOpen));
  const base = useId();
  const toggle = (id) => setOpen((prev) => {
    const next = new Set(allowMultiple ? prev : []);
    if (prev.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleSeen = (id) => setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
  const setAll = (on) => {
    if (on) setSeen(new Set(items.map((i) => i.id)));
    setOpen(on ? new Set(items.map((i) => i.id)) : new Set());
  };
  return (
    <>
      {renderControls && renderControls({ setAll, allOpen: open.size === items.length && items.length > 0 })}
      <div className="accordion">
        {items.map((item) => {
          const isOpen = open.has(item.id);
          const tid = `${base}-t-${item.id}`, pid = `${base}-p-${item.id}`;
          return (
            <div className="accordion-item" key={item.id}>
              <h3 style={{ margin: 0, font: 'inherit' }}>
                <button type="button" id={tid} className="accordion-trigger" aria-expanded={isOpen} aria-controls={pid} onClick={() => { toggleSeen(item.id); toggle(item.id); }}>
                  <Icon name="chevronDown" size={18} className="chev" />
                  <span className="grow">{item.title}</span>
                  {item.meta && <span className="small muted" style={{ fontWeight: 500 }}>{item.meta}</span>}
                </button>
              </h3>
              <div id={pid} role="region" aria-labelledby={tid} className="collapse" data-open={isOpen}>
                <div className="collapse-inner">
                  <div className={item.flush ? '' : 'accordion-panel'}>{(isOpen || seen.has(item.id)) && item.content}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
