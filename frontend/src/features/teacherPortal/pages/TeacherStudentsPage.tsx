import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetTeacherStudentsQuery, useGetTeacherClassesQuery } from "../api/teacherPortalApi";
import { Card, DataTable, FilterBar, ErrorState, Select, Pagination } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";

export default function TeacherStudentsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    
    const classId = searchParams.get("classId") || "";

    const { data: classesData } = useGetTeacherClassesQuery();
    
    const { data, isLoading, error, refetch } = useGetTeacherStudentsQuery({
        page,
        limit: 20,
        classId: classId || undefined,
    });

    const handleClassChange = (newClassId: string) => {
        setPage(1);
        setSearchParams(prev => {
            if (newClassId) {
                prev.set("classId", newClassId);
            } else {
                prev.delete("classId");
            }
            return prev;
        }, { replace: true });
    };

    // Build class options from both teaching and class teacher scopes
    const classOptions = [
        { value: "", label: "All My Classes" }
    ];
    if (classesData) {
        const uniqueClasses = new Map();
        classesData.teachingClasses.forEach(c => uniqueClasses.set(c.id, c.name));
        if (classesData.classTeacherOf) {
            uniqueClasses.set(classesData.classTeacherOf.id, `${classesData.classTeacherOf.name} (Pastoral)`);
        }
        
        uniqueClasses.forEach((name, id) => {
            classOptions.push({ value: id, label: name });
        });
    }

    if (error) return <ErrorState error={error} onRetry={refetch} />;

    return (
        <PageContainer 
            header={{
                title: "My Students",
                description: "View students from your teaching assignments and pastoral class."
            }}
        >
            <Card className="p-4 sm:p-6">
                <FilterBar>
                    <Select
                        value={classId}
                        onChange={(e) => handleClassChange(e.target.value)}
                        options={classOptions}
                        placeholder="Filter by class"
                    />
                </FilterBar>

                <div className="mt-6">
                    <DataTable
                        rows={data?.items || []}
                        getRowId={(row: any) => row.id}
                        isLoading={isLoading}
                        emptyState={
                            <div className="p-8 text-center text-text-muted">
                                {classId 
                                    ? "No students found in this class. Note: You can only view students in classes you teach or are the class teacher of."
                                    : "No students found in your assigned classes."}
                            </div>
                        }
                        columns={[
                            {
                                key: "admissionNumber",
                                header: "Admission No.",
                                render: (row: any) => row.admissionNumber,
                            },
                            {
                                key: "name",
                                header: "Name",
                                render: (row: any) => `${row.firstName} ${row.lastName}`,
                            },
                            {
                                key: "class",
                                header: "Class",
                                render: (row: any) => row.currentClass?.name || "—",
                            },
                            {
                                key: "gender",
                                header: "Gender",
                                render: (row: any) => row.gender === "MALE" ? "Male" : row.gender === "FEMALE" ? "Female" : "Other",
                            },
                            {
                                key: "email",
                                header: "Email",
                                render: (row: any) => row.email,
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
                </div>
            </Card>
        </PageContainer>
    );
}
