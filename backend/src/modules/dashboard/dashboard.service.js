import { AppError } from "../../utils/appError.js";
import { resolveTeacherScope } from "../teacher/teacher.scope.js";
import { resolveStudentScope } from "../student/student.scope.js";
import { groupMarkSheetCountsByStatus, normalizeMarkSheetStatusCounts } from "../markSheet/markSheet.repository.js";
import { STUDENT_VISIBLE_STATUSES } from "../markSheet/markSheet.status.js";
import { resolveGradeFromBands } from "../gradeBand/gradeBand.service.js";
import { findAllGradeBands } from "../gradeBand/gradeBand.repository.js";
import {
    findCurrentAcademicYear,
    findAcademicYearById,
    countStudents,
    countTeachers,
    countActiveStudents,
    countInactiveStudents,
    countActiveSubjects,
    countClassesForYear,
    countPendingCredentialChanges,
    countUnconfiguredExamPeriods,
    findTermsWithExamCounts,
    findRecentAuditLog,
    findSubjectById,
    findClassesWithStudentCount,
    findClassWithStudentCount,
    countStudentsInClasses,
    findTermsWithExamGate,
    countPendingEntryForTeacher,
    findClassById,
    findActiveSubjectSelectionsForStudent,
    findTermsForYear,
    findMarksForStudentTerms,
} from "./dashboard.repository.js";

const isEntryOpen = (endDate) => Boolean(endDate) && new Date() > endDate;

// GET /dashboard/admin
export const getAdminDashboardService = async (query) => {
    const academicYear = query.academicYearId
        ? await findAcademicYearById(query.academicYearId)
        : await findCurrentAcademicYear();
    if (!academicYear) {
        throw new AppError(
            query.academicYearId ? "Academic year not found." : "No current academic year is configured.",
            query.academicYearId ? 404 : 400,
        );
    }

    const [
        students,
        teachers,
        subjects,
        classes,
        activeStudents,
        inactiveStudents,
        pendingCredentialChanges,
        markSheetGroups,
        terms,
        examPeriodsUnconfigured,
        recentAuditLog,
    ] = await Promise.all([
        countStudents(),
        countTeachers(),
        countActiveSubjects(),
        countClassesForYear(academicYear.id),
        countActiveStudents(),
        countInactiveStudents(),
        countPendingCredentialChanges(),
        groupMarkSheetCountsByStatus({ exam: { term: { academicYearId: academicYear.id } } }),
        findTermsWithExamCounts(academicYear.id),
        countUnconfiguredExamPeriods(academicYear.id),
        findRecentAuditLog(10),
    ]);

    return {
        academicYear: { id: academicYear.id, name: academicYear.name, isCurrent: academicYear.isCurrent },
        counts: { students, teachers, classes, subjects, activeStudents, inactiveStudents },
        pendingCredentialChanges,
        markSheets: normalizeMarkSheetStatusCounts(markSheetGroups),
        terms: terms.map((term) => ({
            id: term.id,
            name: term.name,
            sequence: term.sequence,
            startDate: term.startDate,
            endDate: term.endDate,
            exam: term.exam
                ? {
                      id: term.exam.id,
                      startDate: term.exam.startDate,
                      endDate: term.exam.endDate,
                      isEntryOpen: isEntryOpen(term.exam.endDate),
                      markSheetCount: term.exam._count.markSheets,
                  }
                : null,
        })),
        examPeriodsUnconfigured,
        recentActivity: recentAuditLog.map((log) => ({
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            performedBy: log.performedBy
                ? { id: log.performedBy.id, firstName: log.performedBy.firstName, lastName: log.performedBy.lastName }
                : null,
            createdAt: log.createdAt,
        })),
    };
};

// GET /dashboard/teacher
export const getTeacherDashboardService = async (teacherUserId) => {
    const scope = await resolveTeacherScope(teacherUserId);
    const allClassIds = new Set(scope.teachingClassIds);
    if (scope.classTeacherClassId) allClassIds.add(scope.classTeacherClassId);

    const [subject, teachingClasses, classTeacherOf, totalStudents, terms, markSheetGroups, pendingEntry] = await Promise.all([
        scope.subjectId ? findSubjectById(scope.subjectId) : null,
        scope.teachingClassIds.size > 0 ? findClassesWithStudentCount(Array.from(scope.teachingClassIds)) : [],
        scope.classTeacherClassId ? findClassWithStudentCount(scope.classTeacherClassId) : null,
        countStudentsInClasses(Array.from(allClassIds)),
        scope.currentAcademicYearId ? findTermsWithExamGate(scope.currentAcademicYearId) : [],
        groupMarkSheetCountsByStatus({ teacherId: scope.teacherId }),
        countPendingEntryForTeacher(scope.teacherId),
    ]);

    return {
        subject: subject ? { id: subject.id, name: subject.name } : null,
        teachingClasses: teachingClasses.map((c) => ({ id: c.id, name: c.name, studentCount: c._count.currentStudents })),
        classTeacherOf: classTeacherOf
            ? { id: classTeacherOf.id, name: classTeacherOf.name, studentCount: classTeacherOf._count.currentStudents }
            : null,
        totalStudents,
        terms: terms.map((term) => ({
            id: term.id,
            name: term.name,
            sequence: term.sequence,
            exam: term.exam ? { id: term.exam.id, isEntryOpen: isEntryOpen(term.exam.endDate), endDate: term.exam.endDate } : null,
        })),
        markSheets: normalizeMarkSheetStatusCounts(markSheetGroups),
        pendingEntry,
    };
};

// GET /dashboard/student
export const getStudentDashboardService = async (studentUserId) => {
    const scope = await resolveStudentScope(studentUserId);

    const [currentClass, academicYear, subjectSelections, terms] = await Promise.all([
        scope.currentClassId ? findClassById(scope.currentClassId) : null,
        scope.currentAcademicYearId ? findAcademicYearById(scope.currentAcademicYearId) : null,
        scope.currentAcademicYearId ? findActiveSubjectSelectionsForStudent(scope.studentProfileId, scope.currentAcademicYearId) : [],
        scope.currentAcademicYearId ? findTermsForYear(scope.currentAcademicYearId) : [],
    ]);

    const subjectsTotal = subjectSelections.length;
    const marks = await findMarksForStudentTerms(scope.studentProfileId, terms.map((t) => t.id));

    // Same visibility gate as marks.repository.js#findMarksForStudent — a
    // mark only counts as "graded" once it has real data AND its sheet is
    // APPROVED/LOCKED.
    const visibleMarks = marks.filter(
        (m) => STUDENT_VISIBLE_STATUSES.has(m.markSheet.status) && (m.isAbsent || m.marksObtained !== null),
    );

    const marksByTerm = new Map();
    for (const mark of visibleMarks) {
        const termId = mark.markSheet.exam.termId;
        if (!marksByTerm.has(termId)) marksByTerm.set(termId, []);
        marksByTerm.get(termId).push(mark);
    }

    const termSummaries = terms.map((term) => {
        const termMarks = marksByTerm.get(term.id) ?? [];
        const subjectsGraded = termMarks.length;
        return {
            id: term.id,
            name: term.name,
            sequence: term.sequence,
            exam: term.exam ? { id: term.exam.id, endDate: term.exam.endDate } : null,
            // "Released" means EVERY selected subject is visible for that
            // term, not just one — a partial reveal isn't badged as done.
            marksReleased: subjectsTotal > 0 && subjectsGraded === subjectsTotal,
            subjectsGraded,
            subjectsTotal,
        };
    });

    const latestGradedTerm = [...termSummaries].reverse().find((t) => t.subjectsGraded > 0) ?? null;

    let latestTermSummary = null;
    if (latestGradedTerm) {
        const termMarks = marksByTerm.get(latestGradedTerm.id);
        const nonAbsent = termMarks.filter((m) => !m.isAbsent && m.marksObtained !== null);
        const average = nonAbsent.length > 0
            ? nonAbsent.reduce((sum, m) => sum + Number(m.marksObtained), 0) / nonAbsent.length
            : null;
        const grade = average !== null ? resolveGradeFromBands(average, await findAllGradeBands()) : null;
        const sortedDesc = [...nonAbsent].sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained));
        const toEntry = (m) => ({ subject: m.markSheet.subject, marksObtained: Number(m.marksObtained) });

        latestTermSummary = {
            termId: latestGradedTerm.id,
            average,
            grade,
            highest: sortedDesc.length > 0 ? toEntry(sortedDesc[0]) : null,
            lowest: sortedDesc.length > 0 ? toEntry(sortedDesc[sortedDesc.length - 1]) : null,
        };
    }

    return {
        currentClass: currentClass ? { id: currentClass.id, name: currentClass.name } : null,
        academicYear: academicYear ? { id: academicYear.id, name: academicYear.name } : null,
        subjects: subjectSelections.map((s) => s.subject),
        terms: termSummaries,
        latestTermSummary,
    };
};
