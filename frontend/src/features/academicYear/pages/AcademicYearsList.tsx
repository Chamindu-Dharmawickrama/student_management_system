import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Pagination, 
  Select, 
  Badge,
  ErrorState,
  EmptyState
} from "@/shared/components/ui";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useGetAcademicYearsPaginatedQuery } from "../api/academicYearApi";
import { AcademicYearModal } from "../components/AcademicYearModal";
import { useSelectedAcademicYear } from "../hooks/useSelectedAcademicYear";
import { formatDate } from "@/shared/utils/dateUtils";
import type { AcademicYearListItem as AcademicYear } from "../types/academicYear.types";
import { PageContainer } from "@/shared/components/layout";

export default function AcademicYearsList() {
  const navigate = useNavigate();
  const { isReadOnly } = useSelectedAcademicYear();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useUrlFilters({
    page: "1",
    limit: "10",
    status: "all" as "all" | "current",
  });

  const { data, isLoading, isError, error, refetch } = useGetAcademicYearsPaginatedQuery({
    page: Number(filters.page),
    limit: Number(filters.limit),
    status: filters.status,
  });

  const columns = [
    {
      header: "Name",
      key: "name",
      render: (item: AcademicYear) => (
        <span className="font-medium text-slate-900">{item.name}</span>
      ),
    },
    {
      header: "Date Range",
      key: "dateRange",
      render: (item: AcademicYear) => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
    },
    {
      header: "Status",
      key: "isCurrent",
      render: (item: AcademicYear) => (
        item.isCurrent ? <Badge variant="success">Current</Badge> : null
      ),
    },
  ];

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Academic Years"
        description="Manage school years, terms, and exam periods."
        actions={
          <Button 
            onClick={() => setIsModalOpen(true)}
            disabled={isReadOnly}
            title={isReadOnly ? "Cannot create years while viewing a past year" : undefined}
          >
            Create Year
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="w-48">
          <Select
            label=""
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as "all" | "current" })}
            options={[
              { label: "All Years", value: "all" },
              { label: "Current Only", value: "current" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={(item) => navigate(`/admin/academic-years/${item.id}`)}
        emptyState={
          <EmptyState 
            title="No academic years found." 
            description="Create one to provision terms and exams."
            action={
              <Button onClick={() => setIsModalOpen(true)} disabled={isReadOnly}>
                Create Year
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

      <AcademicYearModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </PageContainer>
  );
}