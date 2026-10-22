'use client';

import { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';
import { usePresence } from '@/components/ui/motion';

const ICON = { success: 'checkCircle', error: 'alert', info: 'info', default: 'info' };

// Polite live region. Toasts confirm outcomes that really happened (the
// caller shows one only after the server responded). The last message is
// kept while it fades out.
export default function Toast() {
  const { toast } = useApp();
  const msg = toast ? (typeof toast === 'string' ? toast : toast.msg) : null;
  const kind = toast && typeof toast !== 'string' ? toast.kind || 'default' : 'default';
  const last = useRef({ msg: null, kind: 'default' });
  if (msg) last.current = { msg, kind };
  const { mounted, state, onAnimationEnd } = usePresence(!!msg);
  const shown = msg ? { msg, kind } : last.current;
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {mounted && shown.msg && (
        <div className={`toast toast-${shown.kind}`} data-state={state} onAnimationEnd={onAnimationEnd}>
          <Icon name={ICON[shown.kind] || 'info'} size={18} style={{ marginTop: 2 }} />
          <span>{shown.msg}</span>
        </div>
      )}
    </div>
  );
}
