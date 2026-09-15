export const toSubjectListItemDTO = (subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    isActive: subject.isActive,
});

export const toSubjectDetailDTO = (subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    isActive: subject.isActive,
    teacherCount: subject._count.teacherSubjectAssignments,
    teachingAssignmentCount: subject._count.teachingAssignments,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
});
