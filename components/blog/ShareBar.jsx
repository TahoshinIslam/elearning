'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

export default function ShareBar({ url, title, lang }) {
  const en = lang === 'en';
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(typeof navigator.share === 'function'); }, []);
  const u = encodeURIComponent(url);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const native = async () => { try { await navigator.share({ title, url }); } catch { /* cancelled */ } };
  return (
    <div className="share-bar" role="group" aria-label={en ? 'Share this article' : 'লেখাটি শেয়ার করুন'}>
      <span className="share-label">{en ? 'Share' : 'শেয়ার'}</span>
      <a className="share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Icon name="facebook" size={17} /></a>
      <a className="share-btn" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={17} /></a>
      <a className="share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Icon name="linkedin" size={17} /></a>
      <button type="button" className="share-btn" onClick={copy} aria-label={en ? 'Copy link' : 'লিংক কপি'} data-confirm="off"><Icon name={copied ? 'check' : 'link'} size={17} /></button>
      {canShare && <button type="button" className="share-btn" onClick={native} aria-label={en ? 'More' : 'আরও'} data-confirm="off"><Icon name="share" size={17} /></button>}
      <span className="sr-only" role="status">{copied ? (en ? 'Link copied' : 'লিংক কপি হয়েছে') : ''}</span>
    </div>
  );
}
