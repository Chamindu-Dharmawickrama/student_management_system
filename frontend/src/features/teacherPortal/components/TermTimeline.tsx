import { Card, Button, StatusBadge } from "@/shared/components/ui";
import { ArrowRight, Lock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TeacherDashboardDTO } from "../types/teacherPortal.types";

interface TermTimelineProps {
    terms: TeacherDashboardDTO["terms"];
}

export function TermTimeline({ terms }: TermTimelineProps) {
    const navigate = useNavigate();

    return (
        <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Term Timeline & Entry</h2>
            <div className="space-y-6">
                {terms.map((term, index) => {
                    const isConfigured = Boolean(term.exam && term.exam.endDate);
                    const isUpcoming = isConfigured && !term.exam!.isEntryOpen;
                    const isOpen = isConfigured && term.exam!.isEntryOpen;

                    return (
                        <div key={term.id} className="relative pl-6 pb-6 last:pb-0">
                            {/* Timeline line */}
                            {index !== terms.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                            )}
                            
                            {/* Timeline dot */}
                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center ${isOpen ? 'bg-primary' : 'bg-muted/30'}`} />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-border">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-text-primary">{term.name}</h3>
                                        {isOpen && (
                                            <StatusBadge kind="examPeriod" status="entry-open" />
                                        )}
                                        {isUpcoming && (
                                            <StatusBadge kind="examPeriod" status="upcoming" />
                                        )}
                                        {!isConfigured && (
                                            <StatusBadge kind="examPeriod" status="not-configured" />
                                        )}
                                    </div>
                                    <div className="text-sm text-text-muted flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {isConfigured ? (
                                            <span>
                                                Exam Period: Ends {new Date(term.exam!.endDate!).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span>The office hasn't set this exam period yet</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {isOpen ? (
                                        <Button
                                            onClick={() => navigate(`/teacher/gradebook?termId=${term.id}`)}
                                            variant="primary"
                                            className="w-full sm:w-auto"
                                        >
                                            Enter Marks
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled
                                            variant="secondary"
                                            className="w-full sm:w-auto"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            {isUpcoming ? "Entry Opens Later" : "Not Open"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
