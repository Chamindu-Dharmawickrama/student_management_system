export interface GradeBand {
  id: string;
  grade: string;
  minMark: number;
  maxMark: number;
  gradePoint: number | null;
  isPassing: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
