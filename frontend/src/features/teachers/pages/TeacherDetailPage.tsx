/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  User, 
  Phone, 
  Edit, 
  ChevronLeft, 
  Hash, 
  Clock, 
  BookOpen, 
  Users 
} from "lucide-react";

import { 
  Button, 
  Card, 
  StatusBadge, 
  Badge, 
  Tabs,
  Spinner,
  ErrorState,
  DescriptionList,
  DataTable,
  Alert
} from "@/shared/components/ui";
import { useGetTeacherByIdQuery } from "../api/teacherApi";
import { TeacherAccessSummary } from "../components/TeacherAccessSummary";
import { ROUTES } from "@/constants/app.constants";
import { useAppSelector } from "@/app/hooks";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { formatDate } from "@/shared/utils/dateUtils";
import { PageContainer } from "@/shared/components/layout";

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const { currentYearId, isReadOnly } = useAppSelector((state) => state.academicYear);
  const { data: selectedYear } = useGetAcademicYearByIdQuery(currentYearId!, { skip: !currentYearId });

  const { data: teacherData, isLoading, error } = useGetTeacherByIdQuery(id!);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  if (isLoading) return <Spinner fullPage message="Loading teacher details..." />;
  if (error || !teacherData?.data) {
    return (
      <ErrorState 
        message="The teacher you're looking for doesn't exist or you don't have permission to view them."
        error={error}
        onRetry={() => navigate(ROUTES.ADMIN_TEACHERS)}
      />
    );
  }

  const teacher = teacherData.data;
  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "subjects", label: "Subject & Classes" },
    { value: "class-teacher", label: "Class Teacher" },
    { value: "students", label: "Students" },
  ];

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          leftIcon={<ChevronLeft className="h-4 w-4" />} 
          onClick={() => navigate(ROUTES.ADMIN_TEACHERS)}
          className="text-text-muted hover:text-text-primary -ml-2"
        >
          Back to list
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">{teacher.firstName[0]}{teacher.lastName[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-text-muted">
                <Hash className="h-4 w-4" />
                {teacher.employeeNo}
              </span>
              <StatusBadge kind="account" status={teacher.account.isActive ? "active" : "inactive"} />
              {teacher.account.mustChangePassword && (
                <Badge variant="warning">Pending First Login</Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={() => navigate(ROUTES.ADMIN_TEACHER_EDIT.replace(":id", teacher.id))}
          disabled={isReadOnly}
        >
          Edit Teacher
        </Button>
      </div>

      <TeacherAccessSummary teacher={teacher} academicYearId={selectedYear.id} />

      <Tabs 
        tabs={tabs} 
        value={activeTab} 
        onChange={handleTabChange} 
      />

      <div className="mt-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Personal Information</h3>
              </div>
              <DescriptionList 
                items={[
                  { label: "Full Name", value: fullName },
                  { label: "Gender", value: <span className="capitalize">{teacher.gender.toLowerCase()}</span> },
                  { label: "Email", value: teacher.email },
                  { 
                    label: "Phone", 
                    value: teacher.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {teacher.phone}
                      </span>
                    ) : "Not provided" 
                  },
                ]} 
              />
            </Card>
            
            <div className="flex flex-col gap-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">Employment Details</h3>
                </div>
                <DescriptionList 
                  items={[
                    { label: "Employee No.", value: teacher.employeeNo },
                    { label: "Join Date", value: formatDate((teacher as any).joinDate || (teacher as any).joinedAt) },
                  ]} 
                />
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">Account Status</h3>
                </div>
                <DescriptionList 
                  items={[
                    { label: "Status", value: <StatusBadge kind="account" status={teacher.account.isActive ? "active" : "inactive"} /> },
                    { label: "Created At", value: formatDate(teacher.account.createdAt) },
                  ]} 
                />
              </Card>
            </div>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-5 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Teaching Assignments</h3>
              </div>
              
              {teacher.teachingAssignments.length > 0 ? (
                <DataTable
                  rows={teacher.teachingAssignments}
                  getRowId={(item) => item.id}
                  columns={[
                    {
                      key: "year",
                      header: "Academic Year",
                      render: (item) => <Badge variant={item.academicYear.id === selectedYear.id ? "success" : "neutral"}>{item.academicYear.name}</Badge>
                    },
                    {
                      key: "subject",
                      header: "Subject",
                      render: (item) => <span className="font-medium text-text-primary">{item.subject.name}</span>
                    },
                    {
                      key: "class",
                      header: "Class",
                      render: (item) => <span>{item.class.name}</span>
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted">No teaching assignments recorded.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "class-teacher" && (
          <Card className="p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Class Teacher Responsibilities</h3>
            </div>
            
            {teacher.classTeacherOf.length > 0 ? (
              <DataTable
                rows={teacher.classTeacherOf}
                getRowId={(item) => item.id}
                columns={[
                  {
                    key: "year",
                    header: "Academic Year",
                    render: (item) => <Badge variant={item.academicYear.id === selectedYear.id ? "success" : "neutral"}>{item.academicYear.name}</Badge>
                  },
                  {
                    key: "class",
                    header: "Class",
                    render: (item) => <span className="font-medium text-text-primary">{item.name}</span>
                  }
                ]}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-text-muted">No class teacher responsibilities recorded.</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === "students" && (
          <Card className="p-5">
            <div className="text-center py-12 text-text-muted">
              <p>Students view is not accessible via this admin detail screen directly.</p>
              <p className="text-sm mt-2">See teacher portal implementation for their student list.</p>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
