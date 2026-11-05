'use client';

import { useEffect } from 'react';
import { track } from '@/components/Tracker';

// Fire one analytics event when a page mounts (e.g. a course view, which also
// feeds the visitor's interest profile used for popup targeting).
export default function TrackView({ type = 'course_view', refId, category }) {
  useEffect(() => { track(type, { refId: refId != null ? String(refId) : undefined, category: category || undefined }); }, [type, refId, category]);
  return null;
}
