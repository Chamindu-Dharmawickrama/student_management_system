import { useGetTeacherClassesQuery } from "../api/teacherPortalApi";
import { Spinner, ErrorState, Card, Button } from "@/shared/components/ui";
import { PageContainer } from "@/shared/components/layout";
import { useNavigate } from "react-router-dom";
import { Users, FileText, ArrowRight } from "lucide-react";

export default function TeacherClassesPage() {
    const navigate = useNavigate();
    const { data: classesData, isLoading, error, refetch } = useGetTeacherClassesQuery();

    if (isLoading) return <Spinner fullPage message="Loading classes…" />;
    if (error || !classesData) return <ErrorState error={error} onRetry={refetch} />;

    return (
        <PageContainer
            header={{
                title: "My Classes",
                description: "View your teaching assignments and pastoral class."
            }}
        >
            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Classes I teach</h2>
                    <p className="text-sm text-text-muted mt-1">You can enter marks for these classes in {classesData.subject?.name || "your subject"}.</p>
                </div>
                
                {classesData.teachingClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classesData.teachingClasses.map(c => (
                            <Card key={c.id} className="p-5 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary">{c.name}</h3>
                                </div>
                                
                                <div className="mt-auto pt-4 flex gap-3 border-t border-border">
                                    <Button onClick={() => navigate(`/teacher/students?classId=${c.id}`)} variant="secondary" className="flex-1">
                                        Students
                                    </Button>
                                    <Button onClick={() => navigate(`/teacher/gradebook?classId=${c.id}`)} variant="primary" className="flex-1">
                                        Gradebook
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-text-muted">
                        No teaching assignments assigned.
                    </Card>
                )}
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Class I'm responsible for</h2>
                    <p className="text-sm text-text-muted mt-1">You can view these students; you can only enter marks for the subject you teach them.</p>
                </div>
                
                {classesData.classTeacherOf ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="p-5 flex flex-col h-full border-accent/20 bg-accent/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-text-primary">{classesData.classTeacherOf.name}</h3>
                                    <span className="text-xs font-medium text-accent uppercase tracking-wider">Class Teacher</span>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-4 flex gap-3 border-t border-accent/10">
                                <Button onClick={() => navigate(`/teacher/students?classId=${classesData.classTeacherOf?.id}`)} variant="secondary" className="flex-1 bg-white hover:bg-gray-50 border-accent/20 text-text-primary">
                                    View Students
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <Card className="p-8 text-center text-text-muted">
                        You are not assigned as a class teacher.
                    </Card>
                )}
            </section>
        </PageContainer>
    );
}
