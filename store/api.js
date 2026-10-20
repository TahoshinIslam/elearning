import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query service hitting the Next.js REST routes under /api.
// Every mutation returns the full updated collection; we rely on tag
// invalidation to refetch the corresponding GET.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Students', 'Batches', 'Teachers', 'Tenants', 'Courses', 'Enrollments', 'Submissions', 'Attendance', 'Certificates', 'Jobs', 'Applications', 'LiveClasses', 'Payments'],
  endpoints: (build) => ({
    // ---------- students ----------
    getStudents: build.query({ query: () => '/students', providesTags: ['Students'] }),
    addStudent: build.mutation({
      query: (body) => ({ url: '/students', method: 'POST', body }),
      invalidatesTags: ['Students']
    }),
    importStudents: build.mutation({
      query: (rows) => ({ url: '/students', method: 'POST', body: { import: rows } }),
      invalidatesTags: ['Students']
    }),
    setStudentPaid: build.mutation({
      query: ({ id, paid }) => ({ url: '/students', method: 'PATCH', body: { id, paid } }),
      invalidatesTags: ['Students']
    }),

    // ---------- batches ----------
    getBatches: build.query({ query: () => '/batches', providesTags: ['Batches'] }),
    addBatch: build.mutation({
      query: (body) => ({ url: '/batches', method: 'POST', body: body || {} }),
      invalidatesTags: ['Batches']
    }),
    setBatchCourse: build.mutation({
      query: ({ id, courseId }) => ({ url: '/batches', method: 'PATCH', body: { id, courseId } }),
      invalidatesTags: ['Batches']
    }),

    // ---------- teachers ----------
    getTeachers: build.query({ query: () => '/teachers', providesTags: ['Teachers'] }),
    addTeacher: build.mutation({
      query: (body) => ({ url: '/teachers', method: 'POST', body: body || {} }),
      invalidatesTags: ['Teachers']
    }),
    assignTeacher: build.mutation({
      query: ({ id, batchName }) => ({ url: '/teachers', method: 'PATCH', body: { id, assign: batchName } }),
      invalidatesTags: ['Teachers']
    }),
    removeTeacherBatch: build.mutation({
      query: ({ id, batchName }) => ({ url: '/teachers', method: 'PATCH', body: { id, remove: batchName } }),
      invalidatesTags: ['Teachers']
    }),

    // ---------- tenants ----------
    getTenants: build.query({ query: () => '/tenants', providesTags: ['Tenants'] }),
    toggleTenant: build.mutation({
      query: ({ id }) => ({ url: '/tenants', method: 'PATCH', body: { id } }),
      invalidatesTags: ['Tenants']
    }),

    // ---------- courses (Course → Module → Lesson) ----------
    // Staff get the full editable list (an array); everyone else gets the
    // public catalog shape { items } — normalised to an array here.
    getCourses: build.query({ query: () => '/courses?all=1', transformResponse: (res) => (Array.isArray(res) ? res : res?.items || []), providesTags: ['Courses'] }),
    addCourse: build.mutation({
      query: (body) => ({ url: '/courses', method: 'POST', body: body || {} }),
      invalidatesTags: ['Courses']
    }),
    // one mutation covers all nested ops: publish / addModule / deleteModule / addLesson / deleteLesson
    courseOp: build.mutation({
      query: (body) => ({ url: '/courses', method: 'PATCH', body }),
      invalidatesTags: ['Courses']
    }),
    // teacher-allowed: create a new quiz-type lesson (refetches Courses so it appears)
    createQuiz: build.mutation({
      query: (body) => ({ url: '/quizzes/lesson', method: 'POST', body }),
      invalidatesTags: ['Courses']
    }),

    // ---------- enrollments (student ↔ batch → course) ----------
    getEnrollments: build.query({ query: () => '/enrollments', providesTags: ['Enrollments'] }),
    enroll: build.mutation({
      query: ({ studentId, batchId }) => ({ url: '/enrollments', method: 'POST', body: { studentId, batchId } }),
      invalidatesTags: ['Enrollments']
    }),
    unenroll: build.mutation({
      query: ({ id }) => ({ url: '/enrollments', method: 'DELETE', body: { id } }),
      invalidatesTags: ['Enrollments']
    }),

    // ---------- submissions (assignment work → grading) ----------
    getSubmissions: build.query({ query: () => '/submissions', providesTags: ['Submissions'] }),
    submitAssignment: build.mutation({
      query: (body) => ({ url: '/submissions', method: 'POST', body }),
      invalidatesTags: ['Submissions']
    }),
    gradeSubmission: build.mutation({
      query: ({ id, marks, feedback }) => ({ url: '/submissions', method: 'PATCH', body: { id, marks, feedback } }),
      invalidatesTags: ['Submissions']
    }),

    // ---------- attendance ----------
    getAttendance: build.query({ query: () => '/attendance', providesTags: ['Attendance'] }),
    saveAttendance: build.mutation({
      query: (body) => ({ url: '/attendance', method: 'POST', body }),
      invalidatesTags: ['Attendance']
    }),

    // ---------- certificates (auto-gated on completion) ----------
    getCertificates: build.query({ query: () => '/certificates', providesTags: ['Certificates'] }),
    issueCertificate: build.mutation({
      query: (body) => ({ url: '/certificates', method: 'POST', body }),
      invalidatesTags: ['Certificates']
    }),

    // ---------- career portal ----------
    getJobs: build.query({ query: () => '/jobs', providesTags: ['Jobs'] }),
    postJob: build.mutation({
      query: (body) => ({ url: '/jobs', method: 'POST', body }),
      invalidatesTags: ['Jobs']
    }),
    toggleJob: build.mutation({
      query: ({ id }) => ({ url: '/jobs', method: 'PATCH', body: { id } }),
      invalidatesTags: ['Jobs']
    }),
    getApplications: build.query({ query: () => '/applications', providesTags: ['Applications'] }),
    applyJob: build.mutation({
      query: ({ jobId, studentId, studentName }) => ({ url: '/applications', method: 'POST', body: { jobId, studentId, studentName } }),
      invalidatesTags: ['Applications']
    }),
    setApplicationStatus: build.mutation({
      query: ({ id, status }) => ({ url: '/applications', method: 'PATCH', body: { id, status } }),
      invalidatesTags: ['Applications']
    }),

    // ---------- live classes ----------
    getLiveClasses: build.query({ query: () => '/live-classes', providesTags: ['LiveClasses'] }),
    scheduleClass: build.mutation({
      query: (body) => ({ url: '/live-classes', method: 'POST', body }),
      invalidatesTags: ['LiveClasses']
    }),
    updateLiveClass: build.mutation({
      query: (body) => ({ url: '/live-classes', method: 'PATCH', body }),
      invalidatesTags: ['LiveClasses']
    }),

    // ---------- payments (transactions / invoices) ----------
    getPayments: build.query({ query: () => '/payments', providesTags: ['Payments'] }),
    recordPayment: build.mutation({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payments']
    }),
    refundPayment: build.mutation({
      query: ({ id }) => ({ url: '/payments', method: 'PATCH', body: { id, action: 'refund' } }),
      invalidatesTags: ['Payments']
    })
  })
});

export const {
  useGetStudentsQuery,
  useAddStudentMutation,
  useImportStudentsMutation,
  useSetStudentPaidMutation,
  useGetBatchesQuery,
  useAddBatchMutation,
  useSetBatchCourseMutation,
  useGetTeachersQuery,
  useAddTeacherMutation,
  useAssignTeacherMutation,
  useRemoveTeacherBatchMutation,
  useGetTenantsQuery,
  useToggleTenantMutation,
  useGetCoursesQuery,
  useAddCourseMutation,
  useCourseOpMutation,
  useCreateQuizMutation,
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
} = api;
