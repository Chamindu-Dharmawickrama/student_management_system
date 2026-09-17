import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    Briefcase,
    CalendarDays,
    GraduationCap,
    Hash,
    KeyRound,
    LogOut,
    Mail,
    User,
    Users,
} from "lucide-react";
import { ROUTES, USER_ROLES } from "@/constants/app.constants";
import { useGetProfileQuery } from "@/features/profile/api/profileApi";
import { useGetTeacherProfileQuery } from "@/features/teacherPortal/api/teacherPortalApi";
import { useGetStudentMeQuery } from "@/features/studentPortal/api/studentPortalApi";
import { useLogoutAllMutation } from "@/features/auth/api/authApi";
import { PageContainer } from "@/shared/components/layout";
import {
    Avatar,
    Badge,
    Button,
    Card,
    DescriptionList,
    ErrorState,
    SkeletonCard,
    StatusBadge,
} from "@/shared/components/ui";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useToast } from "@/shared/hooks/useToast";
import { formatDate, formatDateTime } from "@/shared/utils/dateUtils";

const ROLE_LABELS: Record<string, string> = {
    SCHOOL_ADMIN: "School Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
};

const GENDER_LABELS: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
};

function SectionHeading({
    icon: Icon,
    title,
}: {
    icon: typeof User;
    title: string;
}) {
    return (
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
    );
}

export default function AccountPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { data: profile, isLoading, error, refetch } = useGetProfileQuery();

    // The base /profile payload only carries universal identity fields — an
    // admin account has nothing beyond that, but a teacher/student's real
    // detail (employment/academic info) lives on TeacherProfile/StudentProfile.
    // These self-scoped endpoints (req.user.id, never a client-supplied id)
    // already power the portal "My Profile" pages, so reuse them here instead
    // of duplicating that data-shaping on the backend.
    const isTeacher = profile?.role === USER_ROLES.TEACHER;
    const isStudent = profile?.role === USER_ROLES.STUDENT;

    const {
        data: teacherDetail,
        isLoading: isTeacherDetailLoading,
        error: teacherDetailError,
        refetch: refetchTeacherDetail,
    } = useGetTeacherProfileQuery(undefined, { skip: !isTeacher });

    const {
        data: studentDetail,
        isLoading: isStudentDetailLoading,
        error: studentDetailError,
        refetch: refetchStudentDetail,
    } = useGetStudentMeQuery(undefined, { skip: !isStudent });

    const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();
    const { confirm, dialog } = useConfirm();

    async function handleLogoutAllDevices() {
        const confirmed = await confirm({
            title: "Log out of all devices",
            description:
                "This ends every other active session for your account, on every device. You'll stay signed in here until you next log out.",
            confirmLabel: "Log out everywhere",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            await logoutAll().unwrap();
            toast.success("All other sessions have been logged out.");
        } catch {
            toast.error("Couldn't log out other sessions. Please try again.");
        }
    }

    return (
        <PageContainer
            header={{
                title: "Account",
                description: "Your account details and security settings.",
            }}
        >
            {dialog}

            {isLoading && (
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                    <SkeletonCard className="h-32" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                        <SkeletonCard className="lg:col-span-5" />
                        <SkeletonCard className="lg:col-span-2" />
                    </div>
                </div>
            )}
            {error && <ErrorState error={error} onRetry={refetch} />}

            {profile && (
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                    {/* Hero */}
                    <Card className="overflow-hidden">
                        <div className="flex flex-col gap-6 bg-linear-to-br from-primary-subtle via-bg-card to-bg-card p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                            <Avatar
                                photoUrl={profile.photoUrl}
                                firstName={profile.username}
                                size="xl"
                                status={
                                    profile.isActive ? "active" : "inactive"
                                }
                                className="shadow-md ring-4 ring-bg-card"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="truncate text-xl font-bold text-text-primary">
                                        {profile.username}
                                    </h2>
                                    <Badge variant="primary">
                                        {ROLE_LABELS[profile.role] ??
                                            profile.role}
                                    </Badge>
                                    <StatusBadge
                                        kind="account"
                                        status={
                                            profile.isActive
                                                ? "active"
                                                : "inactive"
                                        }
                                    />
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-text-secondary">
                                    <span className="flex items-center gap-1.5">
                                        <Mail
                                            className="h-4 w-4 shrink-0 text-text-muted"
                                            aria-hidden="true"
                                        />
                                        {profile.email}
                                    </span>
                                    {teacherDetail && (
                                        <span className="flex items-center gap-1.5">
                                            <Hash
                                                className="h-4 w-4 shrink-0 text-text-muted"
                                                aria-hidden="true"
                                            />
                                            {teacherDetail.employeeNo}
                                        </span>
                                    )}
                                    {studentDetail && (
                                        <span className="flex items-center gap-1.5">
                                            <Hash
                                                className="h-4 w-4 shrink-0 text-text-muted"
                                                aria-hidden="true"
                                            />
                                            {studentDetail.admissionNumber}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays
                                            className="h-4 w-4 shrink-0 text-text-muted"
                                            aria-hidden="true"
                                        />
                                        Member since{" "}
                                        {formatDate(profile.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                        {/* Main column */}
                        <div className="flex flex-col gap-6 lg:col-span-5">
                            <Card className="p-5 sm:p-6">
                                <SectionHeading
                                    icon={User}
                                    title="Account Information"
                                />
                                <DescriptionList
                                    columns={2}
                                    items={[
                                        {
                                            label: "Username",
                                            value: profile.username,
                                        },
                                        {
                                            label: "Email",
                                            value: profile.email,
                                        },
                                        {
                                            label: "Role",
                                            value:
                                                ROLE_LABELS[profile.role] ??
                                                profile.role,
                                        },
                                        {
                                            label: "Account status",
                                            value: (
                                                <StatusBadge
                                                    kind="account"
                                                    status={
                                                        profile.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }
                                                />
                                            ),
                                        },
                                        {
                                            label: "Member since",
                                            value: formatDateTime(
                                                profile.createdAt,
                                            ),
                                        },
                                    ]}
                                />
                                <p className="mt-5 text-sm text-text-muted">
                                    Your name, username, email, and photo are
                                    managed by the school office and can't be
                                    changed from here.
                                </p>
                            </Card>

                            {isTeacher && isTeacherDetailLoading && (
                                <SkeletonCard />
                            )}
                            {isTeacher && teacherDetailError && (
                                <ErrorState
                                    error={teacherDetailError}
                                    onRetry={refetchTeacherDetail}
                                />
                            )}
                            {teacherDetail && (
                                <>
                                    <Card className="p-5 sm:p-6">
                                        <SectionHeading
                                            icon={Briefcase}
                                            title="Employment Details"
                                        />
                                        <DescriptionList
                                            columns={2}
                                            items={[
                                                {
                                                    label: "Full name",
                                                    value: `${teacherDetail.firstName} ${teacherDetail.lastName}`,
                                                },
                                                {
                                                    label: "Employee No.",
                                                    value: teacherDetail.employeeNo,
                                                },
                                                {
                                                    label: "Phone",
                                                    value:
                                                        teacherDetail.phone ||
                                                        "—",
                                                },
                                                {
                                                    label: "Gender",
                                                    value:
                                                        GENDER_LABELS[
                                                            teacherDetail.gender
                                                        ] ??
                                                        teacherDetail.gender,
                                                },
                                                {
                                                    label: "Join date",
                                                    value: formatDate(
                                                        teacherDetail.joinDate,
                                                    ),
                                                },
                                            ]}
                                        />
                                    </Card>

                                    <Card className="p-5 sm:p-6">
                                        <SectionHeading
                                            icon={GraduationCap}
                                            title="Current Academic Year Assignments"
                                        />
                                        <div className="space-y-5">
                                            <div>
                                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                                                    Subject taught
                                                </h4>
                                                <p className="font-medium text-text-primary">
                                                    {teacherDetail
                                                        .currentSubjectAssignment
                                                        ?.subject.name ??
                                                        "None assigned"}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                                                    Classes taught
                                                </h4>
                                                {teacherDetail
                                                    .teachingAssignments
                                                    .length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {teacherDetail.teachingAssignments.map(
                                                            (a) => (
                                                                <Badge
                                                                    key={a.id}
                                                                    variant="neutral"
                                                                >
                                                                    {
                                                                        a.class
                                                                            .name
                                                                    }
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-text-muted">
                                                        None assigned
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                                                    Class teacher role
                                                </h4>
                                                {teacherDetail.classTeacherOf
                                                    .length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {teacherDetail.classTeacherOf.map(
                                                            (c) => (
                                                                <Badge
                                                                    key={c.id}
                                                                    variant="primary"
                                                                >
                                                                    {c.name}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-text-muted">
                                                        None assigned
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </>
                            )}

                            {isStudent && isStudentDetailLoading && (
                                <SkeletonCard />
                            )}
                            {isStudent && studentDetailError && (
                                <ErrorState
                                    error={studentDetailError}
                                    onRetry={refetchStudentDetail}
                                />
                            )}
                            {studentDetail && (
                                <>
                                    <Card className="p-5 sm:p-6">
                                        <SectionHeading
                                            icon={GraduationCap}
                                            title="Academic Details"
                                        />
                                        <DescriptionList
                                            columns={2}
                                            items={[
                                                {
                                                    label: "Admission No.",
                                                    value: studentDetail.admissionNumber,
                                                },
                                                {
                                                    label: "Admission date",
                                                    value: formatDate(
                                                        studentDetail.admissionDate,
                                                    ),
                                                },
                                                {
                                                    label: "Date of birth",
                                                    value: formatDate(
                                                        studentDetail.dateOfBirth,
                                                    ),
                                                },
                                                {
                                                    label: "Gender",
                                                    value:
                                                        GENDER_LABELS[
                                                            studentDetail.gender
                                                        ] ??
                                                        studentDetail.gender,
                                                },
                                                {
                                                    label: "Current class",
                                                    value:
                                                        studentDetail
                                                            .currentClass
                                                            ?.name ?? "—",
                                                },
                                                {
                                                    label: "Academic year",
                                                    value:
                                                        studentDetail
                                                            .currentClass
                                                            ?.academicYear
                                                            .name ?? "—",
                                                },
                                            ]}
                                        />
                                    </Card>

                                    <Card className="p-5 sm:p-6">
                                        <SectionHeading
                                            icon={Users}
                                            title="Guardian Information"
                                        />
                                        <DescriptionList
                                            columns={2}
                                            items={[
                                                {
                                                    label: "Guardian name",
                                                    value:
                                                        studentDetail.guardianName ??
                                                        "—",
                                                },
                                                {
                                                    label: "Guardian phone",
                                                    value:
                                                        studentDetail.guardianPhone ??
                                                        "—",
                                                },
                                            ]}
                                        />
                                    </Card>

                                    <Card className="p-5 sm:p-6">
                                        <SectionHeading
                                            icon={BookOpen}
                                            title="Subjects"
                                        />
                                        {studentDetail.subjects.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {studentDetail.subjects.map(
                                                    (s) => (
                                                        <Badge
                                                            key={s.id}
                                                            variant="neutral"
                                                        >
                                                            {s.subject.name}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-text-muted">
                                                None selected
                                            </p>
                                        )}
                                    </Card>
                                </>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="flex flex-col gap-6 lg:col-span-2">
                            <Card className="p-5 sm:p-6">
                                <SectionHeading
                                    icon={KeyRound}
                                    title="Security"
                                />
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                                                <KeyRound
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-text-primary">
                                                    Password
                                                </p>
                                                <p className="text-[12px] text-text-muted pt-1">
                                                    Change your account
                                                    password.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="md"
                                            fullWidth
                                            className="mt-4 justify-center"
                                            onClick={() =>
                                                navigate(ROUTES.CHANGE_PASSWORD)
                                            }
                                        >
                                            Change password
                                        </Button>
                                    </div>

                                    <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-card text-danger">
                                                <LogOut
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-danger-strong">
                                                    Log out of all devices
                                                </p>
                                                <p className="text-[12px] text-danger-strong/80 pt-1">
                                                    Ends every other session
                                                    signed in as you.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="md"
                                            fullWidth
                                            className="mt-4 justify-center"
                                            isLoading={isLoggingOutAll}
                                            onClick={() =>
                                                void handleLogoutAllDevices()
                                            }
                                        >
                                            Log out everywhere
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
