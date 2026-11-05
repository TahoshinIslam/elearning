import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth';
import { getLessonContext } from '@/lib/access';
import { touchLesson } from '@/lib/videoRepo';


export async function generateMetadata(props) {
  const params = await props.params;
  const ctx = await getLessonContext(params.lessonId);
  return { title: ctx ? `${ctx.title} · ${ctx.course_title}` : 'Lesson' };
}

// Validates that the lesson belongs to this course and records it as the
// learner's last opened lesson. The content itself is rendered by the
// CoursePlayer in the layout.
export default async function LessonPage(props) {
  const params = await props.params;
  const ctx = await getLessonContext(params.lessonId);
  if (!ctx || ctx.course_slug !== params.courseSlug) redirect(`/learn/${params.courseSlug}`);
  await touchLesson(await currentSession(), ctx);
  return null;
}
