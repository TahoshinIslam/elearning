'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

// Same direct-to-bucket presigned upload pattern as lesson video
// (VideoUploadControl.jsx) — the image never passes through this app's server.
export default function ThumbnailUploadControl({ courseId, currentUrl }) {
  const { lang, showToast, api } = useApp();
  const bn = lang === 'bn';
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { uploadUrl, key } = await api.requestThumbnailUploadUrl(courseId, file.name, file.type || 'image/jpeg');
      const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
      if (!putRes.ok) throw new Error('bucket_upload_failed');
      await api.confirmThumbnail(courseId, key);
      setPreview(URL.createObjectURL(file)); // instant local preview; the real public URL lands on next courses refetch
      showToast(bn ? 'থাম্বনেইল আপলোড হয়েছে ✓' : 'Thumbnail uploaded ✓');
    } catch {
      showToast(bn ? 'আপলোড ব্যর্থ হয়েছে' : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {preview ? (
        <img src={preview} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
      ) : (
        <div style={{ width: 56, height: 40, borderRadius: 6, border: '1.5px dashed var(--line)', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--faint)' }}>
          {bn ? 'কোনো ছবি নেই' : 'No image'}
        </div>
      )}
      <label className="btn-ghost-sm" style={{ cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? (bn ? 'আপলোড হচ্ছে…' : 'Uploading…') : (bn ? 'থাম্বনেইল আপলোড' : 'Upload thumbnail')}
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
