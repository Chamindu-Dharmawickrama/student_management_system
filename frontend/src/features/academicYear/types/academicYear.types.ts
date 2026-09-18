// The light list-item DTO returned by GET /academic-years — no `terms`,
// `createdAt`, or `updatedAt` (those only exist on the detail DTO).
export interface AcademicYearListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Exam {
  id: string;
  name: string;
  sequence: number;
  startDate: string | null;
  endDate: string | null;
  isEntryOpen?: boolean;
}

export interface Term {
  id: string;
  name: string;
  sequence: number;
  startDate: string | null;
  endDate: string | null;
  exam: Exam;
}

export interface AcademicYearDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms: Term[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamDetailDTO extends Exam {
  isEntryOpen: boolean;
  term: {
    id: string;
    name: string;
    sequence: number;
    startDate: string | null;
    endDate: string | null;
  };
  academicYear: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  markSheetCount: number;
}
