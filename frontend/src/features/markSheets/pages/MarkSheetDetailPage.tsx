import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGetMarkSheetDetailQuery, useApproveMarkSheetMutation, useRejectMarkSheetMutation, useLockMarkSheetMutation } from "../api/markSheetsApi";
import { useGetClassExamReportQuery } from "@/features/reports/api/reportsApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, Button, StatusBadge, SkeletonCard, ErrorState, Breadcrumbs } from "@/shared/components/ui";
import { CheckCircle, XCircle, Lock, Calendar, Users, AlertCircle, BarChart3 } from "lucide-react";
import { formatDate } from "@/shared/utils/dateUtils";
import { toast } from "react-hot-toast";

export default function MarkSheetDetailPage() {
    const { id } = useParams<{ id: string }>();

    const { data: markSheet, isLoading: isLoadingSheet, error: sheetError, refetch: refetchSheet } = useGetMarkSheetDetailQuery(id!);
    
    // We only fetch the class exam report if the sheet is loaded
    const { data: report, isLoading: isLoadingReport, error: reportError } = useGetClassExamReportQuery(
        { classId: markSheet?.class.id || "", examId: markSheet?.exam.id || "" },
        { skip: !markSheet }
    );

    const [approve, { isLoading: isApproving }] = useApproveMarkSheetMutation();
    const [reject, { isLoading: isRejecting }] = useRejectMarkSheetMutation();
    const [lock, { isLoading: isLocking }] = useLockMarkSheetMutation();

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const handleApprove = async () => {
        if (!window.confirm("Approve this mark sheet? Once approved, marks are visible to students.")) return;
        try {
            await approve(id!).unwrap();
            toast.success("Mark sheet approved successfully.");
        } catch {
            toast.error("Failed to approve mark sheet.");
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectReason.trim()) {
            toast.error("Please provide a rejection reason.");
            return;
        }
        try {
            await reject({ id: id!, reason: rejectReason }).unwrap();
            toast.success("Mark sheet rejected.");
            setShowRejectModal(false);
            setRejectReason("");
        } catch {
            toast.error("Failed to reject mark sheet.");
        }
    };

    const handleLock = async () => {
        if (!window.confirm("Lock this mark sheet? This is a terminal state and cannot be undone.")) return;
        try {
            await lock(id!).unwrap();
            toast.success("Mark sheet locked.");
        } catch {
            toast.error("Failed to lock mark sheet.");
        }
    };

    // Derived statistics specific to this subject's marks
    const { marks, stats } = useMemo(() => {
        if (!report || !markSheet) return { marks: [], stats: null };

        const subjectMarks = report.students.filter(s => s.subject.id === markSheet.subject.id);
        const gradedRows = subjectMarks.filter(r => !r.isAbsent && r.marksObtained !== null);
        const sortedDesc = [...gradedRows].sort((a, b) => b.marksObtained! - a.marksObtained!);

        const highest = sortedDesc.length > 0 ? sortedDesc[0] : null;
        const lowest = sortedDesc.length > 0 ? sortedDesc[sortedDesc.length - 1] : null;
        const average = gradedRows.length > 0 ? gradedRows.reduce((acc, r) => acc + r.marksObtained!, 0) / gradedRows.length : null;
        const passRate = gradedRows.length > 0 ? gradedRows.filter(r => r.isPassing).length / gradedRows.length : null;

        const gradeDistribution: Record<string, number> = {};
        gradedRows.forEach(r => {
            if (r.grade) {
                gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
            }
        });

        return {
            marks: subjectMarks,
            stats: {
                highest,
                lowest,
                average,
                passRate,
                gradeDistribution
            }
        };
    }, [report, markSheet]);

    if (isLoadingSheet) {
        return (
            <PageContainer>
                <SkeletonCard />
            </PageContainer>
        );
    }

    if (sheetError || !markSheet) {
        return (
            <PageContainer>
                <ErrorState error={sheetError} onRetry={refetchSheet} />
            </PageContainer>
        );
    }

    // Max count for bar chart scaling
    const maxGradeCount = stats && Object.keys(stats.gradeDistribution).length > 0 
        ? Math.max(...Object.values(stats.gradeDistribution)) 
        : 1;

    return (
        <PageContainer header={{ 
            title: "Mark Sheet Details",
            breadcrumbs: <Breadcrumbs items={[
                { label: "Dashboard", href: "/admin" },
                { label: "Mark Sheets", href: "/admin/marksheets" },
                { label: "Details" }
            ]} />
        }}>
            
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-3">
                        {markSheet.subject.name} — {markSheet.class.name}
                        <StatusBadge kind="markSheet" status={markSheet.status} />
                    </h1>
                    <p className="text-text-muted flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {markSheet.exam.name} ({markSheet.exam.term.name})</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Teacher: {markSheet.teacher.firstName} {markSheet.teacher.lastName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {markSheet.status === "SUBMITTED" && (
                        <>
                            <Button variant="danger" onClick={() => setShowRejectModal(true)} disabled={isRejecting || isApproving}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button variant="primary" onClick={handleApprove} disabled={isApproving || isRejecting}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </>
                    )}
                    {markSheet.status === "APPROVED" && (
                        <Button variant="secondary" onClick={handleLock} disabled={isLocking}>
                            <Lock className="w-4 h-4 mr-2 text-danger" />
                            Lock Sheet
                        </Button>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-xl">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 text-danger mr-2" /> Reject Mark Sheet
                            </h3>
                            <form onSubmit={handleReject}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Reason for Rejection</label>
                                    <textarea
                                        className="w-full rounded-md border-border bg-surface text-text-primary px-3 py-2 focus-ring min-h-[100px]"
                                        placeholder="Explain what needs to be fixed..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        autoFocus
                                    />
                                    <p className="text-xs text-text-muted mt-2">This reason will be visible to the teacher.</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="secondary" type="button" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                                    <Button variant="danger" type="submit" disabled={isRejecting}>Confirm Rejection</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {markSheet.rejectionReason && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold">Rejection Reason</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{markSheet.rejectionReason}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Stats & Timeline */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-base font-semibold text-text-primary mb-4">Submission Details</h3>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="text-text-muted mb-1">Created</dt>
                                    <dd className="font-medium text-text-primary">{formatDate(markSheet.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-text-muted mb-1">Last Submitted</dt>
                                    <dd className="font-medium text-text-primary">
                                        {markSheet.submittedAt ? formatDate(markSheet.submittedAt) : <span className="text-text-muted italic">Never</span>}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-text-muted mb-1">Approved</dt>
                                    <dd className="font-medium text-text-primary">
                                        {markSheet.approvedAt && markSheet.approvedBy ? (
                                            <>
                                                {formatDate(markSheet.approvedAt)} by {markSheet.approvedBy}
                                            </>
                                        ) : <span className="text-text-muted italic">Not yet approved</span>}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {stats && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Class Statistics
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Average</div>
                                        <div className="text-2xl font-bold text-text-primary tabular-nums">
                                            {stats.average !== null ? stats.average.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Pass Rate</div>
                                        <div className="text-2xl font-bold text-text-primary tabular-nums">
                                            {stats.passRate !== null ? `${(stats.passRate * 100).toFixed(0)}%` : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Highest</div>
                                        <div className="text-lg font-bold text-text-primary tabular-nums">
                                            {stats.highest ? stats.highest.marksObtained : '-'}
                                        </div>
                                        {stats.highest && <div className="text-xs text-text-muted truncate mt-0.5">{stats.highest.student.firstName} {stats.highest.student.lastName}</div>}
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Lowest</div>
                                        <div className="text-lg font-bold text-text-primary tabular-nums">
                                            {stats.lowest ? stats.lowest.marksObtained : '-'}
                                        </div>
                                        {stats.lowest && <div className="text-xs text-text-muted truncate mt-0.5">{stats.lowest.student.firstName} {stats.lowest.student.lastName}</div>}
                                    </div>
                                </div>

                                {Object.keys(stats.gradeDistribution).length > 0 && (
                                    <div>
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Grade Distribution</div>
                                        <div className="space-y-2">
                                            {Object.entries(stats.gradeDistribution)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .map(([grade, count]) => {
                                                const pct = (count / maxGradeCount) * 100;
                                                return (
                                                    <div key={grade} className="flex items-center text-sm">
                                                        <div className="w-8 font-medium text-text-secondary">{grade}</div>
                                                        <div className="flex-grow h-4 bg-slate-100 rounded-sm overflow-hidden relative mr-3">
                                                            <div 
                                                                className="absolute top-0 left-0 bottom-0 bg-primary/70 rounded-sm transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="w-6 text-right tabular-nums text-text-muted">{count}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Marks Table */}
                <div className="lg:col-span-2">
                    <Card className="h-full border border-border overflow-hidden">
                        <div className="bg-surface p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-text-primary">Student Marks</h3>
                            <span className="text-sm text-text-muted">
                                {markSheet.stats.marksEntered} / {markSheet.stats.totalStudents} Entered
                            </span>
                        </div>
                        
                        {isLoadingReport ? (
                            <div className="p-8">
                                <SkeletonCard />
                            </div>
                        ) : reportError ? (
                            <div className="p-8 text-center text-danger">Failed to load student marks.</div>
                        ) : marks.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No students found for this class and subject.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-surface-alt border-b border-border text-text-muted">
                                            <th className="p-3 pl-4 font-medium">Student</th>
                                            <th className="p-3 font-medium text-right">Marks</th>
                                            <th className="p-3 font-medium">Grade</th>
                                            <th className="p-3 font-medium w-full max-w-xs">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {marks.map((mark) => (
                                            <tr key={mark.student.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 pl-4">
                                                    <div className="font-medium text-text-primary">{mark.student.firstName} {mark.student.lastName}</div>
                                                    <div className="text-xs text-text-muted">{mark.student.admissionNumber}</div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {mark.isAbsent ? (
                                                        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold uppercase">Absent</span>
                                                    ) : mark.marksObtained !== null ? (
                                                        <span className="font-bold tabular-nums text-text-primary">
                                                            {mark.marksObtained} <span className="text-text-muted font-normal text-xs">/ {mark.maxMarks}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 italic">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {mark.grade ? (
                                                        <span className={`font-bold ${mark.isPassing ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {mark.grade}
                                                        </span>
                                                    ) : <span className="text-slate-300 italic">—</span>}
                                                </td>
                                                <td className="p-3 text-text-secondary truncate max-w-xs" title={mark.remarks || ""}>
                                                    {mark.remarks || <span className="text-slate-300 italic">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
