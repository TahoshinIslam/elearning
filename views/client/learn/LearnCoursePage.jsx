import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth';
import { getLearnerCourse } from '@/lib/learningRepo';


// /learn/[slug] → the lesson to resume (layout already enforced access).
export default async function LearnResume(props) {
  const params = await props.params;
  const outline = await getLearnerCourse(await currentSession(), params.courseSlug);
  if (outline.resumeLessonId) redirect(`/learn/${params.courseSlug}/${outline.resumeLessonId}`);
  return null; // CoursePlayer renders the "no lessons yet" state
}
