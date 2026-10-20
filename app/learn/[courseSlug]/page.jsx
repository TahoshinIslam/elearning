import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth';
import { getLearnerCourse } from '@/lib/learningRepo';

export const dynamic = 'force-dynamic';

// /learn/[slug] → the lesson to resume (layout already enforced access).
export default async function LearnResume({ params }) {
  const outline = await getLearnerCourse(currentSession(), params.courseSlug);
  if (outline.resumeLessonId) redirect(`/learn/${params.courseSlug}/${outline.resumeLessonId}`);
  return null; // CoursePlayer renders the "no lessons yet" state
}
