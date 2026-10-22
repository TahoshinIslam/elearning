'use client';

import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import { usePresence } from '@/components/ui/motion';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

// Accessible modal dialog: aria-modal + labelled title, focus moved in on
// open and trapped (Tab/Shift+Tab), Escape and backdrop click close, focus
// restored to the trigger on close, background scroll locked.
export default function Dialog({ open, onClose, title, description, children, footer, wide = false, dark = false, sheet = true, closeLabel = 'Close', initialFocus }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Stays mounted while the exit animation plays; focus handling below is
  // tied to `open`, so focus returns to the trigger as soon as closing starts.
  const { mounted, state, onAnimationEnd } = usePresence(open);

  useEffect(() => {
    if (!open) return undefined;
    const previously = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const node = ref.current;
    const first = (initialFocus && node?.querySelector(initialFocus)) || node?.querySelector(FOCUSABLE) || node;
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); node.focus(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      if (previously && typeof previously.focus === 'function') previously.focus({ preventScroll: true });
    };
  }, [open, onClose, initialFocus]);

  if (!mounted || typeof document === 'undefined') return null;
  const closing = state === 'closing';
  return createPortal(
    <div className={`dialog-backdrop ${sheet ? 'sheet' : ''}`} data-state={state} onAnimationEnd={onAnimationEnd}
      onMouseDown={(e) => { if (!closing && e.target === e.currentTarget) onClose?.(); }} {...(closing ? { inert: '' } : {})}>
      <div
        ref={ref}
        className={`dialog ${wide ? 'dialog-wide' : ''} ${dark ? 'dialog-dark on-dark' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        {(title || onClose) && (
          <div className="dialog-head">
            <div className="grow">
              {title && <h2 id={titleId} className="h3" style={dark ? { color: 'var(--stage-ink)' } : undefined}>{title}</h2>}
              {description && <p id={descId} className="small muted" style={{ marginTop: 4 }}>{description}</p>}
            </div>
            {onClose && (
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label={closeLabel}>
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        )}
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
