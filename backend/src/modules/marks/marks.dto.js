// Shared shape for both the teacher and student marks APIs. `student.id`
// is the User id (matching GET /students, GET /teacher/students, etc.) —
// never the internal StudentProfile id Mark.studentId actually stores.
export const toMarkDTO = (mark) => ({
    id: mark.id,
    student: {
        id: mark.student.userId,
        firstName: mark.student.user.firstName,
        lastName: mark.student.user.lastName,
        admissionNumber: mark.student.admissionNumber,
    },
    subject: mark.markSheet.subject,
    class: mark.markSheet.class,
    exam: {
        id: mark.markSheet.exam.id,
        name: mark.markSheet.exam.name,
        term: mark.markSheet.exam.term,
    },
    marksObtained: mark.marksObtained,
    maxMarks: mark.maxMarks,
    isAbsent: mark.isAbsent,
    grade: mark.grade,
    remarks: mark.remarks,
    markSheetStatus: mark.markSheet.status,
    createdAt: mark.createdAt,
    updatedAt: mark.updatedAt,
});
