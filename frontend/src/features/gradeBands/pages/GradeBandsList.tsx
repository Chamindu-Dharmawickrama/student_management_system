import { useState } from "react";
import toast from "react-hot-toast";
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Pagination, 
  ErrorState,
  Badge,
  Alert,
  ConfirmDialog,
  EmptyState
} from "@/shared/components/ui";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useGetGradeBandsQuery, useDeleteGradeBandMutation } from "../api/gradeBandsApi";
import { GradeBandModal } from "../components/GradeBandModal";
import type { GradeBand } from "../types/gradeBands.types";
import { useAppSelector } from "@/app/hooks";
import { getErrorMessage } from "@/types/api.types";
import { PageContainer } from "@/shared/components/layout";

function GradeScaleVisualizer({ bands }: { bands: GradeBand[] }) {
  // Sort ascending for visualization
  const sortedBands = [...bands].sort((a, b) => a.minMark - b.minMark);
  
  const overlaps: string[] = [];
  const gaps: string[] = [];
  let hasPassing = false;

  // Calculate coverage and check rules
  if (sortedBands.length > 0) {
    let currentMark = 0;
    
    sortedBands.forEach((band, index) => {
      if (band.isPassing) hasPassing = true;
      
      if (band.minMark > currentMark) {
        gaps.push(`${currentMark}-${band.minMark - 1}`);
      } else if (band.minMark < currentMark) {
        const prevBand = sortedBands[index - 1];
        if (prevBand) {
          overlaps.push(`Overlap between ${prevBand.grade} and ${band.grade} (${band.minMark}-${Math.min(prevBand.maxMark, band.maxMark)})`);
        }
      }
      
      currentMark = Math.max(currentMark, band.maxMark + 1);
    });
    
    if (currentMark <= 100) {
      gaps.push(`${currentMark}-100`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Grade Scale Visualization (0-100)</h3>
        
        {sortedBands.length === 0 ? (
          <div className="text-sm text-slate-500 italic">No grade bands defined yet.</div>
        ) : (
          <div className="h-10 w-full flex rounded overflow-hidden">
            {sortedBands.map((band) => {
              const width = Math.max(0, band.maxMark - band.minMark + 1);
              return (
                <div 
                  key={band.id}
                  className={`h-full flex items-center justify-center text-xs font-bold text-white border-r border-white/20 last:border-r-0 ${
                    band.isPassing ? 'bg-success' : 'bg-danger'
                  }`}
                  style={{ width: `${width}%` }}
                  title={`${band.grade}: ${band.minMark}-${band.maxMark}`}
                >
                  {width >= 5 ? band.grade : ''}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <div className="space-y-2">
        {overlaps.length > 0 && (
          <Alert variant="danger" title="Overlapping Bands Detected">
            <ul className="list-disc pl-5">
              {overlaps.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </Alert>
        )}
        
        {gaps.length > 0 && sortedBands.length > 0 && (
          <Alert variant="warning" title="Scale Gaps Detected">
            <p>The following mark ranges are not covered by any grade band: {gaps.join(", ")}</p>
          </Alert>
        )}
        
        {!hasPassing && sortedBands.length > 0 && (
          <Alert variant="warning" title="Warning">
            <p>No passing grade band is defined.</p>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default function GradeBandsList() {
  const { isReadOnly } = useAppSelector((state) => state.academicYear);
  const [filters, setFilters] = useUrlFilters({ page: "1", limit: "10" });

  const { data, isLoading, isError, error, refetch } = useGetGradeBandsQuery({
    page: Number(filters.page),
    limit: Number(filters.limit),
  });

  const [deleteGradeBand, { isLoading: isDeleting }] = useDeleteGradeBandMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBand, setSelectedBand] = useState<GradeBand | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bandToDelete, setBandToDelete] = useState<GradeBand | null>(null);

  // The instructions explicitly require sorting by minMark descending
  // Since pagination is server-side, we ideally sort on backend, but if not, we can sort the current page
  const sortedData = [...(data?.data || [])].sort((a, b) => b.minMark - a.minMark);

  const handleEdit = (band: GradeBand) => {
    setSelectedBand(band);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (band: GradeBand) => {
    setBandToDelete(band);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bandToDelete) return;
    
    try {
      await deleteGradeBand(bandToDelete.id).unwrap();
      toast.success("Grade band deleted successfully");
      setIsDeleteDialogOpen(false);
      setBandToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCreate = () => {
    setSelectedBand(null);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: "Grade",
      key: "grade",
      render: (item: GradeBand) => <span className="font-bold text-slate-900">{item.grade}</span>,
    },
    {
      header: "Range",
      key: "range",
      render: (item: GradeBand) => `${item.minMark} - ${item.maxMark}`,
    },
    {
      header: "Grade Point",
      key: "gradePoint",
      render: (item: GradeBand) => item.gradePoint ?? <span className="text-slate-400">—</span>,
    },
    {
      header: "Passing",
      key: "isPassing",
      render: (item: GradeBand) => (
        <Badge variant={item.isPassing ? "success" : "danger"}>
          {item.isPassing ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      header: "Description",
      key: "description",
      render: (item: GradeBand) => item.description || <span className="text-slate-400">—</span>,
    },
    {
      header: "Actions",
      key: "id",
      render: (item: GradeBand) => (
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
            onClick={() => handleDeleteClick(item)}
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
        title="Grade Bands"
        description="Configure the mapping between marks and letter grades."
        actions={
          <Button onClick={handleCreate} disabled={isReadOnly}>
            Create Grade Band
          </Button>
        }
      />

      {data?.data && <GradeScaleVisualizer bands={data.data} />}

      <DataTable
        columns={columns}
        rows={sortedData}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyState={
          <EmptyState
            title="No grade bands defined."
            action={
              <Button onClick={handleCreate} disabled={isReadOnly}>
                Create Grade Band
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

      <GradeBandModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBand(null);
        }}
        gradeBand={selectedBand}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setBandToDelete(null);
        }}
        title="Delete Grade Band"
        description={
          <div>
            <p>Are you sure you want to delete the <strong>{bandToDelete?.grade}</strong> band?</p>
            <Alert variant="warning" title="Warning" className="mt-4">
              Existing marks keep their already-computed stored grade. Only future computations will change.
            </Alert>
          </div>
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </PageContainer>
  );
}