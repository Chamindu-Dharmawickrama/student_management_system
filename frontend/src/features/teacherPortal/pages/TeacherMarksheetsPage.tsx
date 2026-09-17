import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetTeacherMarksheetsQuery } from "../api/teacherPortalApi";
import { Card, DataTable, StatusBadge, Button, Alert, Pagination } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";
import { Eye, AlertCircle } from "lucide-react";

export default function TeacherMarksheetsPage() {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    
    // Sort REJECTED to the top by fetching sorted, or the backend may not sort by status explicitly.
    // If backend doesn't sort by status, we do it in client side for the current page.
    const { data, isLoading } = useGetTeacherMarksheetsQuery({ page, limit: 20 });

    const sortedItems = [...(data?.items || [])].sort((a, b) => {
        if (a.status === "REJECTED" && b.status !== "REJECTED") return -1;
        if (b.status === "REJECTED" && a.status !== "REJECTED") return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const rejectedCount = sortedItems.filter(i => i.status === "REJECTED").length;

    return (
        <PageContainer 
            header={{
                title: "Mark Sheets",
                description: "View and track the status of your mark sheets."
            }}
        >

            {rejectedCount > 0 && (
                <Alert variant="danger" title="Action Required">
                    You have {rejectedCount} mark sheet{rejectedCount > 1 ? 's' : ''} that have been rejected and require corrections.
                </Alert>
            )}

            <Card className="p-4 sm:p-6">
                <DataTable
                    rows={sortedItems}
                    getRowId={(row: any) => row.id}
                    isLoading={isLoading}
                    emptyState={<div className="p-8 text-center text-text-muted">No mark sheets found.</div>}
                    columns={[
                        {
                            key: "term",
                            header: "Term / Exam",
                            render: (row: any) => `${row.exam.term.name} - ${row.exam.name}`,
                        },
                        {
                            key: "class",
                            header: "Class",
                            render: (row: any) => row.class.name,
                        },
                        {
                            key: "subject",
                            header: "Subject",
                            render: (row: any) => row.subject.name,
                        },
                        {
                            key: "status",
                            header: "Status",
                            render: (row: any) => (
                                <StatusBadge kind="markSheet" status={row.status} />
                            )
                        },
                        {
                            key: "progress",
                            header: "Progress",
                            render: (row: any) => (
                                <div className="text-sm">
                                    {row.stats.entered} / {row.stats.totalStudents} entered
                                </div>
                            )
                        },
                        {
                            key: "submitted",
                            header: "Submitted",
                            render: (row: any) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "—",
                        },
                        {
                            key: "actions",
                            header: "Actions",
                            render: (row: any) => (
                                <div className="flex flex-col gap-2">
                                    <Button onClick={() => navigate(`/teacher/marksheets/${row.id}`)} variant="secondary" size="sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </Button>
                                    {row.status === "REJECTED" && (
                                        <p className="text-xs text-danger flex items-start gap-1 max-w-[200px]">
                                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                            <span className="truncate" title={row.rejectionReason || ""}>{row.rejectionReason}</span>
                                        </p>
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
                {data?.meta && data.meta.totalPages > 1 && (
                    <div className="mt-4 border-t border-border pt-4">
                        <Pagination 
                            meta={data.meta} 
                            onPageChange={setPage} 
                        />
                    </div>
                )}
            </Card>
        </PageContainer>
    );
}
