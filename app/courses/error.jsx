'use client';

import { useApp } from '@/context/AppContext';
import { copy } from '@/lib/copy';
import Icon from '@/components/Icon';

export default function CatalogError({ reset }) {
  const { lang } = useApp();
  const c = copy(lang);
  return (
    <main id="main" className="container section">
      <div className="surface state" role="alert">
        <div className="state-icon"><Icon name="wifiOff" size={24} /></div>
        <h2>{c.loadErrorT}</h2>
        <p>{c.loadErrorD}</p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}><Icon name="refresh" size={16} />{c.retry}</button>
      </div>
    </main>
  );
}
