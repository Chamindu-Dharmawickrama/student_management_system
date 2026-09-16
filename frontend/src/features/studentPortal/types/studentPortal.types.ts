export interface Subject {
    id: string;
    name: string;
    code?: string;
}

export interface AcademicYear {
    id: string;
    name: string;
}

export interface Class {
    id: string;
    name: string;
}

export interface AccountDto {
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StudentSubjectDto {
    id: string;
    subject: Subject;
    academicYear: AcademicYear;
    selectedAt: string;
}

export interface EnrollmentHistoryDto {
    academicYear: AcademicYear;
    class: Class;
    enrolledAt: string;
    isActive: boolean;
}

export interface StudentMeDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    admissionNumber: string;
    currentClass: (Class & { academicYear: AcademicYear }) | null;
    createdAt: string;
    username: string;
    dateOfBirth: string;
    admissionDate: string;
    guardianName: string | null;
    guardianPhone: string | null;
    enrollmentHistory: EnrollmentHistoryDto[];
    subjects: StudentSubjectDto[];
    account: AccountDto;
}

export interface DashboardTermSummary {
    id: string;
    name: string;
    sequence: number;
    exam: { id: string; endDate: string | null } | null;
    marksReleased: boolean;
    subjectsGraded: number;
    subjectsTotal: number;
}

export interface LatestTermSummary {
    termId: string;
    average: number | null;
    grade: { grade: string; isPassing: boolean } | string | null;
    highest: { subject: Subject; marksObtained: number } | null;
    lowest: { subject: Subject; marksObtained: number } | null;
}

export interface StudentDashboardDto {
    currentClass: { id: string; name: string } | null;
    academicYear: { id: string; name: string } | null;
    subjects: Subject[];
    terms: DashboardTermSummary[];
    latestTermSummary: LatestTermSummary | null;
}

export interface MarkDto {
    id: string;
    student: { id: string; firstName: string; lastName: string; admissionNumber: string };
    subject: Subject;
    class: Class;
    exam: { id: string; name: string; term: { id: string; name: string; sequence: number } };
    marksObtained: number | null;
    maxMarks: number;
    isAbsent: boolean;
    grade: string | null;
    remarks: string | null;
    markSheetStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";
    createdAt: string;
    updatedAt: string;
}

export interface ReportCardDto {
    student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNumber: string;
        currentClass: {
            id: string;
            name: string;
        };
    };
    term: {
        id: string;
        name: string;
        sequence: number;
        startDate: string | null;
        endDate: string | null;
    };
    academicYear: {
        id: string;
        name: string;
    };
    marks: MarkDto[];
    summary: {
        totalMarks: number;
        maxPossibleMarks: number;
        average: number | null;
        overallGrade: string | null;
        subjectsPassed: number;
        totalSubjects: number;
    };
}
