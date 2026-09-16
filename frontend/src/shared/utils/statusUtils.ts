import type { ExamPeriodStatus } from '@/shared/components/ui/StatusBadge';

/**
 * Derives the exam-period status key from the same fields
 * `toExamDetailDTO` returns, mirroring `isEntryOpen`'s own gate
 * (`Boolean(endDate) && now > endDate`).
 */
export function getExamPeriodStatus(exam: {
  startDate: string | null;
  endDate: string | null;
  isEntryOpen: boolean;
}): ExamPeriodStatus {
  if (exam.isEntryOpen) return 'entry-open';
  if (!exam.startDate || !exam.endDate) return 'not-configured';
  const now = Date.now();
  if (now < new Date(exam.startDate).getTime()) return 'upcoming';
  return 'in-progress';
}
