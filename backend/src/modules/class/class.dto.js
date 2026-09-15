const toClassTeacherDTO = (classTeacher) =>
    classTeacher
        ? { id: classTeacher.user.id, firstName: classTeacher.user.firstName, lastName: classTeacher.user.lastName }
        : null;

export const toClassListItemDTO = (klass) => ({
    id: klass.id,
    name: klass.name,
    gradeLevel: klass.gradeLevel,
    academicYear: klass.academicYear,
    isActive: klass.isActive,
    classTeacher: toClassTeacherDTO(klass.classTeacher),
});

export const toClassDetailDTO = (klass) => ({
    id: klass.id,
    name: klass.name,
    gradeLevel: klass.gradeLevel,
    academicYear: klass.academicYear,
    isActive: klass.isActive,
    classTeacher: toClassTeacherDTO(klass.classTeacher),
    currentStudentCount: klass._count.currentStudents,
    teachingAssignments: klass.teachingAssignments.map((a) => ({
        id: a.id,
        subject: a.subject,
        teacher: { id: a.teacher.user.id, firstName: a.teacher.user.firstName, lastName: a.teacher.user.lastName },
    })),
});
