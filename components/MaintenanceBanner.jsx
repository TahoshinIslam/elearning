'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

// Site-wide banner shown when the owner has enabled maintenance mode.
// Admins (owner/superadmin) still see the full site so they can keep working.
export default function MaintenanceBanner() {
  const { auth } = useApp();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/settings').then((r) => (r.ok ? r.json() : {})).then((s) => alive && setSettings(s)).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!settings || settings.maintenance !== '1') return null;
  if (auth && ['owner', 'superadmin'].includes(auth.role)) {
    // admins get a slim reminder instead of the full block
    return (
      <div style={{ background: '#7c2d12', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
        🚧 Maintenance mode is ON — visitors see the maintenance screen.
      </div>
    );
  }
  return (
    <div style={{ background: '#7c2d12', color: '#fff', textAlign: 'center', padding: '10px 16px', fontSize: 14, fontWeight: 700 }}>
      🚧 {settings.maintenanceMsg || 'Under maintenance'}
    </div>
  );
}
