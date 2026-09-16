import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Settings, Eye, Edit, Trash2 } from "lucide-react";
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
} from "@/shared/components/ui";
import { useGetTeachersQuery, useDeleteTeacherMutation } from "../api/teacherApi";

import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { useGetClassesQuery } from "@/features/classes/api/classesApi";
import { useGetSubjectsQuery } from "@/features/subjects/api/subjectsApi";
import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage } from "@/types/api.types";
import { PageContainer } from "@/shared/components/layout";
import type { TeacherListItemDTO as Teacher } from "../types/teacher.types";

export default function TeacherListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentYearId, isReadOnly } = useAppSelector((state) => state.academicYear);
  const { data: selectedYear } = useGetAcademicYearByIdQuery(currentYearId!, { skip: !currentYearId });

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const q = searchParams.get("q") || "";
  const classId = searchParams.get("classId") || "";
  const subjectId = searchParams.get("subjectId") || "";
  const classTeacherOnly = searchParams.get("classTeacherOnly") === "true";
  const status = (searchParams.get("status") as "active" | "inactive" | "all") || "active";

  const { data: teachersData, isLoading, isFetching } = useGetTeachersQuery({
    page,
    limit,
    q: q || undefined,
    classId: classId || undefined,
    subjectId: subjectId || undefined,
    classTeacherOnly: classTeacherOnly || undefined,
    status,
  });

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, academicYearId: currentYearId || undefined },
    { skip: !currentYearId }
  );
  
  const { data: subjectsData } = useGetSubjectsQuery(
    { page: 1, limit: 100, status: "active" },
    { skip: !currentYearId }
  );

  const classOptions = classesData?.data
    ? classesData.data.map((c) => ({ value: c.id, label: c.name }))
    : [];
    
  const subjectOptions = subjectsData?.data
    ? subjectsData.data.map((s) => ({ value: s.id, label: s.name }))
    : [];


  const [deleteTeacher, { isLoading: isDeleting }] = useDeleteTeacherMutation();
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string; employeeNo: string } | null>(null);


  const handleFilterChange = (key: string, value: string | boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await deleteTeacher(teacherToDelete.id).unwrap();
      toast.success("Teacher deactivated/deleted successfully");
      setTeacherToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };


  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their assignments."
        actions={
          <Button
            onClick={() => navigate(ROUTES.ADMIN_TEACHER_NEW)}
            disabled={isReadOnly}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Teacher
          </Button>
        }
      />

      <FilterBar
        onClearAll={() => {
          setSearchParams(new URLSearchParams());
        }}
      >
        <SearchInput
          placeholder="Search teachers..."
          value={q}
          onChange={(value) => handleFilterChange("q", value)}
          className="w-full sm:w-64"
        />
        <Select
          value={classId}
          onChange={(e) => handleFilterChange("classId", e.target.value)}
          options={[{ value: "", label: "All Classes" }, ...classOptions]}
        />
        <Select
          value={subjectId}
          onChange={(e) => handleFilterChange("subjectId", e.target.value)}
          options={[{ value: "", label: "All Subjects" }, ...subjectOptions]}
        />
        <Select
          value={status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          options={[
            { value: "active", label: "Active Only" },
            { value: "inactive", label: "Inactive Only" },
            { value: "all", label: "All Statuses" },
          ]}
        />
        <div className="flex items-center gap-2 text-sm text-text-primary ml-2">
          <input
            type="checkbox"
            checked={classTeacherOnly}
            onChange={(e) => handleFilterChange("classTeacherOnly", e.target.checked ? "true" : "")}
            className="rounded border-border text-primary focus:ring-primary"
          />
          Class Teachers Only
        </div>
      </FilterBar>

      <DataTable
        rows={teachersData?.data ?? []}
        isLoading={isLoading || isFetching}
        getRowId={(item) => item.id}
        columns={[
          {
            key: "employeeNo",
            header: "Emp No",
            render: (item: Teacher) => <span className="font-mono text-sm">{item.employeeNo}</span>,
          },
          {
            key: "teacher",
            header: "Teacher",
            render: (item: Teacher) => (
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
            key: "subject",
            header: "Subject (Current Year)",
            render: (item: Teacher) => {
              if (item.currentSubject) {
                return <Badge variant="neutral">{item.currentSubject.name}</Badge>;
              }
              return <span className="text-sm text-text-muted italic">Unassigned</span>;
            },
          },
          {
            key: "classTeacher",
            header: "Class Teacher",
            render: (item: Teacher) => {
              if (item.classTeacherOf) {
                return <Badge variant="primary">{item.classTeacherOf.name}</Badge>;
              }
              return <span className="text-sm text-text-muted">-</span>;
            },
          },
          {
            key: "phone",
            header: "Phone",
            render: (item: Teacher) => <span className="text-sm">{item.phone || "-"}</span>,
          },
          {
            key: "account",
            header: "Account",
            render: (item: Teacher) => (
              <div className="flex flex-col gap-1 items-start">
                <StatusBadge kind="account" status={item.isActive ? "active" : "inactive"} />
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
            render: (item: Teacher) => (
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
                    onSelect: () => navigate(ROUTES.ADMIN_TEACHER_DETAIL.replace(":id", item.id)),
                  },
                  {
                    label: "Edit",
                    icon: <Edit className="h-4 w-4" />,
                    disabled: isReadOnly,
                    onSelect: () => navigate(ROUTES.ADMIN_TEACHER_EDIT.replace(":id", item.id)),
                  },
                  {
                    label: item.isActive ? "Deactivate" : "Delete",
                    icon: <Trash2 className="h-4 w-4" />,
                    disabled: isReadOnly,
                    danger: true,
                    onSelect: () => setTeacherToDelete({ id: item.id, name: `${item.firstName} ${item.lastName}`, employeeNo: item.employeeNo }),
                  },
                ]}
              />
            ),
          },
        ]}
        emptyState={
          <EmptyState
            title="No teachers found"
            description={q || classId || subjectId || classTeacherOnly || status !== "active"
              ? "Try adjusting your search or filters."
              : "Get started by registering a new teacher."}
            action={!isReadOnly && !q && !classId && !subjectId && !classTeacherOnly && status === "active" ? (
              <Button onClick={() => navigate(ROUTES.ADMIN_TEACHER_NEW)} leftIcon={<Plus className="h-4 w-4" />}>
                New Teacher
              </Button>
            ) : undefined}
          />
        }
      />

      {teacherToDelete && (
        <ConfirmDialog
          isOpen={!!teacherToDelete}
          onClose={() => {
            setTeacherToDelete(null);
          }}
          title="Deactivate or Delete Teacher"
          description={`Are you sure you want to deactivate/delete ${teacherToDelete.name} (${teacherToDelete.employeeNo})? If the teacher has academic history, their account will be deactivated instead of deleted, preserving all historical data.`}
          confirmLabel="Yes, proceed"
          onConfirm={handleDelete}
          variant="danger"
          isLoading={isDeleting}
          confirmPhrase={teacherToDelete.employeeNo}
        />
      )}
    </PageContainer>
  );
}
