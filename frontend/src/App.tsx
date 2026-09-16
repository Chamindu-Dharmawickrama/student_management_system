import { lazy, Suspense, useEffect, useRef } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { useAppDispatch } from "./app/hooks";
import { restoreSession } from "./features/auth/slices/authSlice";
import { USER_ROLES } from "./constants/app.constants";
import { ProtectedRoute } from "./shared/guards/ProtectedRoute";
import { GuestRoute } from "./shared/guards/GuestRoute";
import { RoleRedirect } from "./shared/guards/RoleRedirect";
import { AppLayout, AuthLayout } from "./shared/components/layout";
import { Spinner } from "./shared/components/ui";

import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./features/auth/pages/ResetPasswordPage"));
const ChangePasswordPage = lazy(() => import("./features/auth/pages/ChangePasswordPage"));
const AccountPage = lazy(() => import("./features/auth/pages/AccountPage"));

const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const StudentListPage = lazy(() => import("./features/students/pages/StudentListPage"));
const StudentFormPage = lazy(() => import("./features/students/pages/StudentFormPage"));
const StudentDetailPage = lazy(() => import("./features/students/pages/StudentDetailPage"));

const TeacherListPage = lazy(() => import("./features/teachers/pages/TeacherListPage"));
const TeacherFormPage = lazy(() => import("./features/teachers/pages/TeacherFormPage"));
const TeacherDetailPage = lazy(() => import("./features/teachers/pages/TeacherDetailPage"));

const AcademicYearsList = lazy(() => import("./features/academicYear/pages/AcademicYearsList"));
const AcademicYearDetail = lazy(() => import("./features/academicYear/pages/AcademicYearDetail"));
const ExamDetail = lazy(() => import("./features/academicYear/pages/ExamDetail"));

const SubjectsList = lazy(() => import("./features/subjects/pages/SubjectsList"));

const ClassesList = lazy(() => import("./features/classes/pages/ClassesList"));
const ClassDetail = lazy(() => import("./features/classes/pages/ClassDetail"));

const GradeBandsList = lazy(() => import("./features/gradeBands/pages/GradeBandsList"));

const StudentDashboardPage = lazy(() => import("./features/studentPortal/pages/StudentDashboardPage"));
const StudentMarksPage = lazy(() => import("./features/studentPortal/pages/StudentMarksPage"));
const StudentSubjectsPage = lazy(() => import("./features/studentPortal/pages/StudentSubjectsPage"));
const StudentReportPage = lazy(() => import("./features/studentPortal/pages/StudentReportPage"));
const StudentProfilePage = lazy(() => import("./features/studentPortal/pages/StudentProfilePage"));

const AdminDashboardPage = lazy(() => import("./features/dashboard/pages/AdminDashboardPage"));
const MarkSheetListPage = lazy(() => import("./features/markSheets/pages/MarkSheetListPage"));
const MarkSheetDetailPage = lazy(() => import("./features/markSheets/pages/MarkSheetDetailPage"));
const ReportsPage = lazy(() => import("./features/reports/pages/ReportsPage"));

const TeacherDashboardPage = lazy(() => import("./features/teacherPortal/pages/TeacherDashboardPage"));
const TeacherClassesPage = lazy(() => import("./features/teacherPortal/pages/TeacherClassesPage"));
const TeacherStudentsPage = lazy(() => import("./features/teacherPortal/pages/TeacherStudentsPage"));
const GradebookPage = lazy(() => import("./features/teacherPortal/pages/GradebookPage"));
const TeacherMarksheetsPage = lazy(() => import("./features/teacherPortal/pages/TeacherMarksheetsPage"));
const TeacherMarksheetDetailPage = lazy(() => import("./features/teacherPortal/pages/TeacherMarksheetDetailPage"));
const TeacherProfilePage = lazy(() => import("./features/teacherPortal/pages/TeacherProfilePage"));

function FullPageFallback() {
    return <Spinner fullPage message="Loading…" />;
}

export default function App() {
    const dispatch = useAppDispatch();

    // prevent duplicate restore
    const sessionRestored = useRef(false);

    // ensures restoreSession fires exactly once per page load.
    useEffect(() => {
        if (sessionRestored.current) return;
        sessionRestored.current = true;
        dispatch(restoreSession());
    }, [dispatch]);

    return (
        <ErrorBoundary>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-primary)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "var(--shadow-lg)",
                    },
                    success: {
                        iconTheme: {
                            primary: "var(--color-success)",
                            secondary: "var(--color-bg-card)",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "var(--color-danger)",
                            secondary: "var(--color-bg-card)",
                        },
                    },
                }}
            />
            <Suspense fallback={<FullPageFallback />}>
                <Routes>
                    {/* Authenticated shell — any role; mustChangePassword gate lives inside ProtectedRoute */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<RoleRedirect />} />
                        <Route path="account" element={<AccountPage />} />
                        <Route path="403" element={<ForbiddenPage />} />

                        <Route
                            path="admin"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.SCHOOL_ADMIN]}>
                                    <Outlet />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<AdminDashboardPage />} />
                            <Route path="students" element={<StudentListPage />} />
                            <Route path="students/new" element={<StudentFormPage />} />
                            <Route path="students/:id" element={<StudentDetailPage />} />
                            <Route path="students/:id/edit" element={<StudentFormPage />} />
                            <Route path="teachers" element={<TeacherListPage />} />
                            <Route path="teachers/new" element={<TeacherFormPage />} />
                            <Route path="teachers/:id" element={<TeacherDetailPage />} />
                            <Route path="teachers/:id/edit" element={<TeacherFormPage />} />
                            <Route path="classes" element={<ClassesList />} />
                            <Route path="classes/:id" element={<ClassDetail />} />
                            <Route path="subjects" element={<SubjectsList />} />
                            <Route path="academic-years" element={<AcademicYearsList />} />
                            <Route
                                path="academic-years/:id"
                                element={<AcademicYearDetail />}
                            />
                            <Route path="exams/:id" element={<ExamDetail />} />
                            <Route path="grade-bands" element={<GradeBandsList />} />
                            <Route path="marksheets" element={<MarkSheetListPage />} />
                            <Route path="marksheets/:id" element={<MarkSheetDetailPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                        </Route>

                        <Route
                            path="teacher"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                    <Outlet />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<TeacherDashboardPage />} />
                            <Route path="classes" element={<TeacherClassesPage />} />
                            <Route path="students" element={<TeacherStudentsPage />} />
                            <Route path="gradebook" element={<GradebookPage />} />
                            <Route path="marksheets" element={<TeacherMarksheetsPage />} />
                            <Route
                                path="marksheets/:id"
                                element={<TeacherMarksheetDetailPage />}
                            />
                            <Route path="profile" element={<TeacherProfilePage />} />
                        </Route>

                        <Route
                            path="student"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <Outlet />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<StudentDashboardPage />} />
                            <Route path="marks" element={<StudentMarksPage />} />
                            <Route path="subjects" element={<StudentSubjectsPage />} />
                            <Route path="report" element={<StudentReportPage />} />
                            <Route path="profile" element={<StudentProfilePage />} />
                        </Route>
                    </Route>

                    {/* Sibling of the shared shell — forced mode must render with zero app chrome */}
                    <Route
                        path="change-password"
                        element={
                            <ProtectedRoute>
                                <ChangePasswordPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Public */}
                    <Route
                        element={
                            <GuestRoute>
                                <AuthLayout />
                            </GuestRoute>
                        }
                    >
                        <Route path="login" element={<LoginPage />} />
                        <Route path="forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="reset-password" element={<ResetPasswordPage />} />
                    </Route>

                    {/* Public catch-all — reachable regardless of auth state */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}
