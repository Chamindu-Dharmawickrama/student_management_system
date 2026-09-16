import { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button, Card, MultiSelect, Alert, Spinner, ConfirmDialog } from "@/shared/components/ui";
import { useGetSubjectsQuery } from "@/features/subjects/api/subjectsApi";
import { useGetStudentSubjectSelectionsQuery, useUpdateStudentSubjectSelectionsMutation } from "../api/studentApi";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { getErrorMessage } from "@/types/api.types";
import { BookOpen } from "lucide-react";
import { useAppSelector } from "@/app/hooks";

interface SubjectSelectionManagerProps {
  studentId: string;
  studentName: string;
}

export function SubjectSelectionManager({ studentId, studentName }: SubjectSelectionManagerProps) {
  // Use global academic year context
  const { currentYearId, isReadOnly } = useAppSelector((state) => state.academicYear);
  const { data: selectedYear } = useGetAcademicYearByIdQuery(currentYearId!, { skip: !currentYearId });

  const { data: selectionsData, isLoading: isLoadingSelections, isFetching: isFetchingSelections } = useGetStudentSubjectSelectionsQuery(
    { id: studentId, academicYearId: currentYearId ?? "" },
    { skip: !currentYearId }
  );

  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsQuery(
    { page: 1, limit: 100, status: "active" }, // get up to 100 active subjects
    { skip: isReadOnly } // don't need options if readonly
  );

  const [updateSelections, { isLoading: isUpdating }] = useUpdateStudentSubjectSelectionsMutation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  // Current server selections for diffing
  const currentSelections = useMemo(() => {
    if (!selectionsData?.data) return [];
    return selectionsData.data.map((s) => s.subject.id);
  }, [selectionsData]);

  // Sync state with server data
  useEffect(() => {
    if (selectionsData?.data) {
      // eslint-disable-next-line
      setSelectedIds(selectionsData.data.map((s) => s.subject.id));
    } else {
      // eslint-disable-next-line
      setSelectedIds([]);
    }
  }, [selectionsData]);

  const hasChanges = useMemo(() => {
    const sortedCurrent = [...currentSelections].sort();
    const sortedSelected = [...selectedIds].sort();
    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedSelected);
  }, [currentSelections, selectedIds]);

  const diff = useMemo(() => {
    const allSubjects = subjectsData?.data ?? [];
    // If we only have selected items from server but subjectsData isn't loaded yet, try to map from selectionsData
    const getName = (id: string) => {
      const fromSubjects = allSubjects.find((s) => s.id === id);
      if (fromSubjects) return fromSubjects.name;
      const fromCurrent = selectionsData?.data?.find((s) => s.subject.id === id);
      return fromCurrent?.subject.name ?? "Unknown";
    };

    const added = selectedIds.filter((id) => !currentSelections.includes(id));
    const removed = currentSelections.filter((id) => !selectedIds.includes(id));
    const unchanged = currentSelections.filter((id) => selectedIds.includes(id));

    return {
      added: added.map(getName),
      removed: removed.map(getName),
      unchanged: unchanged.map(getName),
    };
  }, [selectedIds, currentSelections, subjectsData, selectionsData]);

  const handleSave = async () => {
    if (!currentYearId) return;
    try {
      await updateSelections({
        id: studentId,
        data: {
          academicYearId: currentYearId,
          subjectIds: selectedIds,
        },
      }).unwrap();
      toast.success("Subject selections updated");
      setShowConfirm(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCancel = () => {
    setSelectedIds([...currentSelections]);
  };

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">No academic year selected.</Alert>;
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-text-primary">Subject Selections</h3>
      </div>

      <p className="text-sm text-text-muted mb-6">
        Manage subjects for {studentName} in the {selectedYear.name} academic year.
      </p>

      {isLoadingSelections || (isLoadingSubjects && !isReadOnly) ? (
        <div className="flex justify-center p-8">
          <Spinner message="Loading subjects..." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <MultiSelect
              label="Selected Subjects"
              id="subject-selections"
              options={
                subjectsData?.data?.map((s) => ({ value: s.id, label: s.name })) ??
                selectionsData?.data?.map((s) => ({ value: s.subject.id, label: s.subject.name })) ??
                []
              }
              value={selectedIds}
              onChange={setSelectedIds}
              disabled={isReadOnly || isFetchingSelections}
              hint="These subjects determine which mark sheets are generated for this student."
            />
          </div>

          {!isReadOnly && hasChanges && (
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowConfirm(true)} isLoading={isUpdating}>
                Review Changes
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleSave}
          title="Confirm Subject Changes"
          description={
            <div className="mt-4 space-y-3 rounded-md bg-bg-subtle p-3 text-sm font-mono">
              {diff.added.length > 0 && (
                <div className="text-success">
                  <span className="font-semibold text-text-primary mr-2">Adding:</span>
                  {diff.added.join(", ")}
                </div>
              )}
              {diff.removed.length > 0 && (
                <div className="text-danger">
                  <span className="font-semibold text-text-primary mr-2">Removing:</span>
                  {diff.removed.join(", ")}
                </div>
              )}
              {diff.unchanged.length > 0 && (
                <div className="text-text-muted">
                  <span className="font-semibold text-text-primary mr-2">Unchanged:</span>
                  {diff.unchanged.join(", ")}
                </div>
              )}
              <p className="mt-4 text-sm text-text-muted">
                Warning: Removing a subject affects the student's mark sheets for the year.
                Re-run <b>Generate Mark Sheets</b> for the term's exam to reconcile.
              </p>
            </div>
          }
          confirmLabel="Save changes"
        />
      )}
    </Card>
  );
}
