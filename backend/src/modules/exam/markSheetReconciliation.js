import { AppError } from "../../utils/appError.js";
import { getPrisma } from "../../config/database.js";
import {
    findExamWithTermYear,
    findEnrollmentsForYear,
    findActiveSubjectSelectionsForStudents,
    findActiveTeachingAssignmentsForYear,
    createMissingMarkSheetsTx,
    createMissingMarksTx,
} from "./exam.repository.js";

const groupKey = (classId, subjectId) => `${classId}|${subjectId}`;

// Idempotent MarkSheet/Mark generation for one exam (§13-§27/§35-§39):
//
//   Exam
//    └── one MarkSheet per (class, subject) that at least one enrolled
//        student has actually selected — never per student, never per
//        subject the whole school offers
//         └── one Mark per student who is BOTH currently enrolled in
//             that class for this academic year AND has an active
//             selection for that subject
//
// Safe to call repeatedly: only ever fills in what's missing (createMany
// + skipDuplicates against the schema's own unique constraints — §45),
// never touches or deletes an existing MarkSheet/Mark.
export const reconcileExamMarkSheets = async (examId) => {
    const exam = await findExamWithTermYear(examId);
    if (!exam) {
        throw new AppError("Exam not found.", 404);
    }
    const academicYearId = exam.term.academicYearId;

    // Step 1: each student's class FOR THIS YEAR — the enrollment row with
    // the latest enrolledAt per studentId, never currentClassId (§18/§19).
    const enrollments = await findEnrollmentsForYear(academicYearId);
    const studentClass = new Map(); // studentId -> classId (first occurrence wins: newest first)
    for (const e of enrollments) {
        if (!studentClass.has(e.studentId)) studentClass.set(e.studentId, e.classId);
    }
    const studentIds = Array.from(studentClass.keys());

    if (studentIds.length === 0) {
        return { examId, markSheetsCreated: 0, marksCreated: 0, unresolved: [] };
    }

    // Step 2: each student's active subject selections for this year — the
    // ONLY authoritative source of exam eligibility (§9/§17), never
    // GradeLevelSubjects, never "everyone in the class".
    const selections = await findActiveSubjectSelectionsForStudents(academicYearId, studentIds);

    // Step 3: group into (classId, subjectId) -> Set<studentId>. A group
    // only exists if at least one student actually selected that subject
    // (§14) — this IS the "no meaningless MarkSheet" rule, by construction.
    const groups = new Map(); // "classId|subjectId" -> Set<studentId>
    for (const sel of selections) {
        const classId = studentClass.get(sel.studentId);
        if (!classId) continue; // defensive — every id here came from studentClass's own keys
        const key = groupKey(classId, sel.subjectId);
        if (!groups.has(key)) groups.set(key, new Set());
        groups.get(key).add(sel.studentId);
    }

    // Step 4: resolve the teacher for each group via TeachingAssignment —
    // the ONLY authority for "who owns this MarkSheet" (§20/§37). A group
    // with no matching assignment is skipped and reported, never given an
    // arbitrary teacher.
    const assignments = await findActiveTeachingAssignmentsForYear(academicYearId);
    const teacherFor = new Map(); // "classId|subjectId" -> teacherId
    for (const a of assignments) {
        teacherFor.set(groupKey(a.classId, a.subjectId), a.teacherId);
    }

    const unresolved = [];
    const markSheetRows = [];
    for (const [key, studentSet] of groups) {
        const teacherId = teacherFor.get(key);
        if (!teacherId) {
            const [classId, subjectId] = key.split("|");
            unresolved.push({ classId, subjectId, studentCount: studentSet.size });
            continue;
        }
        const [classId, subjectId] = key.split("|");
        markSheetRows.push({ subjectId, classId, examId, teacherId });
    }

    const db = getPrisma();

    const result = await db.$transaction(async (tx) => {
        const msResult = await createMissingMarkSheetsTx(tx, markSheetRows);

        // Re-read every MarkSheet for this exam (pre-existing + just
        // created) to get their ids — needed to attach Marks.
        const markSheets = await tx.markSheet.findMany({
            where: { examId },
            select: { id: true, subjectId: true, classId: true },
        });
        const markSheetIdFor = new Map(markSheets.map((ms) => [groupKey(ms.classId, ms.subjectId), ms.id]));

        const markRows = [];
        for (const [key, studentSet] of groups) {
            const markSheetId = markSheetIdFor.get(key);
            if (!markSheetId) continue; // unresolved group — no MarkSheet to attach Marks to
            for (const studentId of studentSet) {
                markRows.push({ markSheetId, studentId });
            }
        }

        const markResult = await createMissingMarksTx(tx, markRows);

        return { markSheetsCreated: msResult.count, marksCreated: markResult.count };
    });

    return { examId, ...result, unresolved };
};
