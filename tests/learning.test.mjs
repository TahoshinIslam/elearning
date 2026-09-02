// Phase 5 — integration test for the My Learning aggregation. Verifies the
// numbers behind the rebuilt student dashboard are real, not the fixed
// 72%-style placeholders the old CoursesTab.jsx hardcoded.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { q } from '@/lib/mysql';
import { createUser } from '@/lib/authRepo';
import { getMyLearning } from '@/lib/learningRepo';

const RUN_ID = Date.now();
let studentId, userId, videoCourseId, noVideoCourseId, lessonA, lessonB;

beforeAll(async () => {
  const user = await createUser({ name: 'Learning Tester', email: `phase5-test-${RUN_ID}@example.test`, password: 'testpass123' });
  userId = user.id; studentId = user.student_id;

  const videoCourse = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language) VALUES (?,?,1,0,0,0,0,'English')`,
    [`Phase 5 Video Course ${RUN_ID}`, `phase5-video-${RUN_ID}`]
  );
  videoCourseId = videoCourse.insertId;
  const mod = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,0)', [videoCourseId, 'Module 1']);
  const la = await q("INSERT INTO lessons (module_id, title, type, is_free, position) VALUES (?,?,'video',1,0)", [mod.insertId, 'Lesson A']);
  const lb = await q("INSERT INTO lessons (module_id, title, type, is_free, position) VALUES (?,?,'video',1,1)", [mod.insertId, 'Lesson B']);
  lessonA = la.insertId; lessonB = lb.insertId;
  await q("INSERT INTO video_assets (lesson_id, provider, storage_key, duration_seconds, status) VALUES (?,'s3',?,100,'ready')", [lessonA, `k/${lessonA}`]);
  await q("INSERT INTO video_assets (lesson_id, provider, storage_key, duration_seconds, status) VALUES (?,'s3',?,100,'ready')", [lessonB, `k/${lessonB}`]);

  const noVideoCourse = await q(
    `INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language) VALUES (?,?,1,0,0,0,0,'English')`,
    [`Phase 5 No-Video Course ${RUN_ID}`, `phase5-novideo-${RUN_ID}`]
  );
  noVideoCourseId = noVideoCourse.insertId;

  await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,NULL,?,CURDATE(),?)', [studentId, videoCourseId, 'active']);
  await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,NULL,?,CURDATE(),?)', [studentId, noVideoCourseId, 'active']);
});

afterAll(async () => {
  await q('DELETE FROM certificates WHERE student_id = ?', [studentId]);
  await q('DELETE FROM lesson_progress WHERE student_id = ?', [studentId]);
  await q('DELETE FROM enrollments WHERE student_id = ?', [studentId]);
  await q('DELETE FROM courses WHERE id IN (?,?)', [videoCourseId, noVideoCourseId]);
  await q('DELETE FROM users WHERE id = ?', [userId]);
  await q('DELETE FROM students WHERE id = ?', [studentId]);
});

describe('My Learning aggregation', () => {
  it('reports null completion (not a fake 0% or 72%) for a course with no video lessons', async () => {
    const learning = await getMyLearning({ studentId });
    const noVideo = learning.find((c) => c.courseId === noVideoCourseId);
    expect(noVideo.videoLessonCount).toBe(0);
    expect(noVideo.completionPct).toBeNull();
  });

  it('computes real completion % from actual watched lessons', async () => {
    await q("INSERT INTO lesson_progress (student_id, lesson_id, watched_seconds, duration_seconds, completed, completed_at) VALUES (?,?,100,100,1,NOW())", [studentId, lessonA]);
    const learning = await getMyLearning({ studentId });
    const withVideo = learning.find((c) => c.courseId === videoCourseId);
    expect(withVideo.videoLessonCount).toBe(2);
    expect(withVideo.videoCompletedCount).toBe(1);
    expect(withVideo.completionPct).toBe(50);
    expect(withVideo.resumeLessonId).toBe(lessonA); // most recently touched
    expect(withVideo.certified).toBe(false);
  });

  it('reflects a real issued certificate', async () => {
    await q(
      "INSERT INTO certificates (student_id, student_name, course_id, course_title, issued_at, completion, cert_no) VALUES (?,?,?,?,CURDATE(),50,?)",
      [studentId, 'Learning Tester', videoCourseId, 'Phase 5 Video Course', `LEO-TEST-${RUN_ID}`]
    );
    const learning = await getMyLearning({ studentId });
    const withVideo = learning.find((c) => c.courseId === videoCourseId);
    expect(withVideo.certified).toBe(true);
    expect(withVideo.certNo).toBe(`LEO-TEST-${RUN_ID}`);
  });
});
