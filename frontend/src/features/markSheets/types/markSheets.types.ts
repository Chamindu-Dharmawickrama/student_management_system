export interface MarkSheetExam {
    id: string;
    name: string;
    term: {
        id: string;
        name: string;
        sequence: number;
    };
}

export interface MarkSheetClass {
    id: string;
    name: string;
}

export interface MarkSheetSubject {
    id: string;
    name: string;
    code?: string;
}

export interface MarkSheetTeacher {
    id: string;
    firstName: string;
    lastName: string;
}

// Mirrors markSheet.repository.js#findMarkStatsForSheet exactly.
export interface MarkSheetStats {
    totalStudents: number;
    entered: number;
    absent: number;
    pending: number;
}

export interface MarkSheetDto {
    id: string;
    exam: MarkSheetExam;
    class: MarkSheetClass;
    subject: MarkSheetSubject;
    teacher: MarkSheetTeacher;
    status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";
    submittedAt: string | null;
    approvedBy: MarkSheetTeacher | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    stats: MarkSheetStats;
    createdAt: string;
    updatedAt: string;
}
