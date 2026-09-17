import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetTeacherDashboardQuery, useGetTeacherMarksQuery, useBulkUpdateMarksMutation, useGetTeacherClassesQuery } from "../api/teacherPortalApi";
import { useGetGradeBandsQuery } from "@/features/gradeBands/api/gradeBandsApi";
import { Spinner, Card, FilterBar, Badge, Select } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";
import { GradebookGrid } from "../components/GradebookGrid";
import toast from "react-hot-toast";

export default function GradebookPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const classId = searchParams.get("classId") || "";
    const termId = searchParams.get("termId") || "";

    const { data: dashboard, isLoading: loadingDash } = useGetTeacherDashboardQuery();
    const { data: classesData, isLoading: loadingClasses } = useGetTeacherClassesQuery();
    const { data: gradeBandsData, isLoading: loadingBands } = useGetGradeBandsQuery({ page: 1, limit: 100 });
    // The teacher's own subject, always. classTeacherClassId grants a wider
    // READ scope server-side (all subjects for the class-teacher's class,
    // for viewing) — but the gradebook is a WRITE tool, and writes are only
    // ever authorized for the teacher's own subject. Without this filter,
    // opening the gradebook for a class-teacher's own class pulls back one
    // placeholder row per subject per student (not just the teacher's),
    // with no way to tell them apart and every row equally editable.
    const teacherSubjectId = classesData?.subject?.id;
    const { data: marksData, isLoading: loadingMarks, refetch } = useGetTeacherMarksQuery(
        { classId, termId, subjectId: teacherSubjectId, limit: 100 },
        { skip: !classId || !termId || !teacherSubjectId }
    );
    const [bulkUpdate, { isLoading: isSaving }] = useBulkUpdateMarksMutation();

    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            if (value) prev.set(key, value);
            else prev.delete(key);
            return prev;
        }, { replace: true });
    };

    const isLoading = loadingDash || loadingClasses || loadingBands || (classId && termId && loadingMarks);

    const classOptions = useMemo(() => {
        if (!classesData) return [];
        return classesData.teachingClasses.map(c => ({ value: c.id, label: c.name }));
    }, [classesData]);

    const termOptions = useMemo(() => {
        if (!dashboard) return [];
        return dashboard.terms.map(t => ({ value: t.id, label: t.name }));
    }, [dashboard]);

    if (isLoading && (!dashboard || !classesData || (classId && termId && !marksData))) {
        return <Spinner fullPage message="Loading gradebook…" />;
    }

    const selectedTerm = dashboard?.terms.find(t => t.id === termId);
    
    // Authorization & Entry gates
    let readOnlyReason = "";
    let isEditable = false;
    let examId = "";

    if (selectedTerm) {
        if (!selectedTerm.exam || !selectedTerm.exam.endDate) {
            readOnlyReason = "The exam period for this term hasn't been set by the office yet.";
        } else if (!selectedTerm.exam.isEntryOpen) {
            readOnlyReason = `Mark entry opens after the exam period ends on ${new Date(selectedTerm.exam.endDate).toLocaleDateString()}.`;
        } else {
            isEditable = true;
            examId = selectedTerm.exam.id;
        }
    }

    // Determine marksheet status gate if marks exist
    let marksheetStatus = "DRAFT";
    if (marksData && marksData.items.length > 0) {
        marksheetStatus = marksData.items[0].markSheetStatus;
        examId = marksData.items[0].exam.id; // ensure we have the exam id
        if (marksheetStatus === "SUBMITTED" || marksheetStatus === "APPROVED" || marksheetStatus === "LOCKED") {
            isEditable = false;
            readOnlyReason = `Mark sheet is ${marksheetStatus}.`;
        } else if (marksheetStatus === "REJECTED") {
            isEditable = true;
        }
    }

    const handleSave = async (payload: unknown) => {
        try {
            // @ts-expect-error type
            await bulkUpdate(payload).unwrap();
            toast.success("Marks saved successfully.");
            refetch(); // Refresh to get server-computed grades
            return true;
        } catch (error: unknown) {
            const e = error as { data?: { message?: string } };
            toast.error(e?.data?.message || "Failed to save marks. No changes were saved.");
            return false;
        }
    };

    return (
        <PageContainer 
            className="flex-col h-[calc(100vh-6rem)]"
            header={{
                title: "Gradebook",
                description: "Enter marks for your teaching assignments."
            }}
        >

            <Card className="p-4 flex-shrink-0">
                <FilterBar>
                    <Select
                        value={termId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("termId", e.target.value)}
                        options={termOptions}
                        placeholder="Select Term"
                    />
                    <Select
                        value={classId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("classId", e.target.value)}
                        options={classOptions}
                        placeholder="Select Class"
                        disabled={!termId}
                    />
                </FilterBar>
            </Card>

            {!teacherSubjectId ? (
                <Card className="p-12 text-center text-text-muted flex-1 flex items-center justify-center">
                    You have no active subject assignment for the current academic year, so there is nothing to grade yet.
                </Card>
            ) : !classId || !termId ? (
                <Card className="p-12 text-center text-text-muted flex-1 flex items-center justify-center">
                    Select a term and class to view the gradebook.
                </Card>
            ) : marksData?.items.length === 0 ? (
                <Card className="p-12 text-center text-text-muted flex-1 flex items-center justify-center">
                    No students taking {classesData?.subject?.name} were found in this class.
                </Card>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-lg border border-border">
                    {/* Header bar with status */}
                    <div className="p-4 border-b border-border bg-primary-subtle/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-medium text-text-primary">
                                {classesData?.teachingClasses.find(c => c.id === classId)?.name}
                                <span className="mx-2 text-text-muted">•</span>
                                {selectedTerm?.name}
                                <span className="mx-2 text-text-muted">•</span>
                                {classesData?.subject?.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={
                                marksheetStatus === "SUBMITTED" || marksheetStatus === "APPROVED" || marksheetStatus === "LOCKED" ? "success" 
                                : marksheetStatus === "REJECTED" ? "danger" 
                                : "neutral"
                            }>
                                {marksheetStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* Read-only banner */}
                    {!isEditable && readOnlyReason && (
                        <div className="px-4 py-3 bg-danger/10 border-b border-danger/20 text-danger text-sm font-medium">
                            {readOnlyReason}
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                        <GradebookGrid
                            examId={examId}
                            marks={marksData?.items || []}
                            gradeBands={gradeBandsData?.data || []}
                            isEditable={isEditable}
                            isSaving={isSaving}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
