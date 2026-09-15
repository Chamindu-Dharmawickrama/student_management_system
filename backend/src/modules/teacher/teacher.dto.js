// Shapes the data returned after a successful teacher registration.
// Never includes the password hash or the one-time password.
export const toTeacherDTO = (teacher) => ({
    id: teacher.id,
    username: teacher.username,
    email: teacher.email,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone,
    gender: teacher.gender,
    employeeNo: teacher.teacherProfile.employeeNo,
    joinedAt: teacher.teacherProfile.joinedAt,
    mustChangePassword: teacher.mustChangePassword,
    createdAt: teacher.createdAt,
});

// Admin dashboard teacher-table row — trimmed to what a list view needs.
export const toTeacherListItemDTO = (teacher) => ({
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    phone: teacher.phone,
    gender: teacher.gender,
    isActive: teacher.isActive,
    mustChangePassword: teacher.mustChangePassword,
    employeeNo: teacher.teacherProfile.employeeNo,
    joinedAt: teacher.teacherProfile.joinedAt,
    currentSubject: teacher.teacherProfile.subjectAssignments[0]?.subject ?? null,
    classTeacherOf: teacher.teacherProfile.classesAsClassTeacher[0] ?? null,
    createdAt: teacher.createdAt,
});

// Admin "view teacher" page — full safe detail, never password/token data
// (nothing in teacher.repository.js#findTeacherDetailById selects them).
export const toTeacherDetailDTO = (teacher) => ({
    id: teacher.id,
    username: teacher.username,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    phone: teacher.phone,
    gender: teacher.gender,
    employeeNo: teacher.teacherProfile.employeeNo,
    joinedAt: teacher.teacherProfile.joinedAt,
    currentSubjectAssignment: teacher.teacherProfile.subjectAssignments[0]
        ? {
              subject: teacher.teacherProfile.subjectAssignments[0].subject,
              academicYear: teacher.teacherProfile.subjectAssignments[0].academicYear,
          }
        : null,
    teachingAssignments: teacher.teacherProfile.teachingAssignments.map((a) => ({
        id: a.id,
        subject: a.subject,
        class: a.class,
        academicYear: a.academicYear,
    })),
    classTeacherOf: teacher.teacherProfile.classesAsClassTeacher.map((c) => ({
        id: c.id,
        name: c.name,
        academicYear: c.academicYear,
    })),
    account: {
        isActive: teacher.isActive,
        mustChangePassword: teacher.mustChangePassword,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
    },
});
