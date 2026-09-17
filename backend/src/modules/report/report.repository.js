import { getPrisma } from "../../config/database.js";

// Student identity + class + the term (with its one exam) — header info for
// the student term report. `studentId` here is the public-facing User id
// (matches GET /students/:id) for the student-self-view path, but also
// accepts `username` (e.g. "adm_2026_002") so the admin reports search —
// which only ever shows admins the username, never the internal cuid — can
// look a student up by what's actually on screen.
export const findStudentReportContext = async (studentId, termId) => {
    const db = getPrisma();
    const [user, term] = await Promise.all([
        db.user.findFirst({
            where: { role: "STUDENT", OR: [{ id: studentId }, { username: studentId }] },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                studentProfile: {
                    select: {
                        id: true,
                        admissionNumber: true,
                        currentClass: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
                    },
                },
            },
        }),
        db.term.findUnique({
            where: { id: termId },
            select: {
                id: true,
                name: true,
                sequence: true,
                startDate: true,
                endDate: true,
                academicYear: { select: { id: true, name: true } },
                exam: { select: { id: true, name: true, startDate: true, endDate: true } },
            },
        }),
    ]);
    return { user, term };
};

// A student's active subject selections for the report's academic year —
// the authoritative "which subjects get a row" source (§9), same as
// student.repository.js#findActiveSubjectSelections.
export const findActiveSubjectSelectionsForStudent = async (studentProfileId, academicYearId) => {
    const db = getPrisma();
    return db.studentSubjectSelection.findMany({
        where: { studentId: studentProfileId, academicYearId, isActive: true },
        select: { subject: { select: { id: true, name: true, code: true } } },
    });
};

export const findMarksForStudentExam = async (studentProfileId, examId) => {
    const db = getPrisma();
    return db.mark.findMany({
        where: { studentId: studentProfileId, markSheet: { examId } },
        select: {
            marksObtained: true,
            maxMarks: true,
            isAbsent: true,
            grade: true,
            remarks: true,
            markSheet: { select: { status: true, subject: { select: { id: true, name: true, code: true } } } },
        },
    });
};

export const findClassReportContext = async (classId, examId) => {
    const db = getPrisma();
    const [klass, exam] = await Promise.all([
        db.class.findUnique({
            where: { id: classId },
            select: { id: true, name: true, academicYear: { select: { id: true, name: true } } },
        }),
        db.exam.findUnique({
            where: { id: examId },
            select: { id: true, name: true, startDate: true, endDate: true, term: { select: { id: true, name: true, sequence: true } } },
        }),
    ]);
    return { klass, exam };
};

export const findMarksForClassExam = async (classId, examId) => {
    const db = getPrisma();
    return db.mark.findMany({
        where: { markSheet: { classId, examId } },
        select: {
            marksObtained: true,
            maxMarks: true,
            isAbsent: true,
            grade: true,
            remarks: true,
            student: { select: { userId: true, admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
            markSheet: { select: { status: true, subject: { select: { id: true, name: true, code: true } } } },
        },
        orderBy: [{ student: { user: { lastName: "asc" } } }],
    });
};

// Persists a Report row for every generation (§ Capability D) — `filePath`
// stays null since files are generated on-the-fly, never stored server-side.
export const createReportRow = async ({ type, format, studentId, classId, examId, termId, academicYearId, generatedById }) => {
    const db = getPrisma();
    return db.report.create({
        data: {
            type,
            format,
            studentId: studentId ?? null,
            classId: classId ?? null,
            examId: examId ?? null,
            termId: termId ?? null,
            academicYearId: academicYearId ?? null,
            generatedById,
            filePath: null,
        },
    });
};
