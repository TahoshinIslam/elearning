'use client';

import { useEffect, useId, useState } from 'react';
import Icon from '@/components/Icon';
import { IMAGE_SPECS, IMAGE_TYPES, IMAGE_MAX_BYTES } from '@/lib/imageSpecs';
import { num } from '@/lib/copy';

const T = {
  bn: {
    drop: 'ছবি এখানে টেনে এনে ছাড়ুন', or: 'অথবা', choose: 'কম্পিউটার থেকে বেছে নিন', replace: 'ছবি বদলান', dropNow: 'ছেড়ে দিন — আপলোড শুরু হবে',
    spec: (w, h, r) => `প্রস্তাবিত মাপ: ${num('bn', w)} × ${num('bn', h)} px (${r})`, formats: 'JPG, PNG বা WebP · সর্বোচ্চ ৮ MB',
    badType: 'শুধু JPG, PNG বা WebP ছবি দেওয়া যাবে।', tooBig: 'ছবিটি ৮ MB-এর বেশি।', uploading: 'আপলোড হচ্ছে',
    yours: (w, h) => `আপনার ছবি: ${num('bn', w)} × ${num('bn', h)} px`,
    ratioWarn: (r) => `অনুপাত ${r} নয় — দেখানোর সময় কিনারা কিছুটা কেটে যাবে।`, smallWarn: 'ছবিটি প্রস্তাবিত মাপের চেয়ে ছোট — ঝাপসা দেখাতে পারে।', fits: 'মাপ ঠিক আছে।'
  },
  en: {
    drop: 'Drag an image here', or: 'or', choose: 'choose from your computer', replace: 'Replace image', dropNow: 'Drop to upload',
    spec: (w, h, r) => `Recommended size: ${w} × ${h} px (${r})`, formats: 'JPG, PNG or WebP · up to 8 MB',
    badType: 'Only JPG, PNG or WebP images.', tooBig: 'The image is larger than 8 MB.', uploading: 'Uploading',
    yours: (w, h) => `Your image: ${w} × ${h} px`,
    ratioWarn: (r) => `Not ${r} — edges will be cropped when shown.`, smallWarn: 'Smaller than recommended — it may look blurry.', fits: 'Size fits.'
  }
};

function readSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight, url }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Drag-and-drop (or click / keyboard) image picker that states the exact
// size the slot needs, previews at that ratio, and warns — without blocking
// — when an image will be cropped or look soft. `onFile(file)` uploads.
export default function ImageDropzone({ spec, imageUrl, alt = '', progress = null, onFile, lang = 'bn', disabled = false, label }) {
  const t = T[lang === 'en' ? 'en' : 'bn'];
  const id = useId();
  const [over, setOver] = useState(false);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null); // { w, h, url }
  useEffect(() => () => { if (picked?.url) URL.revokeObjectURL(picked.url); }, [picked]);

  const take = async (file) => {
    setError(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) { setError(t.badType); return; }
    if (file.size > IMAGE_MAX_BYTES) { setError(t.tooBig); return; }
    const size = await readSize(file);
    setPicked(size);
    onFile?.(file);
  };

  const ratio = spec.w / spec.h;
  const warn = picked && (Math.abs(picked.w / picked.h - ratio) / ratio > 0.03 ? t.ratioWarn(spec.ratio) : picked.w < spec.w * 0.75 ? t.smallWarn : null);
  const preview = picked?.url || imageUrl;
  const busy = progress != null;

  return (
    <div className="dropzone-wrap">
      {label && <span className="label" style={{ margin: 0 }}>{label}</span>}
      <label htmlFor={id} className={`dropzone ${over ? 'is-over' : ''} ${disabled ? 'is-disabled' : ''}`}
        style={{ aspectRatio: `${spec.w} / ${spec.h}` }}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled && !busy) take(e.dataTransfer.files?.[0]); }}>
        <input id={id} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" disabled={disabled || busy}
          onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        {preview && <img src={preview} alt={alt} className="dropzone-img" />}
        <span className={`dropzone-cta ${preview ? 'on-image' : ''} ${busy || over ? 'is-shown' : ''}`}>
          {busy ? (
            <><span className="spinner" aria-hidden="true" /><span role="status">{t.uploading} {num(lang, progress)}%</span></>
          ) : over ? (
            <><Icon name="upload" size={22} /><strong>{t.dropNow}</strong></>
          ) : preview ? (
            <><Icon name="upload" size={18} /><strong>{t.replace}</strong></>
          ) : (
            <><Icon name="image" size={28} /><strong>{t.drop}</strong><span className="small">{t.or} <u>{t.choose}</u></span></>
          )}
        </span>
        {busy && <span className="dropzone-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>}
      </label>
      <p className="dropzone-spec"><Icon name="info" size={14} /><span><strong>{t.spec(spec.w, spec.h, spec.ratio)}</strong> · {t.formats}</span></p>
      {picked && <p className={`small ${warn ? 'dropzone-warn' : 'dropzone-ok'}`}>{t.yours(picked.w, picked.h)} — {warn || t.fits}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

// Reference card listing every image slot and its exact size.
export function ImageSizeGuide({ lang = 'bn' }) {
  const en = lang === 'en';
  return (
    <div className="size-guide">
      <h3 className="h5">{en ? 'Image sizes' : 'ছবির মাপ'}</h3>
      <ul>
        {Object.entries(IMAGE_SPECS).map(([k, sp]) => (
          <li key={k}>
            <span className="size-guide-shape" style={{ aspectRatio: `${sp.w} / ${sp.h}` }} aria-hidden="true" />
            <span><strong>{en ? sp.en : sp.bn}</strong><br /><span className="tabular">{num(lang, sp.w)} × {num(lang, sp.h)} px · {sp.ratio}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
