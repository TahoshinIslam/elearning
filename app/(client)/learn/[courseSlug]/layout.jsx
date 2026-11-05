import { notFound, redirect } from 'next/navigation';
import CoursePlayer from '@/components/learn/CoursePlayer';
import { currentSession } from '@/lib/auth';
import { getLearnerCourse } from '@/lib/learningRepo';
import { getLang } from '@/lib/lang';
import { HttpError } from '@/lib/repo';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

// The player shell stays mounted while the learner moves between lessons
// (each lesson is its own URL under this layout). Access is checked here on
// the server: an active enrollment or course-manager role, nothing else.
export default async function LearnLayout(props) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await currentSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(`/learn/${params.courseSlug}`)}`);
  let outline;
  try {
    outline = await getLearnerCourse(session, params.courseSlug);
  } catch (e) {
    if (e instanceof HttpError && e.status === 403) redirect(`/course/${encodeURIComponent(params.courseSlug)}`);
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  return <CoursePlayer outline={outline} lang={(await getLang())}>{children}</CoursePlayer>;
}
