import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Settings, Eye, Edit, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  PageHeader,
  FilterBar,
  Button,
  DataTable,
  StatusBadge,
  Badge,
  Avatar,
  DropdownMenu,
  ConfirmDialog,
  Alert,
  EmptyState,
  SearchInput,
  Select,
  Spinner
} from "@/shared/components/ui";
import { useGetStudentsQuery, useDeleteStudentMutation } from "../api/studentApi";

import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { useGetClassesQuery } from "@/features/classes/api/classesApi";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage } from "@/types/api.types";
import { PageContainer } from "@/shared/components/layout";
import type { StudentListItemDTO as Student } from "../types/student.types";

export default function StudentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { year: selectedYear, yearId: currentYearId, isReadOnly, isLoading: isYearLoading } = useSelectedAcademicYear();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const q = searchParams.get("q") || "";
  const classId = searchParams.get("classId") || "";
  const gender = searchParams.get("gender") || "";
  const status = (searchParams.get("status") as "active" | "inactive" | "all") || "active";

  const { data: studentsData, isLoading, isFetching } = useGetStudentsQuery({
    page,
    limit,
    q: q || undefined,
    academicYearId: currentYearId || undefined,
    classId: classId || undefined,
    gender: gender || undefined,
    status,
  }, { skip: !currentYearId });


  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, academicYearId: currentYearId || undefined },
    { skip: !currentYearId }
  );

  const classOptions = classesData?.data
    ? classesData.data.map((c) => ({ value: c.id, label: c.name }))
    : [];

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string; admissionNumber: string } | null>(null);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id).unwrap();
      toast.success("Student deactivated/deleted successfully");
      setStudentToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };


  if (isYearLoading) {
    return <Spinner fullPage message="Loading academic year..." />;
  }

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        description={`Manage students for the ${selectedYear.name} academic year.`}
        actions={
          <Button
            onClick={() => navigate(ROUTES.ADMIN_STUDENT_NEW)}
            disabled={isReadOnly}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Student
          </Button>
        }
      />

      <FilterBar onClearAll={() => setSearchParams(new URLSearchParams())}>
        <SearchInput
          placeholder="Search students..."
          value={q}
          onChange={(value) => updateParam("q", value)}
          className="w-full sm:w-64"
        />
        <Select
          value={classId}
          onChange={(e) => updateParam("classId", e.target.value)}
          options={[{ value: "", label: "All Classes" }, ...classOptions]}
        />
        <Select
          value={gender}
          onChange={(e) => updateParam("gender", e.target.value)}
          options={[
            { value: "", label: "All Genders" },
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
            { value: "OTHER", label: "Other" },
          ]}
        />
        <Select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          options={[
            { value: "active", label: "Active Only" },
            { value: "inactive", label: "Inactive Only" },
            { value: "all", label: "All Statuses" },
          ]}
        />
      </FilterBar>

      <DataTable
        rows={studentsData?.data ?? []}
        isLoading={isLoading || isFetching}
        getRowId={(item) => item.id}
        columns={[
          {
            key: "admissionNumber",
            header: "Admission No",
            render: (item: Student) => <span className="font-mono text-sm">{item.admissionNumber}</span>,
          },
          {
            key: "student",
            header: "Student",
            render: (item: Student) => (
              <div className="flex items-center gap-3">
                <Avatar firstName={item.firstName} lastName={item.lastName} size="sm" />
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">
                    {item.firstName} {item.lastName}
                  </span>
                  <span className="text-xs text-text-muted">{item.email}</span>
                </div>
              </div>
            ),
          },
          {
            key: "class",
            header: "Class",
            render: (item: Student) => (
              item.currentClass ? (
                <Badge variant="neutral">{item.currentClass.name}</Badge>
              ) : (
                <span className="text-sm text-text-muted italic">Unassigned</span>
              )
            ),
          },
          {
            key: "gender",
            header: "Gender",
            render: (item: Student) => (
              <span className="text-sm capitalize">{item.gender.toLowerCase()}</span>
            ),
          },
          {
            key: "account",
            header: "Account Status",
            render: (item: Student) => (
              <div className="flex flex-col gap-1 items-start">
                <StatusBadge
                  kind="account"
                  status={item.isActive ? "active" : "inactive"}
                />
                {item.mustChangePassword && (
                  <Badge variant="warning" className="text-[10px]">
                    Pending first login
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (item: Student) => (
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="sm" aria-label="Actions">
                    <Settings className="h-4 w-4" />
                  </Button>
                }
                items={[
                  {
                    label: "View details",
                    icon: <Eye className="h-4 w-4" />,
                    onSelect: () => navigate(ROUTES.ADMIN_STUDENT_DETAIL.replace(":id", item.id)),
                  },
                  {
                    label: "Edit",
                    icon: <Edit className="h-4 w-4" />,
                    disabled: isReadOnly,
                    onSelect: () => navigate(ROUTES.ADMIN_STUDENT_EDIT.replace(":id", item.id)),
                  },
                  {
                    label: "Manage subjects",
                    icon: <ShieldAlert className="h-4 w-4" />,
                    disabled: isReadOnly,
                    onSelect: () => navigate(ROUTES.ADMIN_STUDENT_DETAIL.replace(":id", item.id) + "?tab=subjects"),
                  },
                  {
                    label: item.isActive ? "Deactivate" : "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    disabled: isReadOnly,
                    danger: true,
                    onSelect: () => setStudentToDelete({ id: item.id, name: `${item.firstName} ${item.lastName}`, admissionNumber: item.admissionNumber }),
                  },
                ]}
              />
            ),
          },
        ]}
        emptyState={
          <EmptyState
            title="No students found"
            description={q || classId || gender || status !== "active"
              ? "Try adjusting your search or filters."
              : "Get started by registering a new student."}
            action={!isReadOnly && !q && !classId && !gender && status === "active" ? (
              <Button onClick={() => navigate(ROUTES.ADMIN_STUDENT_NEW)} leftIcon={<Plus className="h-4 w-4" />}>
                New Student
              </Button>
            ) : undefined}
          />
        }
      />

      {studentToDelete && (
        <ConfirmDialog
          isOpen={!!studentToDelete}
          onClose={() => {
            setStudentToDelete(null);
          }}
          title="Deactivate or Delete Student"
          description={`Are you sure you want to deactivate/delete ${studentToDelete.name} (${studentToDelete.admissionNumber})? If the student has academic history, their account will be deactivated instead of deleted, preserving all historical data.`}
          confirmLabel="Yes, proceed"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={isDeleting}
          confirmPhrase={studentToDelete.admissionNumber}
        />
      )}
    </PageContainer>
  );
}
