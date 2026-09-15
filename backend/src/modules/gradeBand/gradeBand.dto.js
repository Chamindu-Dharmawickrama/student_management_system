export const toGradeBandDTO = (band) => ({
    id: band.id,
    grade: band.grade,
    minMark: band.minMark,
    maxMark: band.maxMark,
    gradePoint: band.gradePoint,
    isPassing: band.isPassing,
    description: band.description,
});
