// ============================================================
// Role-Based Access Control — single source of truth.
// Permissions are `resource:action`. `*` is a wildcard for either half,
// so 'students:*' grants every students action and '*:*' grants everything.
// Shared by the server (route guards) and the client (UI gating), so it
// must stay plain JS with no Node/browser-only imports.
// ============================================================

export const ROLES = ['student', 'teacher', 'staff', 'owner', 'superadmin'];

// Staff roles share the admin console; what they see is decided per section.
export const STAFF_ROLES = ['teacher', 'staff', 'owner', 'superadmin'];

// Where each role lands after login. Owner + teacher share ONE merged dashboard
// (/owner); the teacher just sees a subset of its sections (see STAFF_SECTIONS).
export const ROLE_HOME = {
  student: '/student',
  teacher: '/owner',
  staff: '/owner',
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
  staff: ['courses:read', 'batches:read'],
  student: [
    'courses:read', 'batches:read',
    'enrollments:self', 'submissions:self', 'certificates:self',
    'payments:self', 'liveclasses:join', 'applications:self'
  ]
};

// ---------- dashboard sections ----------
// Every section (tab) of the admin console, in sidebar order.
export const ALL_SECTIONS = [
  'dash', 'analytics', 'activity', 'courses', 'categories', 'levels', 'paths', 'batches', 'students', 'teachers',
  'enroll', 'classes', 'attendance', 'submissions', 'quizzes', 'fees', 'payments',
  'offers', 'coupons', 'campaigns', 'affiliates', 'reviews', 'blog', 'homepage', 'messages', 'reports',
  'users', 'access', 'announce', 'settings'
];

// Access levels per section: `view` = read-only, `manage` = create/edit/delete.
export const LEVELS = ['view', 'manage'];

// Sections an owner can grant to a staff or teacher account. User and access
// management stay with owners/superadmins so nobody can grant themselves more.
export const OWNER_ONLY_SECTIONS = ['users', 'access'];
export const GRANTABLE_SECTIONS = ALL_SECTIONS.filter((s) => !OWNER_ONLY_SECTIONS.includes(s));
// Kept for older callers: the classic teacher set.
export const STAFF_SECTIONS = ['dash', 'students', 'classes', 'attendance', 'submissions', 'quizzes', 'announce'];

// Stored grants are a comma list: "students:view,quizzes:manage". A bare
// section name (older rows) means manage, which is what it allowed before.
export function parseGrants(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
  const out = {};
  for (const item of list) {
    const [sec, lvl] = String(item).trim().split(':');
    if (!sec || !GRANTABLE_SECTIONS.includes(sec)) continue;
    const level = lvl === 'view' ? 'view' : 'manage';
    if (out[sec] !== 'manage') out[sec] = level;
  }
  return out;
}

export function serializeGrants(grants) {
  return Object.entries(grants || {})
    .filter(([sec, lvl]) => GRANTABLE_SECTIONS.includes(sec) && LEVELS.includes(lvl))
    .map(([sec, lvl]) => `${sec}:${lvl}`).join(',');
}

const isOwnerish = (session) => session?.role === 'owner' || session?.role === 'superadmin';

// The access level a session has on a section: 'manage', 'view' or null.
export function levelFor(session, section) {
  if (!session) return null;
  if (isOwnerish(session)) return 'manage';
  if (session.role !== 'teacher' && session.role !== 'staff') return null;
  return parseGrants(session.sections)[section] || null;
}

export function canAccess(session, section, level = 'view') {
  const have = levelFor(session, section);
  return have === 'manage' || (have === 'view' && level === 'view');
}

// Sections a session may open, in sidebar order.
export function sectionsForSession(session) {
  if (!session) return [];
  if (isOwnerish(session)) return ALL_SECTIONS;
  return ALL_SECTIONS.filter((s) => levelFor(session, s));
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
