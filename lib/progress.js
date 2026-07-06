// Derived progress metrics — the single source of truth for attendance rate,
// assignment-completion rate, and overall course completion %.
// Used by the student portal, parent monitor, and (next slice) certificates.

export function courseAttendanceRate(studentId, batchId, attendance) {
  if (batchId == null) return null;
  const rows = attendance.filter((a) => a.studentId === studentId && a.batchId === batchId);
  if (!rows.length) return null;
  return Math.round((rows.filter((a) => a.present).length / rows.length) * 100);
}

export function courseAssignmentRate(studentId, course, submissions) {
  if (!course) return null;
  const asg = course.modules.flatMap((m) => m.lessons.filter((l) => l.type === 'assignment'));
  if (!asg.length) return null;
  const done = asg.filter((l) => submissions.some((s) => s.lessonId === l.id && s.studentId === studentId)).length;
  return Math.round((done / asg.length) * 100);
}

// completion = average of the metrics we actually track (attendance + assignments)
export function courseCompletion(studentId, course, { enrollments, submissions, attendance }) {
  const enr = enrollments.find((e) => e.studentId === studentId && e.courseId === course?.id);
  const batchId = enr?.batchId ?? null;
  const attendanceRate = courseAttendanceRate(studentId, batchId, attendance);
  const assignmentRate = courseAssignmentRate(studentId, course, submissions);
  const parts = [attendanceRate, assignmentRate].filter((v) => v != null);
  const completion = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
  return { batchId, attendanceRate, assignmentRate, completion };
}

// completion % threshold at/above which a certificate is granted (used by #5)
export const CERT_THRESHOLD = 80;
