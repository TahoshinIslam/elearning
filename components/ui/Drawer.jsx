'use client';

import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import { usePresence } from '@/components/ui/motion';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Side sheet with the same focus handling as Dialog (trap, Escape, restore).
export default function Drawer({ open, onClose, title, children, footer, side = 'right', closeLabel = 'Close', initialFocus }) {
  const ref = useRef(null);
  const titleId = useId();
  const { mounted, state, onAnimationEnd } = usePresence(open);
  useEffect(() => {
    if (!open) return undefined;
    const previously = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const node = ref.current;
    (node?.querySelector(FOCUSABLE) || node)?.focus({ preventScroll: true });
    // Content may mount a frame later (e.g. inside Suspense); focus it then.
    const raf = initialFocus ? requestAnimationFrame(() => node?.querySelector(initialFocus)?.focus({ preventScroll: true })) : 0;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      previously?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, initialFocus]);
  if (!mounted || typeof document === 'undefined') return null;
  const closing = state === 'closing';
  return createPortal(
    <>
      <div className="drawer-backdrop" data-state={state} onClick={closing ? undefined : onClose} aria-hidden="true" />
      <div ref={ref} className={`drawer ${side === 'left' ? 'drawer-left' : ''}`} data-state={state} onAnimationEnd={onAnimationEnd}
        role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} {...(closing ? { inert: '' } : {})}>
        <div className="drawer-head">
          <h2 id={titleId} className="h4">{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label={closeLabel}><Icon name="x" size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>,
    document.body
  );
}
