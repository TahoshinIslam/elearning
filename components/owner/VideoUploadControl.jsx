'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Icon from '@/components/Icon';

// Direct browser → bucket upload: this app's server only ever hands out a
// short-lived presigned PUT URL (POST /api/lessons/:id/video/upload-url) and
// later confirms the upload landed (POST /api/lessons/:id/video) — the video
// file itself never passes through the Next.js server.
function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.round(v.duration) || null); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    v.src = url;
  });
}

export default function VideoUploadControl({ lessonId }) {
  const { lang, showToast } = useApp();
  const bn = lang === 'bn';
  const [state, setState] = useState('idle'); // idle | uploading | done | error

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setState('uploading');
    try {
      const durationSeconds = await readDuration(file);

      const urlRes = await fetch(`/api/lessons/${lessonId}/video/upload-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'video/mp4' })
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData?.error || 'upload_url_failed');

      const putRes = await fetch(urlData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'video/mp4' }, body: file });
      if (!putRes.ok) throw new Error('bucket_upload_failed');

      const confirmRes = await fetch(`/api/lessons/${lessonId}/video`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: urlData.key, durationSeconds })
      });
      if (!confirmRes.ok) throw new Error('confirm_failed');

      setState('done');
      showToast(bn ? 'ভিডিও আপলোড হয়েছে ✓' : 'Video uploaded ✓');
    } catch (err) {
      setState('error');
      showToast(bn ? 'আপলোড ব্যর্থ হয়েছে' : 'Upload failed');
    }
  };

  return (
    <label
      className="btn-ghost-sm"
      title={bn ? 'ভিডিও আপলোড/পরিবর্তন করুন' : 'Upload / replace video'}
      style={{ cursor: state === 'uploading' ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      {state === 'uploading' ? (
        <span style={{ fontSize: 11 }}>{bn ? 'আপলোড হচ্ছে…' : 'Uploading…'}</span>
      ) : state === 'done' ? (
        <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={13} />{bn ? 'ভিডিও' : 'Video'}</span>
      ) : (
        <Icon name="upload" size={14} />
      )}
      <input type="file" accept="video/*" onChange={onFile} disabled={state === 'uploading'} style={{ display: 'none' }} />
    </label>
  );
}
