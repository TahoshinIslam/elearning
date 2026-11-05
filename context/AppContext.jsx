'use client';

import { createContext, useContext, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { makeStore } from '@/store/store';
import {
  setLang as setLangAction,
  toggleLang as toggleLangAction,
  setCenterName as setCenterNameAction,
  setBrandColor as setBrandColorAction,
  setPayModel as setPayModelAction,
  setStudentPaidFlag,
  login as loginThunk,
  register as registerThunk,
  logout as logoutThunk,
  showToast as showToastThunk,
  hydrateAuth,
  setAuth,
  setCartOpen as setCartOpenAction,
  hydrateCart,
  addToCart as addToCartThunk,
  removeFromCart as removeFromCartThunk,
  clearCart as clearCartThunk
} from '@/store/uiSlice';
import {
  useGetStudentsQuery,
  useGetBatchesQuery,
  useGetTeachersQuery,
  useGetTenantsQuery,
  useAddStudentMutation,
  useImportStudentsMutation,
  useSetStudentPaidMutation,
  useAddBatchMutation,
  useAddTeacherMutation,
  useAssignTeacherMutation,
  useRemoveTeacherBatchMutation,
  useToggleTenantMutation,
  useGetCoursesQuery,
  useAddCourseMutation,
  useCourseOpMutation,
  useCreateQuizMutation,
  useSetBatchCourseMutation,
  useGetEnrollmentsQuery,
  useEnrollMutation,
  useUnenrollMutation,
  useGetSubmissionsQuery,
  useSubmitAssignmentMutation,
  useGradeSubmissionMutation,
  useGetAttendanceQuery,
  useSaveAttendanceMutation,
  useGetCertificatesQuery,
  useIssueCertificateMutation,
  useGetJobsQuery,
  usePostJobMutation,
  useToggleJobMutation,
  useGetApplicationsQuery,
  useApplyJobMutation,
  useSetApplicationStatusMutation,
  useGetLiveClassesQuery,
  useScheduleClassMutation,
  useUpdateLiveClassMutation,
  useGetPaymentsQuery,
  useRecordPaymentMutation,
  useRefundPaymentMutation
} from '@/store/api';
// The active language's dictionary arrives from the server layout (only one
// language ships to the browser; switching language refreshes from the server).
const DictContext = createContext({});

// Restores the persisted auth session once the store is mounted.
function AuthHydrator({ children, skip }) {
  const dispatch = useDispatch();
  // The server layout already handed us the session; only ask the API when it didn't.
  useEffect(() => { if (!skip) dispatch(hydrateAuth()); }, [dispatch, skip]);
  return children;
}

// initialAuth / initialLang come from the server layout (session cookie +
// language cookie), so the first client render already knows who's here.
export function AppProvider({ children, initialAuth, initialLang, dict }) {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = makeStore(initialAuth !== undefined
      ? { auth: initialAuth, authReady: true, lang: initialLang === 'en' ? 'en' : 'bn' }
      : { lang: initialLang === 'en' ? 'en' : 'bn' });
  }
  return (
    <Provider store={storeRef.current}>
      <DictContext.Provider value={dict || {}}>
        <AuthHydrator skip={initialAuth !== undefined}>{children}</AuthHydrator>
      </DictContext.Provider>
    </Provider>
  );
}

// Facade hook — preserves the original context API on top of Redux + RTK Query,
// so existing components consume it unchanged.
export function useApp() {
  const dispatch = useDispatch();
  const { lang, auth, authReady, centerName, brandColor, payModel, toast, studentPaid } = useSelector((s) => s.ui);

  // REST data via RTK Query (deduped/cached globally). Each dataset is only
  // requested by a role allowed to read it — visitors no longer pull staff
  // rosters, and students only ever receive their own rows (the API scopes
  // them server-side regardless).
  const role = auth?.role;
  const isStaff = role === 'owner' || role === 'teacher' || role === 'superadmin';
  const isAdmin = role === 'owner' || role === 'superadmin';
  const isStudent = role === 'student';
  const signedIn = !!auth;
  const ready = authReady;
  const opt = (allowed) => ({ skip: !ready || !allowed });
  const sq = useGetStudentsQuery(undefined, opt(isStaff));
  // Visitors never load rosters/catalog datasets: no public component needs them.
  const bq = useGetBatchesQuery(undefined, opt(signedIn));
  const tq = useGetTeachersQuery(undefined, opt(isStaff));
  const tnq = useGetTenantsQuery(undefined, opt(isAdmin));
  const cq = useGetCoursesQuery(undefined, opt(signedIn));
  const eq = useGetEnrollmentsQuery(undefined, opt(signedIn));
  const subq = useGetSubmissionsQuery(undefined, opt(isStudent || isStaff));
  const aq = useGetAttendanceQuery(undefined, opt(isStudent || isStaff));
  const ceq = useGetCertificatesQuery(undefined, opt(isStudent || isStaff));
  const jq = useGetJobsQuery(undefined, opt(signedIn));
  const apq = useGetApplicationsQuery(undefined, opt(isStudent || isStaff));
  const lcq = useGetLiveClassesQuery(undefined, opt(signedIn));
  const { data: payments = [] } = useGetPaymentsQuery(undefined, opt(isStaff));
  const all = [sq, bq, tq, tnq, cq, eq, subq, aq, ceq, jq, apq, lcq];
  const students = sq.data || [], batches = bq.data || [], teachers = tq.data || [], tenants = tnq.data || [];
  const courses = cq.data || [], enrollments = eq.data || [], submissions = subq.data || [], attendance = aq.data || [];
  const certificates = ceq.data || [], jobs = jq.data || [], applications = apq.data || [], liveClasses = lcq.data || [];
  const refetchCourses = cq.refetch;
  // loaded = every dataset this role may read has arrived (skipped ones
  // count as done; a failed one too, so a single error can't hang a page).
  const loaded = ready && all.every((x) => x.isUninitialized || x.isSuccess || x.isError);

  // mutation triggers
  const [addStudent] = useAddStudentMutation();
  const [importStudents] = useImportStudentsMutation();
  const [setStudentPaid] = useSetStudentPaidMutation();
  const [addBatch] = useAddBatchMutation();
  const [addTeacher] = useAddTeacherMutation();
  const [assignTeacher] = useAssignTeacherMutation();
  const [removeTeacherBatch] = useRemoveTeacherBatchMutation();
  const [toggleTenant] = useToggleTenantMutation();
  const [addCourse] = useAddCourseMutation();
  const [courseOp] = useCourseOpMutation();
  const [createQuiz] = useCreateQuizMutation();
  const [setBatchCourse] = useSetBatchCourseMutation();
  const [enroll] = useEnrollMutation();
  const [unenroll] = useUnenrollMutation();
  const [submitAssignment] = useSubmitAssignmentMutation();
  const [gradeSubmission] = useGradeSubmissionMutation();
  const [saveAttendance] = useSaveAttendanceMutation();
  const [issueCertificate] = useIssueCertificateMutation();
  const [postJob] = usePostJobMutation();
  const [toggleJob] = useToggleJobMutation();
  const [applyJob] = useApplyJobMutation();
  const [setApplicationStatus] = useSetApplicationStatusMutation();
  const [scheduleClass] = useScheduleClassMutation();
  const [updateLiveClass] = useUpdateLiveClassMutation();
  const [recordPayment] = useRecordPaymentMutation();
  const [refundPayment] = useRefundPaymentMutation();

  const api = useMemo(() => ({
    addStudent: (payload) => addStudent(payload).unwrap(),
    importStudents: (rows) => importStudents(rows).unwrap(),
    setStudentPaid: (id, paid) => setStudentPaid({ id, paid }).unwrap(),
    addBatch: (payload) => addBatch(payload).unwrap(),
    setBatchCourse: (id, courseId) => setBatchCourse({ id, courseId }).unwrap(),
    addTeacher: (payload) => addTeacher(payload).unwrap(),
    assignTeacher: (id, batchName) => assignTeacher({ id, batchName }).unwrap(),
    removeTeacherBatch: (id, batchName) => removeTeacherBatch({ id, batchName }).unwrap(),
    toggleTenant: (id) => toggleTenant({ id }).unwrap(),
    // curriculum
    courseOp: (body) => courseOp(body).unwrap(),
    refetchCourses: () => refetchCourses(),
    addCourse: (title) => addCourse({ title }).unwrap(),
    toggleCoursePublish: (courseId) => courseOp({ op: 'publish', courseId }).unwrap(),
    toggleCourseFeatured: (courseId) => courseOp({ op: 'toggleFeatured', courseId }).unwrap(),
    addModule: (courseId, title) => courseOp({ op: 'addModule', courseId, title }).unwrap(),
    deleteModule: (courseId, moduleId) => courseOp({ op: 'deleteModule', courseId, moduleId }).unwrap(),
    addLesson: (courseId, moduleId, title, type) => courseOp({ op: 'addLesson', courseId, moduleId, title, type }).unwrap(),
    deleteLesson: (courseId, moduleId, lessonId) => courseOp({ op: 'deleteLesson', courseId, moduleId, lessonId }).unwrap(),
    updateCourse: (courseId, patch) => courseOp({ op: 'updateCourse', courseId, ...patch }).unwrap(),
    deleteCourse: (courseId) => courseOp({ op: 'deleteCourse', courseId }).unwrap(),
    // publishing workflow — submit is owner, approve/reject is superadmin-only.
    // Plain fetch (not an RTK mutation), so refetch the cached course list
    // ourselves — otherwise the review-status badge would only update after
    // an unrelated cache invalidation elsewhere.
    courseReviewAction: async (courseId, action, note) => {
      const res = await fetch(`/api/courses/${courseId}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      refetchCourses();
      return data;
    },
    getReviewQueue: async () => {
      const res = await fetch('/api/courses/review-queue');
      if (!res.ok) return [];
      return res.json();
    },
    // thumbnail: presigned upload straight to the bucket, then confirm
    requestThumbnailUploadUrl: async (courseId, fileName, contentType) => {
      const res = await fetch(`/api/courses/${courseId}/thumbnail/upload-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName, contentType })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { uploadUrl, key }
    },
    confirmThumbnail: async (courseId, key) => {
      const res = await fetch(`/api/courses/${courseId}/thumbnail`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      refetchCourses();
      return data;
    },
    renameModule: (courseId, moduleId, title) => courseOp({ op: 'renameModule', courseId, moduleId, title }).unwrap(),
    renameLesson: (courseId, moduleId, lessonId, title) => courseOp({ op: 'renameLesson', courseId, moduleId, lessonId, title }).unwrap(),
    toggleLessonFree: (courseId, moduleId, lessonId) => courseOp({ op: 'toggleFree', courseId, moduleId, lessonId }).unwrap(),
    moveLesson: (courseId, moduleId, lessonId, dir) => courseOp({ op: 'moveLesson', courseId, moduleId, lessonId, dir }).unwrap(),
    reorderLessons: (courseId, moduleId, order) => courseOp({ op: 'reorderLessons', courseId, moduleId, order }).unwrap(),
    // enrollments
    enroll: (studentId, batchId) => enroll({ studentId, batchId }).unwrap(),
    unenroll: (id) => unenroll({ id }).unwrap(),
    // submissions
    submitAssignment: (payload) => submitAssignment(payload).unwrap(),
    gradeSubmission: (id, marks, feedback) => gradeSubmission({ id, marks, feedback }).unwrap(),
    createAssignment: async (moduleId, title) => {
      const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moduleId, title }) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    // attendance
    saveAttendance: (payload) => saveAttendance(payload).unwrap(),
    // certificates
    issueCertificate: (studentId, courseId, studentName) => issueCertificate({ studentId, courseId, studentName }).unwrap(),
    // career portal
    postJob: (payload) => postJob(payload).unwrap(),
    toggleJob: (id) => toggleJob({ id }).unwrap(),
    applyJob: (jobId, studentId, studentName) => applyJob({ jobId, studentId, studentName }).unwrap(),
    setApplicationStatus: (id, status) => setApplicationStatus({ id, status }).unwrap(),
    // live classes
    scheduleClass: (payload) => scheduleClass(payload).unwrap(),
    startClass: (id) => updateLiveClass({ id, action: 'start' }).unwrap(),
    endClass: (id) => updateLiveClass({ id, action: 'end' }).unwrap(),
    setRecording: (id, recordingUrl) => updateLiveClass({ id, recordingUrl }).unwrap(),
    // server-verified join: returns { url } if allowed, else throws { status, data }
    joinClass: async (id, studentId) => {
      const res = await fetch(`/api/live-classes/${id}/join?studentId=${studentId}`);
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { url }
    },
    // payments (staff-only manual fee recording — real checkout is createOrder below)
    recordPayment: (payload) => recordPayment(payload).unwrap(),
    refundPayment: (id) => refundPayment({ id }).unwrap(),
    // real marketplace orders (Phase 3) — distinct from the legacy manual
    // payments ledger above.
    getOrders: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) return [];
      return res.json();
    },
    refundOrder: async (orderId) => {
      const res = await fetch(`/api/orders/${orderId}/refund`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    getAuditLog: async (action) => {
      const res = await fetch(`/api/audit-log${action ? `?action=${action}` : ''}`);
      if (!res.ok) return [];
      return res.json();
    },
    // real checkout: server computes price + coupon, creates a pending order,
    // and either enrolls immediately (free) or returns a bKash redirect URL.
    // payload: { courseId } or { items: [{courseId}], couponCode?, affiliateCode? }
    createOrder: async (payload) => {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { order, paid: true } or { order, bkashURL }
    },
    // quizzes (imperative fetch — quiz data is lesson-scoped, not a global collection)
    getQuiz: async (lessonId, mode) => {
      const res = await fetch(`/api/quizzes?lessonId=${lessonId}${mode ? `&mode=${mode}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    saveQuiz: async (lessonId, questions) => {
      const res = await fetch('/api/quizzes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, questions })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    // create a fresh quiz-type lesson (teacher/owner) → returns { lessonId, moduleId }
    createQuiz: (payload) => createQuiz(payload).unwrap(),
    submitQuiz: async (lessonId, answers) => {
      const res = await fetch('/api/quizzes/attempt', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, answers })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { score, maxScore }
    },
    getQuizResults: async (lessonId) => {
      const res = await fetch(`/api/quizzes/results?lessonId=${lessonId}`);
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    // notifications
    getNotifications: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return [];
      return res.json();
    },
    markNotifications: async (payload) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) return [];
      return res.json();
    },
    announce: async (title, body) => {
      const res = await fetch('/api/notifications/announce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { sent }
    },
    // coupons
    validateCoupon: async (code, amount) => {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, amount })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data; // { discount, finalAmount }
    },
    getCoupons: async () => {
      const res = await fetch('/api/coupons');
      if (!res.ok) return [];
      return res.json();
    },
    createCoupon: async (payload) => {
      const res = await fetch('/api/coupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    toggleCoupon: async (id, active) => {
      const res = await fetch('/api/coupons', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active })
      });
      if (!res.ok) return [];
      return res.json();
    },
    deleteCoupon: async (id) => {
      const res = await fetch('/api/coupons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      });
      if (!res.ok) return [];
      return res.json();
    },
    // reports
    getReport: async (type) => {
      const res = await fetch(`/api/reports?type=${type}`);
      if (!res.ok) return { columns: [], rows: [], summary: {} };
      return res.json();
    },
    // reviews
    submitReview: async (courseId, rating, text) => {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, rating, text })
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    getReviews: async () => {
      const res = await fetch('/api/reviews');
      if (!res.ok) return [];
      return res.json();
    },
    setReviewStatus: async (id, status) => {
      const res = await fetch('/api/reviews', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
      });
      if (!res.ok) return [];
      return res.json();
    },
    setReviewFeatured: async (id, featured) => {
      const res = await fetch('/api/reviews', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, featured })
      });
      if (!res.ok) return [];
      return res.json();
    },
    // blog
    getPosts: async (all) => {
      const res = await fetch(`/api/blog${all ? '?all=1' : ''}`);
      if (!res.ok) return [];
      return res.json();
    },
    getPost: async (slug) => {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    savePost: async (payload) => {
      const method = payload.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/blog', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    deletePost: async (id) => {
      const res = await fetch('/api/blog', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      });
      if (!res.ok) return [];
      return res.json();
    },
    // contact
    sendContact: async (payload) => {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return data;
    },
    getMessages: async () => {
      const res = await fetch('/api/contact');
      if (!res.ok) return [];
      return res.json();
    },
    markMessage: async (payload) => {
      const res = await fetch('/api/contact', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) return [];
      return res.json();
    },
    // homepage CMS
    getHomepage: async () => {
      const res = await fetch('/api/homepage');
      if (!res.ok) return {};
      return res.json();
    },
    saveHomepage: async (section, data) => {
      const res = await fetch('/api/homepage', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section, data })
      });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    // learning paths
    getPaths: async () => {
      const res = await fetch('/api/paths');
      if (!res.ok) return [];
      return res.json();
    },
    createPath: async (payload) => {
      const res = await fetch('/api/paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    setPathCourse: async (pathId, courseId, remove) => {
      const res = await fetch('/api/paths', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pathId, courseId, remove }) });
      if (!res.ok) return [];
      return res.json();
    },
    deletePath: async (id) => {
      const res = await fetch('/api/paths', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) return [];
      return res.json();
    },
    // per-lesson Q&A
    getThread: async (lessonId) => {
      const res = await fetch(`/api/qa?lessonId=${lessonId}`);
      if (!res.ok) return [];
      return res.json();
    },
    askQuestion: async (lessonId, body) => {
      const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, body }) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    postAnswer: async (questionId, body) => {
      const res = await fetch('/api/qa/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId, body }) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    // referral
    getReferral: async () => {
      const res = await fetch('/api/referrals');
      if (!res.ok) return { code: '', count: 0, referred: [] };
      return res.json();
    },
    // affiliates (admin)
    getAffiliates: async () => {
      const res = await fetch('/api/affiliates');
      if (!res.ok) return [];
      return res.json();
    },
    createAffiliate: async (payload) => {
      const res = await fetch('/api/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    toggleAffiliate: async (id, active) => {
      const res = await fetch('/api/affiliates', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active }) });
      if (!res.ok) return [];
      return res.json();
    },
    deleteAffiliate: async (id) => {
      const res = await fetch('/api/affiliates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) return [];
      return res.json();
    },
    // free demo classes
    getDemoClasses: async (status) => {
      const res = await fetch(`/api/demo-classes${status ? `?status=${status}` : ''}`);
      if (!res.ok) return [];
      return res.json();
    },
    getDemoClass: async (slug) => {
      const res = await fetch(`/api/demo-classes/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    registerDemoClass: async (slug) => {
      const res = await fetch(`/api/demo-classes/${slug}/register`, { method: 'POST' });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    // categories
    getCategories: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) return [];
      return res.json();
    },
    createCategory: async (payload) => {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    deleteCategory: async (id) => {
      const res = await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) return [];
      return res.json();
    },
    // user management
    getUsers: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      return res.json();
    },
    setUserRole: async (id, role) => {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
      if (!res.ok) return [];
      return res.json();
    },
    setUserStatus: async (id, status) => {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (!res.ok) return [];
      return res.json();
    },
    setUserSections: async (id, sections) => {
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, sections }) });
      if (!res.ok) return [];
      return res.json();
    },
    createStaff: async (payload) => {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    changePassword: async (oldPassword, newPassword) => {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    },
    // site settings
    getSettings: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      return res.json();
    },
    saveSettings: async (patch) => {
      const res = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const out = await res.json();
      if (!res.ok) throw { status: res.status, data: out };
      return out;
    }
  }), [addStudent, importStudents, setStudentPaid, addBatch, setBatchCourse, addTeacher, assignTeacher, removeTeacherBatch, toggleTenant, addCourse, courseOp, createQuiz, enroll, unenroll, submitAssignment, gradeSubmission, saveAttendance, issueCertificate, postJob, toggleJob, applyJob, setApplicationStatus, scheduleClass, updateLiveClass, recordPayment, refundPayment]);

  // demo CSV rows for the owner's "Import Excel/CSV" button
  const DEMO_CSV_ROWS = useMemo(() => ([
    { name: 'ইয়াসিন আরাফাত', phone: '01711-445566', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500 },
    { name: 'তাসনিয়া রহমান', phone: '01822-334455', batch: 'SSC গণিত — সকাল', amount: 1200 },
    { name: 'সাদিয়া আফরিন', phone: '01933-221100', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500 }
  ]), []);

  const router = useRouter();
  // Language lives in a cookie too, so server-rendered pages follow the toggle.
  const persistLang = useCallback((l) => {
    try { document.cookie = `leo_lang=${l}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignore */ }
    try { document.documentElement.lang = l; } catch { /* ignore */ }
    router.refresh();
  }, [router]);
  const toggleLang = useCallback(() => {
    const next = lang === 'bn' ? 'en' : 'bn';
    dispatch(setLangAction(next));
    persistLang(next);
  }, [dispatch, lang, persistLang]);
  const setLang = useCallback((l) => { dispatch(setLangAction(l)); persistLang(l); }, [dispatch, persistLang]);
  const login = useCallback((email, password) => dispatch(loginThunk(email, password)), [dispatch]);
  const register = useCallback((payload) => dispatch(registerThunk(payload)), [dispatch]);
  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);
  const setCenterName = useCallback((v) => dispatch(setCenterNameAction(v)), [dispatch]);
  const setBrandColor = useCallback((v) => dispatch(setBrandColorAction(v)), [dispatch]);
  const setPayModel = useCallback((v) => dispatch(setPayModelAction(v)), [dispatch]);
  const showToast = useCallback((msg, kind) => dispatch(showToastThunk(msg, kind)), [dispatch]);
  // merge fields into the signed-in user (e.g. a new avatarUrl) without a refetch
  const patchAuth = useCallback((patch) => dispatch(setAuth(auth ? { ...auth, ...patch } : auth)), [dispatch, auth]);
  // client-only student payment flag (student PayModal → parent/ClassesTab read it)
  const setStudentPaidFlagCb = useCallback((v) => dispatch(setStudentPaidFlag(v)), [dispatch]);

  // top-level mutation helpers (original context shape, consumed by owner/student components)
  const importStudentsCsv = useCallback(async () => {
    await api.importStudents(DEMO_CSV_ROWS);
    return DEMO_CSV_ROWS; // components use the count of newly-added rows
  }, [api, DEMO_CSV_ROWS]);
  const markStudentPaid = useCallback((id) => api.setStudentPaid(id, true), [api]);

  // ---------- wishlist (shared course-id set for the logged-in student) ----------
  const [wishlist, setWishlist] = useState([]);
  useEffect(() => {
    if (auth?.studentId) {
      fetch('/api/wishlist').then((r) => (r.ok ? r.json() : [])).then(setWishlist).catch(() => setWishlist([]));
    } else {
      setWishlist([]);
    }
  }, [auth?.studentId]);
  const toggleWishlist = useCallback(async (courseId) => {
    const saved = wishlist.includes(courseId);
    const res = await fetch('/api/wishlist', {
      method: saved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    });
    if (res.ok) setWishlist(await res.json());
  }, [wishlist]);

  // ---------- shopping cart (Redux-backed so every component shares one cart) ----------
  const cart = useSelector((s) => s.ui.cart);
  const cartOpen = useSelector((s) => s.ui.cartOpen);
  useEffect(() => { dispatch(hydrateCart()); }, [dispatch]);
  const isInCart = useCallback((courseId) => cart.some((x) => x.id === courseId), [cart]);
  const addToCart = useCallback((course) => dispatch(addToCartThunk(course)), [dispatch]);
  const removeFromCart = useCallback((courseId) => dispatch(removeFromCartThunk(courseId)), [dispatch]);
  const clearCart = useCallback(() => dispatch(clearCartThunk()), [dispatch]);
  const setCartOpen = useCallback((open) => dispatch(setCartOpenAction(open)), [dispatch]);
  const cartCount = cart.length;
  const cartTotal = cart.reduce((a, x) => a + Number(x.price || 0), 0);

  const t = useContext(DictContext);
  const centerDisplay = centerName.trim() || 'আলোর পথ কোচিং';
  const slug = centerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'alorpath';

  return {
    lang, setLang, toggleLang, t,
    auth, authReady, login, register, logout, patchAuth,
    centerName, setCenterName, centerDisplay, slug,
    brandColor, setBrandColor,
    payModel, setPayModel,
    students, batches, teachers, tenants, courses, enrollments, submissions, attendance, certificates, jobs, applications, liveClasses, payments, loaded,
    toast, showToast,
    // wishlist (student)
    wishlist, toggleWishlist,
    // shopping cart (e-commerce)
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, clearCart, isInCart, cartCount, cartTotal,
    // client-only student payment flag
    studentPaid, setStudentPaid: setStudentPaidFlagCb,
    // top-level mutation helpers (original context shape)
    addStudent: api.addStudent,
    importStudentsCsv,
    markStudentPaid,
    addBatch: api.addBatch,
    setBatchCourse: api.setBatchCourse,
    addTeacher: api.addTeacher,
    assignTeacher: api.assignTeacher,
    removeTeacherBatch: api.removeTeacherBatch,
    toggleTenant: api.toggleTenant,
    api
  };
}
