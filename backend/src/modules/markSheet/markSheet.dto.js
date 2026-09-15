export const toMarkSheetDTO = (markSheet, stats) => ({
    id: markSheet.id,
    exam: {
        id: markSheet.exam.id,
        name: markSheet.exam.name,
        term: markSheet.exam.term,
    },
    class: markSheet.class,
    subject: markSheet.subject,
    teacher: {
        id: markSheet.teacher.user.id,
        firstName: markSheet.teacher.user.firstName,
        lastName: markSheet.teacher.user.lastName,
    },
    status: markSheet.status,
    submittedAt: markSheet.submittedAt,
    approvedBy: markSheet.approvedBy,
    approvedAt: markSheet.approvedAt,
    rejectionReason: markSheet.rejectionReason,
    stats,
    createdAt: markSheet.createdAt,
    updatedAt: markSheet.updatedAt,
});
