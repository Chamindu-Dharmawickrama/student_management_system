import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { useGetAdminDashboardQuery } from "../api/dashboardApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, StatusBadge, SkeletonCard, ErrorState } from "@/shared/components/ui";
import { Users, UserCheck, BookOpen, GraduationCap, AlertCircle, FileText, ChevronRight, Calendar, UserX, UserPlus, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/shared/utils/dateUtils";

export default function AdminDashboardPage() {
    // Reconciled source of truth (see MarkSheetListPage.tsx for why the raw
    // selectCurrentYearId selector must never be read directly).
    const { yearId: currentYearId } = useSelectedAcademicYear();
    
    // We send academicYearId conditionally
    const { data, isLoading, error, refetch } = useGetAdminDashboardQuery(
        currentYearId ? { academicYearId: currentYearId } : {},
        { skip: !currentYearId } // Assuming we wait for the year to be resolved
    );

    const isHistorical = data ? !data.academicYear.isCurrent : false;

    // Derived counts for Needs Attention
    const pendingMarkSheetsCount = data?.markSheets.SUBMITTED ?? 0;
    const unconfiguredExamsCount = data?.examPeriodsUnconfigured ?? 0;
    const rejectedMarkSheetsCount = data?.markSheets.REJECTED ?? 0;
    const pendingLoginsCount = data?.pendingCredentialChanges ?? 0;

    const hasAttentionItems = !isHistorical && (pendingMarkSheetsCount > 0 || unconfiguredExamsCount > 0 || rejectedMarkSheetsCount > 0 || pendingLoginsCount > 0);

    const totalMarkSheets = useMemo(() => {
        if (!data) return 0;
        return Object.values(data.markSheets).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    }, [data]);

    const getPipelineWidth = (count: number) => {
        if (totalMarkSheets === 0) return "0%";
        return `${(count / totalMarkSheets) * 100}%`;
    };

    if (isLoading) {
        return (
            <PageContainer header={{ title: "Dashboard", description: "Loading dashboard data..." }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <div className="space-y-8">
                        <SkeletonCard />
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer header={{ title: "Dashboard" }}>
                <ErrorState error={error} onRetry={refetch} />
            </PageContainer>
        );
    }

    if (!data) return null;

    return (
        <PageContainer header={{ 
            title: "Dashboard", 
            description: `Overview for the ${data.academicYear.name} academic year.` 
        }}>
            {/* Row 1 - StatCards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link to="/admin/students" className="block focus-ring rounded-lg">
                    <Card className="hover:border-primary/50 transition-colors h-full border-l-4 border-l-blue-500">
                        <CardContent className="p-5 flex items-center">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted">Students</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-text-primary tabular-nums">{data.counts.activeStudents}</h3>
                                    {data.counts.inactiveStudents > 0 && (
                                        <span className="text-xs text-text-muted tabular-nums">+{data.counts.inactiveStudents} inactive</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                
                <Link to="/admin/teachers" className="block focus-ring rounded-lg">
                    <Card className="hover:border-primary/50 transition-colors h-full border-l-4 border-l-teal-500">
                        <CardContent className="p-5 flex items-center">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg mr-4">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted">Teachers</p>
                                <h3 className="text-2xl font-bold text-text-primary tabular-nums">{data.counts.teachers}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                
                <Link to="/admin/classes" className="block focus-ring rounded-lg">
                    <Card className="hover:border-primary/50 transition-colors h-full border-l-4 border-l-amber-500">
                        <CardContent className="p-5 flex items-center">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mr-4">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted">Classes</p>
                                <h3 className="text-2xl font-bold text-text-primary tabular-nums">{data.counts.classes}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/subjects" className="block focus-ring rounded-lg">
                    <Card className="hover:border-primary/50 transition-colors h-full border-l-4 border-l-purple-500">
                        <CardContent className="p-5 flex items-center">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg mr-4">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted">Subjects</p>
                                <h3 className="text-2xl font-bold text-text-primary tabular-nums">{data.counts.subjects}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Row 2 - Needs Attention */}
            {isHistorical && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">Historical View</h4>
                        <p className="text-sm mt-1">You are viewing a past academic year. The dashboard is in read-only mode and action items are hidden.</p>
                    </div>
                </div>
            )}
            
            {!isHistorical && hasAttentionItems && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-danger" /> Needs Attention
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {pendingMarkSheetsCount > 0 && (
                            <Link to="/admin/marksheets?status=SUBMITTED" className="block focus-ring rounded-lg">
                                <Card className="hover:border-primary/50 transition-colors h-full bg-amber-50/50 border-amber-200">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-amber-100 text-amber-700 rounded-md mr-3">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-amber-900 tabular-nums">{pendingMarkSheetsCount}</h4>
                                                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Awaiting Approval</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-amber-400" size={20} />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {rejectedMarkSheetsCount > 0 && (
                            <Link to="/admin/marksheets?status=REJECTED" className="block focus-ring rounded-lg">
                                <Card className="hover:border-primary/50 transition-colors h-full bg-red-50/50 border-red-200">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-red-100 text-red-700 rounded-md mr-3">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-red-900 tabular-nums">{rejectedMarkSheetsCount}</h4>
                                                <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Rejected Sheets</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-red-400" size={20} />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {unconfiguredExamsCount > 0 && (
                            <Link to={`/admin/academic-years/${data.academicYear.id}`} className="block focus-ring rounded-lg">
                                <Card className="hover:border-primary/50 transition-colors h-full bg-blue-50/50 border-blue-200">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 text-blue-700 rounded-md mr-3">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-blue-900 tabular-nums">{unconfiguredExamsCount}</h4>
                                                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Unconfigured Exams</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-blue-400" size={20} />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {pendingLoginsCount > 0 && (
                            <Link to="/admin/students?status=active" className="block focus-ring rounded-lg">
                                <Card className="hover:border-primary/50 transition-colors h-full bg-purple-50/50 border-purple-200">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-purple-100 text-purple-700 rounded-md mr-3">
                                                <UserPlus size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-purple-900 tabular-nums">{pendingLoginsCount}</h4>
                                                <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Pending Logins</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-purple-400" size={20} />
                                    </CardContent>
                                </Card>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Timeline and Pipeline */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Row 4 - Mark Sheet Pipeline */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-text-primary">Mark Sheet Pipeline</h2>
                                <Link to="/admin/marksheets" className="text-sm font-medium text-primary hover:underline">View All</Link>
                            </div>
                            
                            {totalMarkSheets > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex h-6 rounded-full overflow-hidden flex-nowrap bg-surface-alt">
                                        {data.markSheets.DRAFT > 0 && (
                                            <div style={{ width: getPipelineWidth(data.markSheets.DRAFT) }} className="bg-slate-300" title={`Draft: ${data.markSheets.DRAFT}`} />
                                        )}
                                        {data.markSheets.REJECTED > 0 && (
                                            <div style={{ width: getPipelineWidth(data.markSheets.REJECTED) }} className="bg-red-400" title={`Rejected: ${data.markSheets.REJECTED}`} />
                                        )}
                                        {data.markSheets.SUBMITTED > 0 && (
                                            <div style={{ width: getPipelineWidth(data.markSheets.SUBMITTED) }} className="bg-amber-400" title={`Submitted: ${data.markSheets.SUBMITTED}`} />
                                        )}
                                        {data.markSheets.APPROVED > 0 && (
                                            <div style={{ width: getPipelineWidth(data.markSheets.APPROVED) }} className="bg-teal-400" title={`Approved: ${data.markSheets.APPROVED}`} />
                                        )}
                                        {data.markSheets.LOCKED > 0 && (
                                            <div style={{ width: getPipelineWidth(data.markSheets.LOCKED) }} className="bg-emerald-600" title={`Locked: ${data.markSheets.LOCKED}`} />
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        <Link to="/admin/marksheets?status=DRAFT" className="block focus-ring rounded hover:bg-slate-50 p-2 text-center border-t-2 border-slate-300">
                                            <div className="text-xl font-bold text-slate-700 tabular-nums">{data.markSheets.DRAFT}</div>
                                            <div className="text-xs font-medium text-slate-500 uppercase">Draft</div>
                                        </Link>
                                        <Link to="/admin/marksheets?status=SUBMITTED" className="block focus-ring rounded hover:bg-amber-50 p-2 text-center border-t-2 border-amber-400">
                                            <div className="text-xl font-bold text-amber-700 tabular-nums">{data.markSheets.SUBMITTED}</div>
                                            <div className="text-xs font-medium text-amber-600 uppercase">Submitted</div>
                                        </Link>
                                        <Link to="/admin/marksheets?status=APPROVED" className="block focus-ring rounded hover:bg-teal-50 p-2 text-center border-t-2 border-teal-400">
                                            <div className="text-xl font-bold text-teal-700 tabular-nums">{data.markSheets.APPROVED}</div>
                                            <div className="text-xs font-medium text-teal-600 uppercase">Approved</div>
                                        </Link>
                                        <Link to="/admin/marksheets?status=LOCKED" className="block focus-ring rounded hover:bg-emerald-50 p-2 text-center border-t-2 border-emerald-600">
                                            <div className="text-xl font-bold text-emerald-800 tabular-nums">{data.markSheets.LOCKED}</div>
                                            <div className="text-xs font-medium text-emerald-700 uppercase">Locked</div>
                                        </Link>
                                        <Link to="/admin/marksheets?status=REJECTED" className="block focus-ring rounded hover:bg-red-50 p-2 text-center border-t-2 border-red-400">
                                            <div className="text-xl font-bold text-red-700 tabular-nums">{data.markSheets.REJECTED}</div>
                                            <div className="text-xs font-medium text-red-600 uppercase">Rejected</div>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-muted">No mark sheets generated yet.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Row 3 - Academic Calendar */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-6">Academic Calendar</h2>
                            <div className="space-y-6">
                                {data.terms.map((term, index) => {
                                    const isConfigured = Boolean(term.exam && term.exam.endDate);
                                    const isUpcoming = isConfigured && !term.exam!.isEntryOpen;
                                    const isOpen = isConfigured && term.exam!.isEntryOpen;

                                    return (
                                        <div key={term.id} className="relative pl-6 pb-6 last:pb-0">
                                            {/* Timeline line */}
                                            {index !== data.terms.length - 1 && (
                                                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                                            )}
                                            
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center ${isOpen ? 'bg-primary' : 'bg-muted/30'}`} />

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-border">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-text-primary">{term.name}</h3>
                                                        {isOpen && <StatusBadge kind="examPeriod" status="entry-open" />}
                                                        {isUpcoming && <StatusBadge kind="examPeriod" status="upcoming" />}
                                                        {!isConfigured && <StatusBadge kind="examPeriod" status="not-configured" />}
                                                    </div>
                                                    <div className="text-sm text-text-muted flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4" />
                                                        {term.startDate && term.endDate ? (
                                                            <span>{formatDate(term.startDate)} – {formatDate(term.endDate)}</span>
                                                        ) : (
                                                            <span>Dates not set</span>
                                                        )}
                                                    </div>
                                                    {isConfigured && (
                                                        <div className="text-sm text-text-muted mt-1">
                                                            Exam Period: Ends {formatDate(term.exam!.endDate!)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    {isConfigured ? (
                                                        <Link to={`/admin/marksheets?termId=${term.id}`} className="text-sm font-medium text-primary hover:underline flex items-center justify-end">
                                                            {term.exam!.markSheetCount} Mark Sheets
                                                            <ChevronRight className="w-4 h-4 ml-1" />
                                                        </Link>
                                                    ) : (
                                                        <Link to={`/admin/academic-years/${data.academicYear.id}`} className="text-sm font-medium text-danger hover:underline">
                                                            Configure Exam &rarr;
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: Recent Activity */}
                <div className="space-y-8">
                    {/* Row 5 - Recent Activity */}
                    <Card className="h-full">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-6">Recent Activity</h2>
                            {data.recentActivity.length > 0 ? (
                                <div className="space-y-5">
                                    {data.recentActivity.map((log, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="mt-0.5 flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <ActivityIcon action={log.action} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-text-primary leading-tight">
                                                    <span className="font-semibold">{log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : "System"}</span>
                                                    {' '}
                                                    {formatActionText(log.action, log.entityType)}
                                                </p>
                                                <p className="text-xs text-text-muted mt-1">
                                                    {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-text-muted">No recent activity.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}

function ActivityIcon({ action }: { action: string }) {
    if (action.includes("APPROVED")) return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
    if (action.includes("REJECTED")) return <UserX className="w-4 h-4 text-red-500" />;
    if (action.includes("SUBMITTED")) return <FileText className="w-4 h-4 text-amber-500" />;
    if (action.includes("CREATED") || action.includes("REGISTER")) return <UserPlus className="w-4 h-4 text-blue-500" />;
    return <UserCheck className="w-4 h-4 text-slate-500" />;
}

function formatActionText(action: string, entityType: string) {
    // Basic humanizer for the log
    const actionMap: Record<string, string> = {
        "MARKSHEET_APPROVED": "approved a mark sheet",
        "MARKSHEET_REJECTED": "rejected a mark sheet",
        "MARKSHEET_SUBMITTED": "submitted a mark sheet",
        "MARKSHEET_LOCKED": "locked a mark sheet",
        "STUDENT_REGISTERED": "registered a new student",
        "TEACHER_REGISTERED": "registered a new teacher",
        "PASSWORD_RESET": "reset a password",
        "ACCOUNT_DEACTIVATED": "deactivated an account",
    };
    
    return actionMap[action] || `${action.toLowerCase().replace(/_/g, ' ')} (${entityType})`;
}
