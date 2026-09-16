import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Phone, 
  Edit, 
  ChevronLeft, 
  Hash, 
  Clock, 
  BookOpen, 
  GraduationCap 
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
  Alert
} from "@/shared/components/ui";
import { useGetStudentByIdQuery } from "../api/studentApi";
import { SubjectSelectionManager } from "../components/SubjectSelectionManager";
import { ROUTES } from "@/constants/app.constants";
import { useAppSelector } from "@/app/hooks";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { formatDate } from "@/shared/utils/dateUtils";
import { PageContainer } from "@/shared/components/layout";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const { currentYearId, isReadOnly } = useAppSelector((state) => state.academicYear);
  const { data: selectedYear } = useGetAcademicYearByIdQuery(currentYearId!, { skip: !currentYearId });

  const { data: studentData, isLoading, error } = useGetStudentByIdQuery(id!);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  if (isLoading) return <Spinner fullPage message="Loading student details..." />;
  if (error || !studentData?.data) {
    return (
      <ErrorState 
        message="The student you're looking for doesn't exist or you don't have permission to view them."
        error={error}
        onRetry={() => navigate(ROUTES.ADMIN_STUDENTS)}
      />
    );
  }

  const student = studentData.data;
  const fullName = `${student.firstName} ${student.lastName}`;

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "subjects", label: "Subjects" },
    { value: "history", label: "Enrolment History" },
    { value: "marks", label: "Marks" },
  ];

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          leftIcon={<ChevronLeft className="h-4 w-4" />} 
          onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
          className="text-text-muted hover:text-text-primary -ml-2"
        >
          Back to list
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">{student.firstName[0]}{student.lastName[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-text-muted">
                <Hash className="h-4 w-4" />
                {student.admissionNumber}
              </span>
              <StatusBadge kind="account" status={student.account.isActive ? "active" : "inactive"} />
              {student.account.mustChangePassword && (
                <Badge variant="warning">Pending First Login</Badge>
              )}
            </div>
          </div>
        </div>
        
        <Button 
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={() => navigate(ROUTES.ADMIN_STUDENT_EDIT.replace(":id", student.id))}
          disabled={isReadOnly}
        >
          Edit Student
        </Button>
      </div>

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
                  { label: "Date of Birth", value: formatDate(student.dateOfBirth) },
                  { label: "Gender", value: <span className="capitalize">{student.gender.toLowerCase()}</span> },
                  { label: "Email", value: student.email },
                  { label: "Guardian", value: student.guardianName || "Not provided" },
                  { 
                    label: "Guardian Phone", 
                    value: student.guardianPhone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {student.guardianPhone}
                      </span>
                    ) : "Not provided" 
                  },
                ]} 
              />
            </Card>
            
            <div className="flex flex-col gap-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">Current Enrolment</h3>
                </div>
                <DescriptionList 
                  items={[
                    { label: "Admission No.", value: student.admissionNumber },
                    { label: "Admission Date", value: formatDate(student.admissionDate) },
                    { 
                      label: "Current Class", 
                      value: student.currentClass ? (
                        <Badge variant="neutral">{student.currentClass.name}</Badge>
                      ) : "Unassigned" 
                    },
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
                    { label: "Username", value: <span className="font-mono text-xs">{student.username}</span> },
                    { label: "Status", value: <StatusBadge kind="account" status={student.account.isActive ? "active" : "inactive"} /> },
                    { label: "Created At", value: formatDate(student.account.createdAt) },
                  ]} 
                />
              </Card>
            </div>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SubjectSelectionManager studentId={student.id} studentName={fullName} />
            </div>
            <div className="md:col-span-1">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-border-subtle pb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">Selection History</h3>
                </div>
                {student.subjects.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      student.subjects.reduce((acc, curr) => {
                        const year = curr.academicYear.name;
                        if (!acc[year]) acc[year] = [];
                        acc[year].push(curr.subject.name);
                        return acc;
                      }, {} as Record<string, string[]>)
                    ).map(([year, subjects]) => (
                      <div key={year} className="mb-4 last:mb-0">
                        <h4 className="text-sm font-semibold text-text-secondary mb-2">{year}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {subjects.map(s => (
                            <Badge key={s} variant="neutral">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">No subjects recorded.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Enrolment Timeline</h3>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Permanent record of all class enrolments for this student.
              </p>
            </div>
            
            <div className="p-5">
              {student.enrollmentHistory.length > 0 ? (
                <div className="relative border-l border-border ml-3 space-y-8">
                  {student.enrollmentHistory.map((history) => (
                    <div key={history.id} className="relative pl-6">
                      <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg-card ${history.isCurrent ? 'bg-primary' : 'bg-text-muted'}`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                        <h4 className="font-semibold text-text-primary">{history.class.name}</h4>
                        <Badge variant={history.isCurrent ? "success" : "neutral"}>
                          {history.academicYear.name}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-text-muted flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Enrolled: {formatDate(history.enrolledAt)}</span>
                        {history.leftAt && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Left: {formatDate(history.leftAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted">No enrolment history found.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "marks" && (
          <Card className="p-5">
            <div className="text-center py-12 text-text-muted">
              <p>Marks view will be populated from the marks API.</p>
              <p className="text-sm mt-2">See student portal implementation for details.</p>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
