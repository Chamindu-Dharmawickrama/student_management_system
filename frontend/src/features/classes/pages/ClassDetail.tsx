import { useParams, Link } from "react-router-dom";
import { 
  PageHeader, 
  Button, 
  ErrorState,
  Spinner,
  Card,
  StatCard,
  DataTable,
  Badge,
  EmptyState
} from "@/shared/components/ui";
import { useGetClassByIdQuery } from "../api/classesApi";
import { ROUTES } from "@/constants/app.constants";
import type { ClassDetailDTO } from "../types/classes.types";
import { PageContainer } from "@/shared/components/layout";

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
    
  const { data: classDetails, isLoading, isError, error, refetch } = useGetClassByIdQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return <Spinner fullPage message="Loading class details..." />;
  }

  if (isError || !classDetails) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const columns = [
    {
      header: "Subject",
      key: "subject.name",
      render: (item: ClassDetailDTO['teachingAssignments'][0]) => <span className="font-medium text-slate-900">{item.subject.name}</span>,
    },
    {
      header: "Teacher",
      key: "teacher",
      render: (item: ClassDetailDTO['teachingAssignments'][0]) => `${item.teacher.firstName} ${item.teacher.lastName}`,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`${classDetails.name} Details`}
        description={`${classDetails.gradeLevel.name} • ${classDetails.isActive ? 'Active' : 'Inactive'}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Teaching Assignments</h3>
            <DataTable
              columns={columns}
              rows={classDetails.teachingAssignments}
              getRowId={(item) => item.id}
              emptyState={
                <EmptyState title="No teaching assignments configured for this class." />
              }
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Status & Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <Badge variant={classDetails.isActive ? "success" : "neutral"}>
                  {classDetails.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Class Teacher</p>
                <p className="font-medium text-slate-900">
                  {classDetails.classTeacher 
                    ? `${classDetails.classTeacher.firstName} ${classDetails.classTeacher.lastName}` 
                    : "Not assigned"}
                </p>
              </div>
            </div>
          </Card>

          <StatCard 
            label="Enrolled Students"
            value={classDetails.currentStudentCount.toString()}
            icon={undefined}
          />

          <StatCard 
            label="Assigned Subjects"
            value={classDetails.teachingAssignments.length.toString()}
            icon={undefined}
          />

          <Link to={`${ROUTES.ADMIN_STUDENTS}?classId=${classDetails.id}`}>
            <Button variant="outline" className="w-full">
              View Students
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}