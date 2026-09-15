// Shapes the data returned after a successful student registration.
// Never includes the password hash or the one-time password.
export const toStudentDTO = (student) => ({
    id: student.id,
    username: student.username,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    admissionNumber: student.studentProfile.admissionNumber,
    guardianName: student.studentProfile.guardianName,
    guardianPhone: student.studentProfile.guardianPhone,
    currentClassId: student.studentProfile.currentClassId,
    subjects: (student.studentProfile.subjectSelections ?? []).map((s) => s.subject),
    mustChangePassword: student.mustChangePassword,
    createdAt: student.createdAt,
});

// Admin dashboard student-table row — trimmed to what a list view needs.
export const toStudentListItemDTO = (student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    gender: student.gender,
    isActive: student.isActive,
    mustChangePassword: student.mustChangePassword,
    admissionNumber: student.studentProfile.admissionNumber,
    currentClass: student.studentProfile.currentClass
        ? {
              id: student.studentProfile.currentClass.id,
              name: student.studentProfile.currentClass.name,
              academicYear: student.studentProfile.currentClass.academicYear,
          }
        : null,
    createdAt: student.createdAt,
});

// Admin "view student" page — full safe detail, never password/token data
// (nothing in student.repository.js#findStudentDetailById selects them).
export const toStudentDetailDTO = (student) => ({
    id: student.id,
    username: student.username,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    admissionNumber: student.studentProfile.admissionNumber,
    admissionDate: student.studentProfile.admissionDate,
    guardianName: student.studentProfile.guardianName,
    guardianPhone: student.studentProfile.guardianPhone,
    currentClass: student.studentProfile.currentClass
        ? {
              id: student.studentProfile.currentClass.id,
              name: student.studentProfile.currentClass.name,
              academicYear: student.studentProfile.currentClass.academicYear,
          }
        : null,
    enrollmentHistory: student.studentProfile.enrollments.map((e) => ({
        id: e.id,
        isCurrent: e.isCurrent,
        enrolledAt: e.enrolledAt,
        leftAt: e.leftAt,
        class: e.class,
        academicYear: e.academicYear,
    })),
    subjects: student.studentProfile.subjectSelections.map((s) => ({
        id: s.id,
        subject: s.subject,
        academicYear: s.academicYear,
        selectedAt: s.selectedAt,
    })),
    account: {
        isActive: student.isActive,
        mustChangePassword: student.mustChangePassword,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
    },
});
