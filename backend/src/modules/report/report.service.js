import { AppError } from "../../utils/appError.js";
import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import { resolveGradeFromBands } from "../gradeBand/gradeBand.service.js";
import { findAllGradeBands } from "../gradeBand/gradeBand.repository.js";
import { STUDENT_VISIBLE_STATUSES } from "../markSheet/markSheet.status.js";
import {
    findStudentReportContext,
    findActiveSubjectSelectionsForStudent,
    findMarksForStudentExam,
    findClassReportContext,
    findMarksForClassExam,
    createReportRow,
} from "./report.repository.js";

const toNumber = (decimal) => (decimal === null || decimal === undefined ? null : Number(decimal));

const resolveIsPassing = (grade, bands) => {
    if (!grade) return null;
    return bands.find((b) => b.grade === grade)?.isPassing ?? null;
};

// GET /reports/student/:studentId/term/:termId
export const getStudentTermReportService = async (requester, studentId, termId, format) => {
    const isAdmin = requester.role === "SCHOOL_ADMIN";
    const isSelf = requester.role === "STUDENT" && requester.id === studentId;
    if (!isAdmin && !isSelf) {
        throw new AppError("You are not authorized to view this report.", 403);
    }

    const { user, term } = await findStudentReportContext(studentId, termId);
    if (!user || !user.studentProfile) {
        throw new AppError("Student not found.", 404);
    }
    if (!term) {
        throw new AppError("Term not found.", 404);
    }
    if (!term.exam) {
        throw new AppError("This term's exam has not been provisioned.", 404);
    }

    const academicYearId = term.academicYear.id;
    const studentProfileId = user.studentProfile.id;

    const [selections, marks, bands] = await Promise.all([
        findActiveSubjectSelectionsForStudent(studentProfileId, academicYearId),
        findMarksForStudentExam(studentProfileId, term.exam.id),
        findAllGradeBands(),
    ]);

    const markBySubjectId = new Map(marks.map((m) => [m.markSheet.subject.id, m]));

    const allRows = selections.map(({ subject }) => {
        const mark = markBySubjectId.get(subject.id);
        if (!mark) {
            return {
                subject,
                marksObtained: null,
                maxMarks: 100,
                isAbsent: false,
                grade: null,
                isPassing: null,
                remarks: null,
                status: "NOT_ENTERED",
            };
        }
        return {
            subject: mark.markSheet.subject,
            marksObtained: toNumber(mark.marksObtained),
            maxMarks: mark.maxMarks,
            isAbsent: mark.isAbsent,
            grade: mark.grade,
            isPassing: resolveIsPassing(mark.grade, bands),
            remarks: mark.remarks,
            status: mark.markSheet.status,
        };
    });

    // Marks not yet released (sheet not APPROVED/LOCKED, or not entered at
    // all) are excluded entirely when the requester is the student; the
    // admin sees every row, each carrying its markSheet status as a label.
    const rows = isAdmin
        ? allRows
        : allRows.filter((r) => r.status !== "NOT_ENTERED" && STUDENT_VISIBLE_STATUSES.has(r.status));

    const gradedRows = rows.filter((r) => r.status !== "NOT_ENTERED" && !r.isAbsent && r.marksObtained !== null);
    const enteredRows = rows.filter((r) => r.status !== "NOT_ENTERED");
    const totalMarks = gradedRows.reduce((sum, r) => sum + r.marksObtained, 0);
    const average = gradedRows.length > 0 ? totalMarks / gradedRows.length : null;
    const overallGrade = average !== null ? resolveGradeFromBands(average, bands) : null;
    const subjectsPassed = gradedRows.filter((r) => r.isPassing === true).length;
    const subjectsFailed = enteredRows.length - subjectsPassed;

    const payload = {
        student: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            admissionNumber: user.studentProfile.admissionNumber,
        },
        class: user.studentProfile.currentClass
            ? { id: user.studentProfile.currentClass.id, name: user.studentProfile.currentClass.name }
            : null,
        academicYear: term.academicYear,
        term: { id: term.id, name: term.name, sequence: term.sequence, startDate: term.startDate, endDate: term.endDate },
        exam: { id: term.exam.id, name: term.exam.name, startDate: term.exam.startDate, endDate: term.exam.endDate },
        subjects: rows,
        totals: {
            subjectCount: enteredRows.length,
            totalMarks,
            average,
            overallGrade,
            subjectsPassed,
            subjectsFailed,
        },
    };

    // The Report model persists actual exported artifacts (ReportFormat is
    // PDF|EXCEL only — there is no "JSON" format in the schema); a json
    // request is just the on-screen view and isn't logged as a generation.
    if (format !== "json") {
        await createReportRow({
            type: "STUDENT_TERM_REPORT",
            format: format.toUpperCase(),
            studentId: studentProfileId,
            termId: term.id,
            academicYearId,
            generatedById: requester.id,
        });
    }

    return payload;
};

// GET /reports/class/:classId/exam/:examId
export const getClassExamReportService = async (requester, classId, examId, format) => {
    const isAdmin = requester.role === "SCHOOL_ADMIN";
    if (!isAdmin) {
        const scope = await resolveTeacherScope(requester.id);
        const inReadScope = scope.teachingClassIds.has(classId) || scope.classTeacherClassId === classId;
        if (!inReadScope) {
            throw new AppError("You are not authorized to view this report.", 403);
        }
    }

    const { klass, exam } = await findClassReportContext(classId, examId);
    if (!klass) {
        throw new AppError("Class not found.", 404);
    }
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }

    const [marks, bands] = await Promise.all([findMarksForClassExam(classId, examId), findAllGradeBands()]);

    const rows = marks.map((m) => ({
        student: {
            id: m.student.userId,
            firstName: m.student.user.firstName,
            lastName: m.student.user.lastName,
            admissionNumber: m.student.admissionNumber,
        },
        subject: m.markSheet.subject,
        marksObtained: toNumber(m.marksObtained),
        maxMarks: m.maxMarks,
        isAbsent: m.isAbsent,
        grade: m.grade,
        isPassing: resolveIsPassing(m.grade, bands),
        remarks: m.remarks,
        status: m.markSheet.status,
    }));

    const gradedRows = rows.filter((r) => !r.isAbsent && r.marksObtained !== null);
    const sortedDesc = [...gradedRows].sort((a, b) => b.marksObtained - a.marksObtained);
    const average = gradedRows.length > 0 ? gradedRows.reduce((sum, r) => sum + r.marksObtained, 0) / gradedRows.length : null;
    const passCount = gradedRows.filter((r) => r.isPassing === true).length;
    const passRate = gradedRows.length > 0 ? passCount / gradedRows.length : null;

    const gradeDistribution = {};
    for (const row of gradedRows) {
        if (!row.grade) continue;
        gradeDistribution[row.grade] = (gradeDistribution[row.grade] ?? 0) + 1;
    }

    const payload = {
        class: { id: klass.id, name: klass.name },
        academicYear: klass.academicYear,
        exam: { id: exam.id, name: exam.name, startDate: exam.startDate, endDate: exam.endDate },
        term: exam.term,
        students: rows,
        stats: {
            studentCount: rows.length,
            highest: sortedDesc.length > 0 ? { student: sortedDesc[0].student, marksObtained: sortedDesc[0].marksObtained } : null,
            lowest:
                sortedDesc.length > 0
                    ? { student: sortedDesc[sortedDesc.length - 1].student, marksObtained: sortedDesc[sortedDesc.length - 1].marksObtained }
                    : null,
            average,
            passRate,
            gradeDistribution,
        },
    };

    if (format !== "json") {
        await createReportRow({
            type: "CLASS_MARKSHEET",
            format: format.toUpperCase(),
            classId: klass.id,
            examId: exam.id,
            academicYearId: klass.academicYear.id,
            generatedById: requester.id,
        });
    }

    return payload;
};
