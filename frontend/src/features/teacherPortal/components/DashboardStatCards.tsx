import { StatCard } from "@/shared/components/ui";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";
import type { TeacherDashboardDTO } from "../types/teacherPortal.types";

interface DashboardStatCardsProps {
    data: TeacherDashboardDTO;
}

export function DashboardStatCards({ data }: DashboardStatCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                label="Total Students"
                value={data.totalStudents.toString()}
                icon={<Users className="w-5 h-5" />}
            />
            <StatCard
                label="Classes Taught"
                value={data.teachingClasses.length.toString()}
                icon={<FileText className="w-5 h-5" />}
            />
            <StatCard
                label="Marks Pending Entry"
                value={data.pendingEntry.toString()}
                icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
                label="Mark Sheets Rejected"
                value={data.markSheets.rejected.toString()}
                icon={<CheckCircle className="w-5 h-5" />}
                href="/teacher/marksheets?status=REJECTED"
            />
        </div>
    );
}
