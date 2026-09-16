export interface TeacherProfileAccount {
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TeacherProfileSubjectAssignment {
    subject: {
        id: string;
        name: string;
    };
    academicYear: {
        id: string;
        name: string;
    };
}

export interface TeacherProfileTeachingAssignment {
    id: string;
    subject: {
        id: string;
        name: string;
    };
    class: {
        id: string;
        name: string;
    };
    academicYear: {
        id: string;
        name: string;
    };
}

export interface TeacherProfileClassTeacher {
    id: string;
    name: string;
    academicYear: {
        id: string;
        name: string;
    };
}

export interface TeacherProfileDTO {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeNo: string;
    phone: string | null;
    gender: "MALE" | "FEMALE" | "OTHER";
    joinDate: string;
    isActive: boolean;
    currentSubjectAssignment: TeacherProfileSubjectAssignment | null;
    teachingAssignments: TeacherProfileTeachingAssignment[];
    classTeacherOf: TeacherProfileClassTeacher[];
    account: TeacherProfileAccount;
}

export interface TeacherDashboardDTO {
    subject: {
        id: string;
        name: string;
    } | null;
    teachingClasses: {
        id: string;
        name: string;
        studentCount: number;
    }[];
    classTeacherOf: {
        id: string;
        name: string;
        studentCount: number;
    } | null;
    totalStudents: number;
    terms: {
        id: string;
        name: string;
        sequence: number;
        exam: {
            id: string;
            isEntryOpen: boolean;
            endDate: string | null;
        } | null;
    }[];
    markSheets: {
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        locked: number;
    };
    pendingEntry: number;
}

export interface TeacherClassesDTO {
    subject: {
        id: string;
        name: string;
    } | null;
    teachingClasses: {
        id: string;
        name: string;
    }[];
    classTeacherOf: {
        id: string;
        name: string;
    } | null;
}

export interface TeacherStudentListItemDTO {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    admissionNumber: string;
    currentClass: {
        id: string;
        name: string;
        academicYear: {
            id: string;
            name: string;
        };
    } | null;
}

export type MarkSheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";

export interface MarkDTO {
    id: string;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNumber: string;
    };
    subject: {
        id: string;
        name: string;
    };
    class: {
        id: string;
        name: string;
    };
    exam: {
        id: string;
        name: string;
        term: {
            id: string;
            name: string;
        };
    };
    marksObtained: number | null;
    maxMarks: number;
    isAbsent: boolean;
    grade: string | null;
    remarks: string | null;
    markSheetStatus: MarkSheetStatus;
    createdAt: string;
    updatedAt: string;
}

export interface MarkSheetStats {
    totalStudents: number;
    enteredMarks: number;
    absent: number;
    isComplete: boolean;
}

export interface MarkSheetDTO {
    id: string;
    exam: {
        id: string;
        name: string;
        term: {
            id: string;
            name: string;
        };
    };
    class: {
        id: string;
        name: string;
    };
    subject: {
        id: string;
        name: string;
    };
    teacher: {
        id: string;
        firstName: string;
        lastName: string;
    };
    status: MarkSheetStatus;
    submittedAt: string | null;
    approvedBy: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    stats: MarkSheetStats;
    createdAt: string;
    updatedAt: string;
}

// Payloads
export interface BulkMarksPayload {
    examId: string;
    entries: {
        studentId: string;
        isAbsent?: boolean;
        marksObtained?: number;
        remarks?: string;
    }[];
}
