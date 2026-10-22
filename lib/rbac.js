// ============================================================
// Role-Based Access Control — single source of truth.
// Permissions are `resource:action`. `*` is a wildcard for either half,
// so 'students:*' grants every students action and '*:*' grants everything.
// Shared by the server (route guards) and the client (UI gating), so it
// must stay plain JS with no Node/browser-only imports.
// ============================================================

export const ROLES = ['student', 'teacher', 'owner', 'superadmin'];

// Where each role lands after login. Owner + teacher share ONE merged dashboard
// (/owner); the teacher just sees a subset of its sections (see STAFF_SECTIONS).
export const ROLE_HOME = {
  student: '/student',
  teacher: '/owner',
  owner: '/owner',
  superadmin: '/superadmin'
};

// Permission grants per role. Keep additive & explicit.
export const ROLE_PERMISSIONS = {
  superadmin: ['*:*'],
  owner: [
    'students:*', 'batches:*', 'teachers:*', 'courses:*', 'enrollments:*',
    'attendance:read', 'submissions:read', 'certificates:*', 'liveclasses:*',
    'payments:*', 'jobs:*', 'applications:*', 'tenants:read'
  ],
  teacher: [
    'students:read', 'batches:read', 'courses:read',
    'attendance:*', 'submissions:*', 'liveclasses:*', 'certificates:create'
  ],
  student: [
    'courses:read', 'batches:read',
    'enrollments:self', 'submissions:self', 'certificates:self',
    'payments:self', 'liveclasses:join', 'applications:self'
  ]
};

// ---------- dashboard sections ----------
// Every section (tab) of the merged owner/teacher dashboard, in sidebar order.
export const ALL_SECTIONS = [
  'dash', 'courses', 'categories', 'levels', 'paths', 'batches', 'students', 'teachers',
  'enroll', 'classes', 'attendance', 'submissions', 'quizzes', 'fees', 'payments',
  'offers', 'coupons', 'campaigns', 'affiliates', 'reviews', 'blog', 'homepage', 'messages', 'reports',
  'users', 'announce', 'settings'
];

// Sections an owner may grant to a teacher account. These map to features whose
// APIs already work for a non-owner staff member (the rest stay owner-only).
export const STAFF_SECTIONS = ['dash', 'students', 'classes', 'attendance', 'submissions', 'quizzes', 'announce'];

// Resolve the sections a session may see. Owner/superadmin get everything.
export function sectionsForSession(session) {
  if (!session) return [];
  if (session.role === 'owner' || session.role === 'superadmin') return ALL_SECTIONS;
  if (session.role === 'teacher') {
    const granted = Array.isArray(session.sections) ? session.sections : [];
    return STAFF_SECTIONS.filter((s) => granted.includes(s));
  }
  return [];
}

// Flatten a role into its permission list (used to embed in the session).
export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

// Does this permission list satisfy the required `resource:action`?
// Matches exact, resource wildcard (resource:*), action wildcard (*:action),
// and full wildcard (*:*).
export function can(permissions, required) {
  if (!Array.isArray(permissions) || !required) return false;
  const [resource, action] = required.split(':');
  const candidates = [
    required,
    `${resource}:*`,
    `*:${action}`,
    '*:*'
  ];
  return candidates.some((c) => permissions.includes(c));
}

// Convenience: check a role directly (server routes usually hold the role).
export function roleCan(role, required) {
  return can(permissionsFor(role), required);
}
