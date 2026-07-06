// Career-portal shared labels/styling for job & application statuses.

export const APP_STATUSES = ['applied', 'shortlisted', 'interview', 'hired', 'rejected'];

export const statusLabel = (t, s) =>
  ({ applied: t.stApplied, shortlisted: t.stShortlisted, interview: t.stInterview, hired: t.stHired, rejected: t.stRejected }[s] || s);

export const statusChip = (s) =>
  ({ applied: 'chip-stone', shortlisted: 'chip-violet', interview: 'chip-orange', hired: 'chip-green', rejected: 'chip-red' }[s] || 'chip-stone');

export const jobTypeLabel = (t, ty) =>
  ({ 'full-time': t.jobFull, 'part-time': t.jobPart, internship: t.jobIntern }[ty] || ty);
