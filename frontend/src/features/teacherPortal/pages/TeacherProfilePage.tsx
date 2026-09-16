import { useGetTeacherProfileQuery } from "../api/teacherPortalApi";
import { Spinner, ErrorState, Card, DescriptionList, Alert } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";

export default function TeacherProfilePage() {
    const { data: profile, isLoading, error, refetch } = useGetTeacherProfileQuery();

    if (isLoading) return <Spinner fullPage message="Loading profile…" />;
    if (error || !profile) return <ErrorState error={error} onRetry={refetch} />;

    return (
        <PageContainer 
            className="max-w-3xl"
            header={{ title: "My Profile" }}
        >

            <Alert
                variant="info"
                title="Read Only"
            >
                Your details are managed by the school office. If anything is incorrect, please contact administration.
            </Alert>

            <Card className="p-6">
                <h2 className="text-lg font-medium text-text-primary border-b border-border pb-4 mb-4">
                    Personal Information
                </h2>
                <DescriptionList
                    items={[
                        { label: "Full Name", value: `${profile.firstName} ${profile.lastName}` },
                        { label: "Employee No.", value: profile.employeeNo },
                        { label: "Email", value: profile.email },
                        { label: "Phone", value: profile.phone || "—" },
                        { label: "Gender", value: profile.gender === "MALE" ? "Male" : profile.gender === "FEMALE" ? "Female" : "Other" },
                        { label: "Join Date", value: new Date(profile.joinDate).toLocaleDateString() },
                    ]}
                />
            </Card>

            <Card className="p-6">
                <h2 className="text-lg font-medium text-text-primary border-b border-border pb-4 mb-4">
                    Current Academic Year Assignments
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wider">Subject Taught</h3>
                        <p className="text-text-primary font-medium">
                            {profile.currentSubjectAssignment?.subject.name || "None assigned"}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wider">Classes Taught</h3>
                        {profile.teachingAssignments.length > 0 ? (
                            <ul className="list-disc list-inside text-text-primary">
                                {profile.teachingAssignments.map(a => (
                                    <li key={a.id}>{a.class.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-text-muted">None assigned</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-text-muted mb-2 uppercase tracking-wider">Class Teacher Role</h3>
                        {profile.classTeacherOf.length > 0 ? (
                            <ul className="list-disc list-inside text-text-primary">
                                {profile.classTeacherOf.map(c => (
                                    <li key={c.id}>{c.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-text-muted">None assigned</p>
                        )}
                    </div>
                </div>
            </Card>
        </PageContainer>
    );
}
