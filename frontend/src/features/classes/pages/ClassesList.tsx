import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Pagination, 
  Select, 
  ErrorState,
  Badge,
  SearchInput,
  Alert,
  EmptyState,
  Spinner
} from "@/shared/components/ui";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useGetClassesQuery } from "../api/classesApi";
import { ClassModal } from "../components/ClassModal";
import { DeactivateClassDialog } from "../components/DeactivateClassDialog";
import type { Class } from "../types/classes.types";
import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { ROUTES } from "@/constants/app.constants";
import { PageContainer } from "@/shared/components/layout";

export default function ClassesList() {
  const navigate = useNavigate();
  const { yearId: currentYearId, isReadOnly, isLoading: isYearLoading } = useSelectedAcademicYear();
  
  const [filters, setFilters] = useUrlFilters({
    page: "1",
    limit: "10",
    gradeLevel: "",
    status: "all" as "active" | "inactive" | "all",
    q: "",
  });

  const { data, isLoading, isError, error, refetch } = useGetClassesQuery({
    page: Number(filters.page),
    limit: Number(filters.limit),
    status: filters.status,
    q: filters.q || undefined,
    gradeLevel: filters.gradeLevel ? Number(filters.gradeLevel) : undefined,
    academicYearId: currentYearId || undefined,
  }, {
    skip: !currentYearId,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [classToDeactivate, setClassToDeactivate] = useState<Class | null>(null);

  const handleEdit = (e: React.MouseEvent, classItem: Class) => {
    e.stopPropagation();
    setSelectedClass(classItem);
    setIsModalOpen(true);
  };

  const handleDeactivate = (e: React.MouseEvent, classItem: Class) => {
    e.stopPropagation();
    setClassToDeactivate(classItem);
    setIsDeactivateDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: "Name",
      key: "name",
      render: (item: Class) => <span className="font-medium text-slate-900">{item.name}</span>,
    },
    {
      header: "Grade Level",
      key: "gradeLevel",
      render: (item: Class) => item.gradeLevel.name,
    },
    {
      header: "Status",
      key: "isActive",
      render: (item: Class) => (
        <Badge variant={item.isActive ? "success" : "neutral"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      key: "id",
      render: (item: Class) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => handleEdit(e, item)}
            disabled={isReadOnly}
          >
            Edit
          </Button>
          {item.isActive && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => handleDeactivate(e, item)}
              disabled={isReadOnly}
              className="text-danger hover:bg-danger-50 hover:border-danger hover:text-danger"
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isYearLoading) {
    return <Spinner fullPage message="Loading academic year..." />;
  }

  if (!currentYearId) {
    return (
    <PageContainer>
        <PageHeader title="Classes" description="Manage classes for the academic year." />
        <Alert variant="warning" title="Warning">
          Please select an academic year from the top bar to view or manage classes.
        </Alert>
      </PageContainer>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Generate grade level options 6 to 13 just for the filter UI.
  // The backend handles true validation for creation.
  const gradeLevels = Array.from({ length: 8 }, (_, i) => i + 6);

  return (
    <PageContainer>
      <PageHeader
        title="Classes"
        description="Manage classes, grade levels, and view assignments."
        actions={
          <Button onClick={handleCreate} disabled={isReadOnly}>
            Create Class
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search classes..."
            value={filters.q}
            onChange={(q) => setFilters({ q, page: "1" })}
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            value={filters.gradeLevel}
            onChange={(e) => setFilters({ gradeLevel: e.target.value, page: "1" })}
            options={[
              { label: "All Grades", value: "" },
              ...gradeLevels.map(g => ({ label: `Grade ${g}`, value: String(g) }))
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as "active" | "inactive" | "all", page: "1" })}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "active" },
              { label: "Inactive Only", value: "inactive" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={(item) => navigate(ROUTES.ADMIN_CLASS_DETAIL.replace(":id", item.id))}
        emptyState={
          <EmptyState
            title="No classes found in this academic year."
            action={
              <Button onClick={handleCreate} disabled={isReadOnly}>
                Create Class
              </Button>
            }
          />
        }
      />

      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination
          meta={data.meta}
          onPageChange={(page) => setFilters({ page: String(page) })}
        />
      )}

      <ClassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(null);
        }}
        classItem={selectedClass}
      />

      <DeactivateClassDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => {
          setIsDeactivateDialogOpen(false);
          setClassToDeactivate(null);
        }}
        classItem={classToDeactivate}
      />
    </PageContainer>
  );
}