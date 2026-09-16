export interface DashboardStats {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    activeStudents: number;
    inactiveStudents: number;
}

export interface MarkSheetStatusCounts {
    DRAFT: number;
    SUBMITTED: number;
    APPROVED: number;
    REJECTED: number;
    LOCKED: number;
}

export interface DashboardTerm {
    id: string;
    name: string;
    sequence: number;
    startDate: string | null;
    endDate: string | null;
    exam: {
        id: string;
        startDate: string | null;
        endDate: string | null;
        isEntryOpen: boolean;
        markSheetCount: number;
    } | null;
}

export interface AuditLogEntry {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    createdAt: string;
}

export interface AdminDashboardDto {
    academicYear: { id: string; name: string; isCurrent: boolean };
    counts: DashboardStats;
    pendingCredentialChanges: number;
    markSheets: MarkSheetStatusCounts;
    terms: DashboardTerm[];
    examPeriodsUnconfigured: number;
    recentActivity: AuditLogEntry[];
}
