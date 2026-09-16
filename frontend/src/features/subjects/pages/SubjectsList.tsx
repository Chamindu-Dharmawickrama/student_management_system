import { useState } from "react";
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Pagination, 
  Select, 
  ErrorState,
  Badge,
  SearchInput,
  EmptyState
} from "@/shared/components/ui";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useGetSubjectsQuery } from "../api/subjectsApi";
import { SubjectModal } from "../components/SubjectModal";
import { DeleteSubjectDialog } from "../components/DeleteSubjectDialog";
import type { Subject } from "../types/subjects.types";
import { useAppSelector } from "@/app/hooks";
import { PageContainer } from "@/shared/components/layout";

export default function SubjectsList() {
  const { isReadOnly } = useAppSelector((state) => state.academicYear);
  const [filters, setFilters] = useUrlFilters({
    page: "1",
    limit: "10",
    status: "all" as "active" | "inactive" | "all",
    q: "",
  });

  const { data, isLoading, isError, error, refetch } = useGetSubjectsQuery({
    page: Number(filters.page),
    limit: Number(filters.limit),
    status: filters.status,
    q: filters.q || undefined,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (subject: Subject) => {
    setSubjectToDelete(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: "Name",
      key: "name",
      render: (item: Subject) => <span className="font-medium text-slate-900">{item.name}</span>,
    },
    {
      header: "Code",
      key: "code",
      render: (item: Subject) => item.code || <span className="text-slate-400">—</span>,
    },
    {
      header: "Status",
      key: "isActive",
      render: (item: Subject) => (
        <Badge variant={item.isActive ? "success" : "neutral"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      key: "id",
      render: (item: Subject) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleEdit(item)}
            disabled={isReadOnly}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(item)}
            disabled={isReadOnly}
            className="text-danger hover:bg-danger-50 hover:border-danger hover:text-danger"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Subjects"
        description="Manage the list of subjects offered in the school."
        actions={
          <Button onClick={handleCreate} disabled={isReadOnly}>
            Create Subject
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search subjects..."
            value={filters.q}
            onChange={(q) => setFilters({ q, page: "1" })}
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
        emptyState={
          <EmptyState
            title="No subjects found."
            description="Add a subject to get started."
            action={
              <Button onClick={handleCreate} disabled={isReadOnly}>
                Create Subject
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

      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
        }}
        subject={selectedSubject}
      />

      <DeleteSubjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSubjectToDelete(null);
        }}
        subject={subjectToDelete}
      />
    </PageContainer>
  );
}