'use client';
import { useState } from 'react';

export default function SimulatorActions({ paymentID, disabled }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const decide = async (action) => {
    setBusy(action); setError(null);
    try {
      const res = await fetch('/api/dev/bkash/hosted/decide', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentID, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      window.location.assign(data.redirect);
    } catch (e) {
      setError(e.message); setBusy(null);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
      <button className="btn btn-primary btn-lg" disabled={disabled || !!busy} onClick={() => decide('pay')}>{busy === 'pay' ? 'Authorizing…' : 'Pay (simulate success)'}</button>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} disabled={disabled || !!busy} onClick={() => decide('cancel')}>Cancel</button>
        <button className="btn btn-secondary" style={{ flex: 1 }} disabled={disabled || !!busy} onClick={() => decide('fail')}>Fail</button>
      </div>
      {disabled && <p className="muted small">This payment has already been decided.</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
