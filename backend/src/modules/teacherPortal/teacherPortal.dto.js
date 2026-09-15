// Admin dashboard student-table row analog, scoped to a teacher's own
// classes — deliberately smaller than the admin DTO (no guardian info,
// nothing beyond what a teacher's academic dashboard needs, §36).
export const toTeacherStudentListItemDTO = (student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    gender: student.gender,
    admissionNumber: student.studentProfile.admissionNumber,
    currentClass: student.studentProfile.currentClass,
});
