import { useState, useEffect } from "react";
import { useGetClassExamReportQuery } from "@/features/reports/api/reportsApi";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentYearId } from "@/features/academicYear/slices/academicYearSlice";
import { Select, SkeletonCard, ErrorState, Card, CardContent } from "@/shared/components/ui";
import { BarChart3, Users } from "lucide-react";

interface ClassResultsTabProps {
    classId: string;
}

export function ClassResultsTab({ classId }: ClassResultsTabProps) {
    const currentYearId = useAppSelector(selectCurrentYearId);
    const { data: yearData, isLoading: yearLoading } = useGetAcademicYearByIdQuery(currentYearId || "", {
        skip: !currentYearId
    });

    const [selectedExamId, setSelectedExamId] = useState<string>("");

    useEffect(() => {
        if (!selectedExamId && yearData && yearData.terms) {
            const firstTermWithExam = yearData.terms.find(t => t.exam);
            if (firstTermWithExam && firstTermWithExam.exam) {
                setSelectedExamId(firstTermWithExam.exam.id);
            }
        }
    }, [yearData, selectedExamId]);

    const { data: report, isLoading, error, refetch } = useGetClassExamReportQuery(
        { classId, examId: selectedExamId },
        { skip: !classId || !selectedExamId }
    );

    const maxGradeCount = report?.stats && Object.keys(report.stats.gradeDistribution).length > 0 
        ? Math.max(...Object.values(report.stats.gradeDistribution)) 
        : 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-text-primary">Class Results Overview</h3>
                <div className="w-full sm:w-64">
                    <Select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        disabled={yearLoading || !yearData}
                        placeholder="Select an Exam"
                        options={yearData?.terms.filter(t => t.exam).map(t => ({
                            value: t.exam!.id,
                            label: `${t.exam!.name} (${t.name})`
                        })) || []}
                    />
                </div>
            </div>

            {!selectedExamId ? (
                <Card>
                    <CardContent className="p-12 text-center text-text-muted">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Select an exam to view class results.</p>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <SkeletonCard />
            ) : error ? (
                <ErrorState error={error} onRetry={refetch} />
            ) : !report ? (
                <div />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Overall Statistics
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Average</div>
                                        <div className="text-2xl font-bold text-text-primary tabular-nums">
                                            {report.stats.average !== null ? report.stats.average.toFixed(1) : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Pass Rate</div>
                                        <div className="text-2xl font-bold text-text-primary tabular-nums">
                                            {report.stats.passRate !== null ? `${(report.stats.passRate * 100).toFixed(0)}%` : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Highest</div>
                                        <div className="text-lg font-bold text-text-primary tabular-nums">
                                            {report.stats.highest ? report.stats.highest.marksObtained : '-'}
                                        </div>
                                        {report.stats.highest && <div className="text-xs text-text-muted truncate mt-0.5">{report.stats.highest.student.firstName}</div>}
                                    </div>
                                    <div className="bg-surface-alt p-3 rounded-lg border border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Lowest</div>
                                        <div className="text-lg font-bold text-text-primary tabular-nums">
                                            {report.stats.lowest ? report.stats.lowest.marksObtained : '-'}
                                        </div>
                                        {report.stats.lowest && <div className="text-xs text-text-muted truncate mt-0.5">{report.stats.lowest.student.firstName}</div>}
                                    </div>
                                </div>

                                {Object.keys(report.stats.gradeDistribution).length > 0 && (
                                    <div>
                                        <div className="text-xs text-text-muted uppercase tracking-wider mb-3">Grade Distribution</div>
                                        <div className="space-y-2">
                                            {Object.entries(report.stats.gradeDistribution)
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
                    </div>

                    {/* Marks Table */}
                    <div className="lg:col-span-2">
                        <Card className="h-full border border-border overflow-hidden">
                            <div className="bg-surface p-4 border-b border-border flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">All Students & Subjects</h3>
                                <span className="text-sm text-text-muted">
                                    {report.stats.studentCount} Mark Entries
                                </span>
                            </div>
                            
                            {report.students.length === 0 ? (
                                <div className="p-12 text-center text-text-muted">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No marks recorded for this exam yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto max-h-[600px]">
                                    <table className="w-full text-left text-sm whitespace-nowrap relative">
                                        <thead className="sticky top-0 bg-surface-alt border-b border-border z-10 shadow-sm">
                                            <tr className="text-text-muted">
                                                <th className="p-3 pl-4 font-medium">Student</th>
                                                <th className="p-3 font-medium">Subject</th>
                                                <th className="p-3 font-medium text-right">Marks</th>
                                                <th className="p-3 font-medium text-center">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {report.students.map((mark, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="p-3 pl-4">
                                                        <div className="font-medium text-text-primary">{mark.student.firstName} {mark.student.lastName}</div>
                                                        <div className="text-xs text-text-muted">{mark.student.admissionNumber}</div>
                                                    </td>
                                                    <td className="p-3 text-text-secondary">{mark.subject.name}</td>
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
                                                    <td className="p-3 text-center">
                                                        {mark.grade ? (
                                                            <span className={`font-bold ${mark.isPassing ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {mark.grade}
                                                            </span>
                                                        ) : <span className="text-slate-300 italic">—</span>}
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
            )}
        </div>
    );
}
