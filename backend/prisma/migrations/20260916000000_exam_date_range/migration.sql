-- Replace the manually-toggled ExamStatus workflow with a date-range-driven
-- exam period: mark entry unlocks once Exam.endDate has passed, computed at
-- request time rather than stored as a status the admin flips by hand.
ALTER TABLE "Exam" DROP COLUMN "status";
ALTER TABLE "Exam" DROP COLUMN "examDate";
ALTER TABLE "Exam" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Exam" ADD COLUMN "endDate" TIMESTAMP(3);
DROP TYPE "ExamStatus";
