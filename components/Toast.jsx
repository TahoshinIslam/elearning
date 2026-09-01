'use client';

import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';

// colour + icon per action kind
const STYLES = {
  success: { bg: '#15794a', icon: 'check' },
  error: { bg: '#c92a2a', icon: 'x' },
  info: { bg: '#1d4ed8', icon: 'info' },
  default: { bg: 'var(--coal)', icon: 'info' }
};

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  // supports both the new { msg, kind } shape and a plain string (back-compat)
  const msg = typeof toast === 'string' ? toast : toast.msg;
  const kind = typeof toast === 'string' ? 'default' : (toast.kind || 'default');
  if (!msg) return null;
  const s = STYLES[kind] || STYLES.default;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: s.bg,
        color: '#fff',
        borderRadius: 12,
        padding: '13px 20px',
        fontSize: 14,
        fontWeight: 600,
        boxShadow: 'var(--shadow-pop)',
        animation: 'leoToast .25s ease',
        maxWidth: 'calc(100vw - 40px)'
      }}
    >
      <Icon name={s.icon} size={17} />
      <span>{msg}</span>
    </div>
  );
}
