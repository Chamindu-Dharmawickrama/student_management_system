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
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));

const AcademicYearsList = lazy(() => import("./features/academicYear/pages/AcademicYearsList"));
const AcademicYearDetail = lazy(() => import("./features/academicYear/pages/AcademicYearDetail"));
const ExamDetail = lazy(() => import("./features/academicYear/pages/ExamDetail"));

const SubjectsList = lazy(() => import("./features/subjects/pages/SubjectsList"));

const ClassesList = lazy(() => import("./features/classes/pages/ClassesList"));
const ClassDetail = lazy(() => import("./features/classes/pages/ClassDetail"));

const GradeBandsList = lazy(() => import("./features/gradeBands/pages/GradeBandsList"));

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
                            primary: "hsl(180, 60%, 50%)",
                            secondary: "#111",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "var(--color-danger)",
                            secondary: "#fff",
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
                            <Route index element={<PlaceholderPage title="Admin Dashboard" />} />
                            <Route path="students" element={<PlaceholderPage title="Students" />} />
                            <Route path="students/new" element={<PlaceholderPage title="New Student" />} />
                            <Route path="students/:id" element={<PlaceholderPage title="Student Detail" />} />
                            <Route path="students/:id/edit" element={<PlaceholderPage title="Edit Student" />} />
                            <Route path="teachers" element={<PlaceholderPage title="Teachers" />} />
                            <Route path="teachers/new" element={<PlaceholderPage title="New Teacher" />} />
                            <Route path="teachers/:id" element={<PlaceholderPage title="Teacher Detail" />} />
                            <Route path="teachers/:id/edit" element={<PlaceholderPage title="Edit Teacher" />} />
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
                            <Route path="marksheets" element={<PlaceholderPage title="Mark Sheets" />} />
                            <Route path="marksheets/:id" element={<PlaceholderPage title="Mark Sheet Detail" />} />
                            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
                        </Route>

                        <Route
                            path="teacher"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                                    <Outlet />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<PlaceholderPage title="Teacher Dashboard" />} />
                            <Route path="classes" element={<PlaceholderPage title="My Classes" />} />
                            <Route path="students" element={<PlaceholderPage title="My Students" />} />
                            <Route path="gradebook" element={<PlaceholderPage title="Gradebook" />} />
                            <Route path="marksheets" element={<PlaceholderPage title="Mark Sheets" />} />
                            <Route
                                path="marksheets/:id"
                                element={<PlaceholderPage title="Mark Sheet Detail" />}
                            />
                        </Route>

                        <Route
                            path="student"
                            element={
                                <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                                    <Outlet />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<PlaceholderPage title="Student Dashboard" />} />
                            <Route path="marks" element={<PlaceholderPage title="My Marks" />} />
                            <Route path="subjects" element={<PlaceholderPage title="My Subjects" />} />
                            <Route path="report" element={<PlaceholderPage title="Report Card" />} />
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
