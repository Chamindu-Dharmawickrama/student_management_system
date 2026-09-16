import { useGetTeacherDashboardQuery } from "../api/teacherPortalApi";
import { Spinner, ErrorState, Card } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";
import { DashboardStatCards } from "../components/DashboardStatCards";
import { TermTimeline } from "../components/TermTimeline";
import { Link } from "react-router-dom";
import { Users, FileText } from "lucide-react";

export default function TeacherDashboardPage() {
    const { data: dashboard, isLoading, error, refetch } = useGetTeacherDashboardQuery();

    if (isLoading) return <Spinner fullPage message="Loading dashboard…" />;
    if (error || !dashboard) return <ErrorState error={error} onRetry={refetch} />;

    return (
        <PageContainer 
            header={{
                title: "Teacher Dashboard",
                description: dashboard.subject 
                        ? `You teach ${dashboard.subject.name}` 
                        : "No subject assigned — contact the school office"
            }}
        >
            <DashboardStatCards data={dashboard} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TermTimeline terms={dashboard.terms} />
                </div>
                <div>
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-6">My Classes</h2>
                        <div className="space-y-4">
                            {dashboard.teachingClasses.map((c) => (
                                <Link 
                                    key={c.id} 
                                    to={`/teacher/gradebook?classId=${c.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary-subtle/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary">{c.name}</p>
                                            <p className="text-xs text-text-muted">{c.studentCount} students</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {dashboard.teachingClasses.length === 0 && (
                                <p className="text-sm text-text-muted text-center py-4">No teaching assignments.</p>
                            )}

                            {dashboard.classTeacherOf && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h3 className="text-sm font-medium text-text-muted mb-4">Class teacher — view only for other subjects</h3>
                                    <Link 
                                        to={`/teacher/students?classId=${dashboard.classTeacherOf.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border border-accent/20 bg-accent/5 hover:border-accent/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">{dashboard.classTeacherOf.name}</p>
                                                <p className="text-xs text-text-muted">{dashboard.classTeacherOf.studentCount} students</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
