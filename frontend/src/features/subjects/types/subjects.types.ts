export interface Subject {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDetailDTO extends Subject {
  teacherCount: number;
  teachingAssignmentCount: number;
}
