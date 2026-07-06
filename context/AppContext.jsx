'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
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
  logout as logoutThunk,
  showToast as showToastThunk,
  hydrateAuth
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
import { T } from '@/lib/i18n';

// Restores the persisted auth session once the store is mounted.
function AuthHydrator({ children }) {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(hydrateAuth()); }, [dispatch]);
  return children;
}

export function AppProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = makeStore();
  return (
    <Provider store={storeRef.current}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}

// Facade hook — preserves the original context API on top of Redux + RTK Query,
// so existing components consume it unchanged.
export function useApp() {
  const dispatch = useDispatch();
  const { lang, auth, centerName, brandColor, payModel, toast, studentPaid } = useSelector((s) => s.ui);

  // REST data via RTK Query (deduped/cached globally)
  const { data: students = [], isSuccess: sOk } = useGetStudentsQuery();
  const { data: batches = [], isSuccess: bOk } = useGetBatchesQuery();
  const { data: teachers = [], isSuccess: tOk } = useGetTeachersQuery();
  const { data: tenants = [], isSuccess: tnOk } = useGetTenantsQuery();
  const { data: courses = [], isSuccess: cOk } = useGetCoursesQuery();
  const { data: enrollments = [], isSuccess: eOk } = useGetEnrollmentsQuery();
  const { data: submissions = [], isSuccess: subOk } = useGetSubmissionsQuery();
  const { data: attendance = [], isSuccess: aOk } = useGetAttendanceQuery();
  const { data: certificates = [], isSuccess: ceOk } = useGetCertificatesQuery();
  const { data: jobs = [], isSuccess: jOk } = useGetJobsQuery();
  const { data: applications = [], isSuccess: apOk } = useGetApplicationsQuery();
  const { data: liveClasses = [], isSuccess: lcOk } = useGetLiveClassesQuery();
  const { data: payments = [], isSuccess: pOk } = useGetPaymentsQuery();
  const loaded = sOk && bOk && tOk && tnOk && cOk && eOk && subOk && aOk && ceOk && jOk && apOk && lcOk && pOk;

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
    addCourse: (title) => addCourse({ title }).unwrap(),
    toggleCoursePublish: (courseId) => courseOp({ op: 'publish', courseId }).unwrap(),
    addModule: (courseId, title) => courseOp({ op: 'addModule', courseId, title }).unwrap(),
    deleteModule: (courseId, moduleId) => courseOp({ op: 'deleteModule', courseId, moduleId }).unwrap(),
    addLesson: (courseId, moduleId, title, type) => courseOp({ op: 'addLesson', courseId, moduleId, title, type }).unwrap(),
    deleteLesson: (courseId, moduleId, lessonId) => courseOp({ op: 'deleteLesson', courseId, moduleId, lessonId }).unwrap(),
    // enrollments
    enroll: (studentId, batchId) => enroll({ studentId, batchId }).unwrap(),
    unenroll: (id) => unenroll({ id }).unwrap(),
    // submissions
    submitAssignment: (payload) => submitAssignment(payload).unwrap(),
    gradeSubmission: (id, marks, feedback) => gradeSubmission({ id, marks, feedback }).unwrap(),
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
    // payments
    recordPayment: (payload) => recordPayment(payload).unwrap(),
    refundPayment: (id) => refundPayment({ id }).unwrap()
  }), [addStudent, importStudents, setStudentPaid, addBatch, setBatchCourse, addTeacher, assignTeacher, removeTeacherBatch, toggleTenant, addCourse, courseOp, enroll, unenroll, submitAssignment, gradeSubmission, saveAttendance, issueCertificate, postJob, toggleJob, applyJob, setApplicationStatus, scheduleClass, updateLiveClass, recordPayment, refundPayment]);

  // demo CSV rows for the owner's "Import Excel/CSV" button
  const DEMO_CSV_ROWS = useMemo(() => ([
    { name: 'ইয়াসিন আরাফাত', phone: '01711-445566', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500 },
    { name: 'তাসনিয়া রহমান', phone: '01822-334455', batch: 'SSC গণিত — সকাল', amount: 1200 },
    { name: 'সাদিয়া আফরিন', phone: '01933-221100', batch: 'HSC ফিজিক্স — ব্যাচ ৩', amount: 1500 }
  ]), []);

  const setLang = useCallback((l) => dispatch(setLangAction(l)), [dispatch]);
  const toggleLang = useCallback(() => dispatch(toggleLangAction()), [dispatch]);
  const login = useCallback((role, name) => dispatch(loginThunk(role, name)), [dispatch]);
  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);
  const setCenterName = useCallback((v) => dispatch(setCenterNameAction(v)), [dispatch]);
  const setBrandColor = useCallback((v) => dispatch(setBrandColorAction(v)), [dispatch]);
  const setPayModel = useCallback((v) => dispatch(setPayModelAction(v)), [dispatch]);
  const showToast = useCallback((msg) => dispatch(showToastThunk(msg)), [dispatch]);
  // client-only student payment flag (student PayModal → parent/ClassesTab read it)
  const setStudentPaidFlagCb = useCallback((v) => dispatch(setStudentPaidFlag(v)), [dispatch]);

  // top-level mutation helpers (original context shape, consumed by owner/student components)
  const importStudentsCsv = useCallback(async () => {
    await api.importStudents(DEMO_CSV_ROWS);
    return DEMO_CSV_ROWS; // components use the count of newly-added rows
  }, [api, DEMO_CSV_ROWS]);
  const markStudentPaid = useCallback((id) => api.setStudentPaid(id, true), [api]);

  const t = T[lang];
  const centerDisplay = centerName.trim() || 'আলোর পথ কোচিং';
  const slug = centerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'alorpath';

  return {
    lang, setLang, toggleLang, t,
    auth, login, logout,
    centerName, setCenterName, centerDisplay, slug,
    brandColor, setBrandColor,
    payModel, setPayModel,
    students, batches, teachers, tenants, courses, enrollments, submissions, attendance, certificates, jobs, applications, liveClasses, payments, loaded,
    toast, showToast,
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
