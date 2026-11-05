import Link from 'next/link';

// Staff still use the site during maintenance; this strip reminds them.
export default function StaffMaintenanceStrip({ until, lang = 'bn' }) {
  const en = lang === 'en';
  const when = until ? new Date(until).toLocaleString(en ? 'en-GB' : 'bn-BD', { timeStyle: 'short', dateStyle: 'short' }) : null;
  return (
    <div className="maint-strip" role="status">
      {en ? 'Maintenance mode is ON — visitors see the countdown page' : 'মেইনটেন্যান্স মোড চালু — দর্শকরা কাউন্টডাউন পেজ দেখছেন'}
      {when ? ` · ${en ? 'ends' : 'শেষ'} ${when}` : ''} · <Link href="/owner?section=settings">{en ? 'Settings' : 'সেটিংস'}</Link>
    </div>
  );
}
