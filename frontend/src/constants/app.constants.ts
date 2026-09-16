// User roles
export const USER_ROLES = {
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// routes
export const ROUTES = {
  // Public
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Authenticated (any role)
  CHANGE_PASSWORD: '/change-password',
  ACCOUNT: '/account',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',

  // School admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_STUDENT_NEW: '/admin/students/new',
  ADMIN_STUDENT_DETAIL: '/admin/students/:id',
  ADMIN_STUDENT_EDIT: '/admin/students/:id/edit',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_TEACHER_NEW: '/admin/teachers/new',
  ADMIN_TEACHER_DETAIL: '/admin/teachers/:id',
  ADMIN_TEACHER_EDIT: '/admin/teachers/:id/edit',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_CLASS_DETAIL: '/admin/classes/:id',
  ADMIN_SUBJECTS: '/admin/subjects',
  ADMIN_ACADEMIC_YEARS: '/admin/academic-years',
  ADMIN_ACADEMIC_YEAR_DETAIL: '/admin/academic-years/:id',
  ADMIN_EXAM_DETAIL: '/admin/exams/:id',
  ADMIN_GRADE_BANDS: '/admin/grade-bands',
  ADMIN_MARKSHEETS: '/admin/marksheets',
  ADMIN_MARKSHEET_DETAIL: '/admin/marksheets/:id',
  ADMIN_REPORTS: '/admin/reports',

  // Teacher
  TEACHER_DASHBOARD: '/teacher',
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_STUDENTS: '/teacher/students',
  TEACHER_GRADEBOOK: '/teacher/gradebook',
  TEACHER_MARKSHEETS: '/teacher/marksheets',
  TEACHER_MARKSHEET_DETAIL: '/teacher/marksheets/:id',

  // Student
  STUDENT_DASHBOARD: '/student',
  STUDENT_MARKS: '/student/marks',
  STUDENT_SUBJECTS: '/student/subjects',
  STUDENT_REPORT: '/student/report',
} as const;

// Where each role lands on `/` and after login. There is no shared dashboard.
export const ROLE_HOME: Record<UserRole, string> = {
  SCHOOL_ADMIN: ROUTES.ADMIN_DASHBOARD,
  TEACHER: ROUTES.TEACHER_DASHBOARD,
  STUDENT: ROUTES.STUDENT_DASHBOARD,
};

//
export const USERNAME_CONSTRAINTS = {
  MIN: 3,
  MAX: 20,
  PATTERN: /^[a-z0-9_]+$/,
} as const;

// Auth providers
export const AUTH_PROVIDERS = {
  LOCAL: 'local',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
