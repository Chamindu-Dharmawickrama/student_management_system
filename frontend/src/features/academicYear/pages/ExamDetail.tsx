import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { 
  PageHeader, 
  Button, 
  Badge,
  ErrorState,
  Spinner,
  Card,
  Input,
  Alert,
  ConfirmDialog,
  StatCard
} from "@/shared/components/ui";
import { 
  useGetExamByIdQuery, 
  useUpdateExamMutation,
  useGenerateMarksheetsMutation
} from "../api/academicYearApi";
import { updateExamSchema, type UpdateExamInput } from "../validation/academicYear.schemas";
import { toISODateString, fromISODateString, formatDateRange } from "@/shared/utils/dateUtils";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage } from "@/types/api.types";
import { PageContainer } from "@/shared/components/layout";

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: exam, isLoading, isError, error, refetch } = useGetExamByIdQuery(id!, {
    skip: !id,
  });

  const [updateExam, { isLoading: isUpdating }] = useUpdateExamMutation();
  const [generateMarksheets, { isLoading: isGenerating }] = useGenerateMarksheetsMutation();

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reconciliationMessage, setReconciliationMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateExamInput>({
    resolver: zodResolver(updateExamSchema),
    values: {
      startDate: fromISODateString(exam?.startDate),
      endDate: fromISODateString(exam?.endDate),
    },
  });

  if (isLoading) {
    return <Spinner fullPage message="Loading exam details..." />;
  }

  if (isError || !exam) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Editing is locked once this exam's own academic year is no longer the
  // current one — independent of whichever year is selected in the header.
  const isReadOnly = !exam.academicYear.isCurrent;

  const term = exam.term;
  const isTermConfigured = term.startDate && term.endDate;

  const getExamStatus = () => {
    if (!exam.endDate) return { label: "Not configured", variant: "warning" as const };
    if (exam.isEntryOpen) return { label: "Entry open", variant: "success" as const };
    
    const now = new Date();
    const start = exam.startDate ? new Date(exam.startDate) : null;
    const end = new Date(exam.endDate);

    if (start && start > now) return { label: "Upcoming", variant: "info" as const };
    if (start && start <= now && end >= now) return { label: "In progress", variant: "primary" as const };
    
    return { label: "Not configured", variant: "warning" as const };
  };

  const status = getExamStatus();

  const onSubmit = async (data: UpdateExamInput) => {
    try {
      await updateExam({
        id: exam.id,
        body: {
          startDate: toISODateString(data.startDate),
          endDate: toISODateString(data.endDate),
        }
      }).unwrap();
      toast.success("Exam period updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleGenerateMarksheets = async () => {
    try {
      const res = await generateMarksheets(exam.id).unwrap();
      setReconciliationMessage(res.message);
      toast.success("Mark sheets generated successfully");
      setIsGenerateDialogOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsGenerateDialogOpen(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${exam.name} Details`}
        description={formatDateRange(exam.startDate, exam.endDate)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Exam Period Configuration</h3>
            
            <Alert variant="info" title="Info" className="mb-6">
              Mark entry unlocks automatically once this period ends. There is no separate open/close switch.
            </Alert>

            {!isTermConfigured ? (
              <Alert variant="warning" title="Incomplete Results">
                Marks have been recorded for some students, but the exam period is still active or results are incomplete.
                <div className="mt-2">
                  <Link to={ROUTES.ADMIN_ACADEMIC_YEAR_DETAIL.replace(":id", exam.academicYear.id)}>
                    <Button variant="outline" size="sm">Go to Term Configuration</Button>
                  </Link>
                </div>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-4">
                  <p className="text-sm font-medium text-slate-700">Parent Term Range Context</p>
                  <p className="text-sm text-slate-500">
                    The exam period must fall entirely within its term's date range: 
                    <span className="font-semibold text-slate-700 ml-1">
                      {formatDateRange(term.startDate, term.endDate)}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    min={fromISODateString(term.startDate)}
                    max={fromISODateString(term.endDate)}
                    disabled={isReadOnly}
                    {...register("startDate")}
                    error={errors.startDate?.message}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    min={fromISODateString(term.startDate)}
                    max={fromISODateString(term.endDate)}
                    disabled={isReadOnly}
                    {...register("endDate")}
                    error={errors.endDate?.message}
                  />
                </div>
                
                {!isReadOnly && (
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isUpdating}>Save Exam Period</Button>
                  </div>
                )}
              </form>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Mark Sheets</h3>
                <p className="text-sm text-slate-500">
                  Generate mark sheets for all active students based on their subject selections.
                </p>
              </div>
              <Button 
                onClick={() => setIsGenerateDialogOpen(true)}
                disabled={isReadOnly}
              >
                Generate Mark Sheets
              </Button>
            </div>
            
            {reconciliationMessage && (
              <Alert variant="info" title="No Results">
                No marks have been recorded for this exam yet.
              </Alert>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Entry Status</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Period</p>
                <p className="font-medium text-slate-900">
                  {exam.startDate && exam.endDate 
                    ? formatDateRange(exam.startDate, exam.endDate) 
                    : "Not set"}
                </p>
              </div>
            </div>
          </Card>

          <StatCard 
            label="Total Marksheets"
            value={exam.markSheetCount.toString()}
            icon={undefined}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        title="Generate Marksheets"
        description="This will lock the results for this exam and generate marksheets for all students."
        confirmLabel="Generate"
        onConfirm={handleGenerateMarksheets}
        isLoading={isGenerating}
      />
    </PageContainer>
  );
}