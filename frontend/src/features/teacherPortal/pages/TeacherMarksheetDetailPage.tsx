import { useParams, useNavigate } from "react-router-dom";
import { useGetTeacherMarksheetDetailQuery, useSubmitMarksheetMutation } from "../api/teacherPortalApi";
import { Spinner, ErrorState, Card, StatusBadge, Button, ConfirmDialog, DescriptionList, Alert } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";
import { ArrowLeft, CheckCircle, Edit, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export default function TeacherMarksheetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: marksheet, isLoading, error } = useGetTeacherMarksheetDetailQuery(id!);
    const [submitSheet, { isLoading: isSubmitting }] = useSubmitMarksheetMutation();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    if (isLoading) return <Spinner fullPage message="Loading mark sheet details…" />;
    if (error || !marksheet) return <ErrorState error={error} />;

    const isEditable = marksheet.status === "DRAFT" || marksheet.status === "REJECTED";
    const isComplete = marksheet.stats.pending === 0;
    const canSubmit = isEditable && isComplete;

    const handleSubmit = async () => {
        try {
            await submitSheet(marksheet.id).unwrap();
            toast.success("Mark sheet submitted successfully.");
            setIsConfirmOpen(false);
        } catch (error: unknown) {
            const e = error as { data?: { message?: string } };
            toast.error(e?.data?.message || "Failed to submit mark sheet.");
        }
    };

    return (
        <PageContainer 
            className="max-w-4xl"
            header={{
                title: `Mark Sheet: ${marksheet.subject.name}`,
                description: `${marksheet.class.name} • ${marksheet.exam.term.name} (${marksheet.exam.name})`
            }}
        >
            <div className="flex justify-between items-center mb-6">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="flex items-center gap-3">
                    <StatusBadge 
                        kind="markSheet"
                        status={marksheet.status}
                    />
                </div>
            </div>

            {marksheet.status === "REJECTED" && marksheet.rejectionReason && (
                <Alert variant="danger" title="Mark Sheet Rejected">
                    <p className="mb-2">This mark sheet was rejected for the following reason:</p>
                    <p className="font-medium">"{marksheet.rejectionReason}"</p>
                    <p className="mt-2 text-sm">Please edit the marks to correct the issue and submit again.</p>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-lg font-medium text-text-primary mb-4 border-b border-border pb-4">Details & Progress</h2>
                    
                    <div className="mb-6">
                        <DescriptionList
                            items={[
                                { label: "Term", value: marksheet.exam.term.name },
                                { label: "Exam", value: marksheet.exam.name },
                                { label: "Class", value: marksheet.class.name },
                                { label: "Subject", value: marksheet.subject.name },
                                { label: "Created On", value: new Date(marksheet.createdAt).toLocaleDateString() },
                            ]}
                        />
                    </div>

                    <div className="bg-surface rounded-lg p-4 border border-border">
                        <h3 className="text-sm font-medium text-text-primary mb-3">Completion Status</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-text-muted">Marks Entered</span>
                            <span className="text-sm font-medium text-text-primary">{marksheet.stats.entered} / {marksheet.stats.totalStudents}</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 mb-4">
                            <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${marksheet.stats.totalStudents > 0 ? (marksheet.stats.entered / marksheet.stats.totalStudents) * 100 : 0}%` }}
                            />
                        </div>

                        {!isComplete && isEditable && (
                            <p className="text-sm text-warning mt-2">
                                You must enter marks for all {marksheet.stats.totalStudents} students before submitting.
                            </p>
                        )}
                        {isComplete && isEditable && (
                            <p className="text-sm text-success mt-2 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> All marks entered. Ready for submission.
                            </p>
                        )}
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-medium text-text-primary mb-4 border-b border-border pb-4">Actions</h2>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate(`/teacher/gradebook?termId=${marksheet.exam.term.id}&classId=${marksheet.class.id}`)}
                                variant={isEditable ? "primary" : "secondary"}
                                className="w-full justify-center"
                            >
                                {isEditable ? <Edit className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                                {isEditable ? "Edit Gradebook" : "View Gradebook"}
                            </Button>

                            {isEditable && (
                                <Button
                                    variant="primary"
                                    className="w-full justify-center"
                                    disabled={!canSubmit || isSubmitting}
                                    onClick={() => setIsConfirmOpen(true)}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit for Approval
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-medium text-text-primary mb-4 border-b border-border pb-4">Timeline</h2>
                        <div className="space-y-4">
                            <div className="relative pl-4 border-l-2 border-border">
                                <div className="absolute w-3 h-3 bg-border rounded-full -left-[7px] top-1.5" />
                                <p className="text-sm font-medium text-text-primary">Created</p>
                                <p className="text-xs text-text-muted">{new Date(marksheet.createdAt).toLocaleString()}</p>
                            </div>
                            
                            {marksheet.submittedAt && (
                                <div className="relative pl-4 border-l-2 border-primary">
                                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5" />
                                    <p className="text-sm font-medium text-text-primary">Submitted</p>
                                    <p className="text-xs text-text-muted">{new Date(marksheet.submittedAt).toLocaleString()}</p>
                                </div>
                            )}

                            {marksheet.approvedAt && (
                                <div className="relative pl-4 border-l-2 border-success">
                                    <div className="absolute w-3 h-3 bg-success rounded-full -left-[7px] top-1.5" />
                                    <p className="text-sm font-medium text-text-primary">
                                        {marksheet.status === "REJECTED" ? "Rejected" : "Approved"}
                                    </p>
                                    <p className="text-xs text-text-muted">{new Date(marksheet.approvedAt).toLocaleString()}</p>
                                    {marksheet.approvedBy && (
                                        <p className="text-xs text-text-muted mt-1">
                                            By {marksheet.approvedBy.firstName} {marksheet.approvedBy.lastName}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Submit Mark Sheet"
                description={`Are you sure you want to submit the mark sheet for ${marksheet.subject.name} - ${marksheet.class.name}? Once submitted, it will be locked for editing until an administrator reviews it.`}
                confirmLabel="Submit"
                onConfirm={handleSubmit}
                onClose={() => setIsConfirmOpen(false)}
                isLoading={isSubmitting}
            />
        </PageContainer>
    );
}
