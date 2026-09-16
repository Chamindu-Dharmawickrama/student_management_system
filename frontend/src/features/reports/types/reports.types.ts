export interface StudentTermReportSubject {
    subject: { id: string; name: string; code?: string; };
    marksObtained: number | null;
    maxMarks: number;
    isAbsent: boolean;
    grade: string | null;
    isPassing: boolean | null;
    remarks: string | null;
    status: string;
}

export interface StudentTermReportDto {
    student: { id: string; firstName: string; lastName: string; admissionNumber: string; };
    class: { id: string; name: string; } | null;
    academicYear: { id: string; name: string; };
    term: { id: string; name: string; sequence: number; startDate: string | null; endDate: string | null; };
    exam: { id: string; name: string; startDate: string | null; endDate: string | null; };
    subjects: StudentTermReportSubject[];
    totals: {
        subjectCount: number;
        totalMarks: number;
        average: number | null;
        overallGrade: string | null;
        subjectsPassed: number;
        subjectsFailed: number;
    };
}

export interface ClassReportStudentMark {
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
    marksObtained: number | null;
    maxMarks: number;
    isAbsent: boolean;
    grade: string | null;
    isPassing: boolean | null;
    remarks: string | null;
    status: string;
}

export interface ClassReportDto {
    class: { id: string; name: string; };
    academicYear: { id: string; name: string; };
    exam: { id: string; name: string; startDate: string | null; endDate: string | null; };
    term: { id: string; name: string; sequence: number; };
    students: ClassReportStudentMark[];
    stats: {
        studentCount: number;
        highest: { student: { id: string; firstName: string; lastName: string; admissionNumber: string; }; marksObtained: number; } | null;
        lowest: { student: { id: string; firstName: string; lastName: string; admissionNumber: string; }; marksObtained: number; } | null;
        average: number | null;
        passRate: number | null;
        gradeDistribution: Record<string, number>;
    };
}
