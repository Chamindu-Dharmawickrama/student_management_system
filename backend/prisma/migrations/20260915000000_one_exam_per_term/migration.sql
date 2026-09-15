-- Enforce exactly one Exam per Term at the DB level (was 1-3 per term).
DROP INDEX "Exam_termId_sequence_key";
DROP INDEX "Exam_termId_idx";
CREATE UNIQUE INDEX "Exam_termId_key" ON "Exam"("termId");
