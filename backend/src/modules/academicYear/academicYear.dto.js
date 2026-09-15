export const toAcademicYearListItemDTO = (year) => ({
    id: year.id,
    name: year.name,
    startDate: year.startDate,
    endDate: year.endDate,
    isCurrent: year.isCurrent,
});

const toTermDTO = (term) => ({
    id: term.id,
    name: term.name,
    sequence: term.sequence,
    startDate: term.startDate,
    endDate: term.endDate,
    exam: term.exam,
});

export const toAcademicYearDetailDTO = (year) => ({
    id: year.id,
    name: year.name,
    startDate: year.startDate,
    endDate: year.endDate,
    isCurrent: year.isCurrent,
    terms: year.terms.map(toTermDTO),
    createdAt: year.createdAt,
    updatedAt: year.updatedAt,
});

export const toTermListDTO = (term) => toTermDTO(term);

export const toTermDetailDTO = (term) => ({
    ...toTermDTO(term),
    academicYearId: term.academicYearId,
});
