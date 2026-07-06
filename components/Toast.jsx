'use client';

import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99,
        background: 'var(--coal)',
        color: '#fff',
        borderRadius: 12,
        padding: '13px 22px',
        fontSize: 14,
        fontWeight: 600,
        boxShadow: 'var(--shadow-pop)',
        animation: 'leoToast .25s ease',
        maxWidth: 'calc(100vw - 40px)'
      }}
    >
      {toast}
    </div>
  );
}
