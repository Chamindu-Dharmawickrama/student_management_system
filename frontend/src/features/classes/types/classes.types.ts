export interface Class {
  id: string;
  name: string;
  gradeLevel: {
    id: string;
    level: number;
    name: string;
  };
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDetailDTO extends Class {
  classTeacher: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  currentStudentCount: number;
  teachingAssignments: {
    id: string;
    subject: {
      id: string;
      name: string;
    };
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}
