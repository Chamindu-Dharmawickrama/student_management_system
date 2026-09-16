export interface StudentCurrentClass {
  id: string;
  name: string;
  academicYear: {
    id: string;
    name: string;
  };
}

export interface StudentListItemDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  isActive: boolean;
  mustChangePassword: boolean;
  admissionNumber: string;
  currentClass: StudentCurrentClass | null;
  createdAt: string;
}

export interface StudentEnrollmentHistory {
  id: string;
  isCurrent: boolean;
  enrolledAt: string;
  leftAt: string | null;
  class: {
    id: string;
    name: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
}

export interface StudentSubject {
  id: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
  selectedAt: string;
}

export interface StudentDetailDTO extends StudentListItemDTO {
  username: string;
  dateOfBirth: string;
  admissionDate: string;
  guardianName: string | null;
  guardianPhone: string | null;
  enrollmentHistory: StudentEnrollmentHistory[];
  subjects: StudentSubject[];
  account: {
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StudentCreateDTO {
  firstName: string;
  lastName: string;
  email: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  guardianName?: string;
  guardianPhone?: string;
  academicYearId: string;
  classId: string;
  subjectIds?: string[];
}

export interface StudentUpdateDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  guardianName?: string | null;
  guardianPhone?: string | null;
  academicYearId?: string;
  classId?: string;
}

export interface StudentSubjectSelectionsUpdateDTO {
  academicYearId: string;
  subjectIds: string[];
}

export interface StudentListFilters {
  page?: number;
  limit?: number;
  q?: string;
  academicYearId?: string;
  classId?: string;
  gender?: string;
  status?: "active" | "inactive" | "all";
}
