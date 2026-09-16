export interface TeacherCurrentSubject {
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
}

export interface ClassTeacherOf {
  id: string;
  name: string;
  academicYear: {
    id: string;
    name: string;
  };
}

export interface TeacherListItemDTO {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  isActive: boolean;
  mustChangePassword: boolean;
  currentSubject: { id: string; name: string; code?: string } | null;
  classTeacherOf: { id: string; name: string } | null;
  createdAt: string;
}

export interface TeachingAssignment {
  id: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  class: {
    id: string;
    name: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
}

export interface TeacherDetailDTO extends Omit<TeacherListItemDTO, "currentSubject" | "classTeacherOf"> {
  joinedAt: string;
  currentSubjectAssignment: TeacherCurrentSubject | null;
  teachingAssignments: TeachingAssignment[];
  classTeacherOf: ClassTeacherOf[];
  account: {
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TeacherCreateDTO {
  firstName: string;
  lastName: string;
  email: string;
  employeeNo: string;
  phone?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  joinDate: string;
  subjectId: string;
  classIds?: string[];
  classTeacherOfId?: string;
}

export interface TeacherUpdateDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeNo?: string;
  phone?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER";
  joinDate?: string;
  subjectId?: string;
  classIds?: string[];
  classTeacherOfId?: string | null;
}

export interface TeacherListFilters {
  page?: number;
  limit?: number;
  q?: string;
  subjectId?: string;
  classId?: string;
  classTeacherOnly?: boolean;
  status?: "active" | "inactive" | "all";
}
