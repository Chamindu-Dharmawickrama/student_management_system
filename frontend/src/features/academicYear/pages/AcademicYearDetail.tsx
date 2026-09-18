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
} from "@/shared/components/ui";
import { 
  useGetAcademicYearByIdQuery, 
  useUpdateTermMutation 
} from "../api/academicYearApi";
import { updateTermSchema } from "../validation/academicYear.schemas";
import type { UpdateTermInput } from "../validation/academicYear.schemas";
import { toISODateString, fromISODateString, formatDateRange } from "@/shared/utils/dateUtils";
import type { Term, Exam } from "../types/academicYear.types";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage } from "@/types/api.types";
import { PageContainer } from "@/shared/components/layout";

function TermEditor({ 
  term, 
  academicYearId,
  isReadOnly
}: { 
  term: Term; 
  academicYearId: string;
  isReadOnly: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateTerm, { isLoading }] = useUpdateTermMutation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateTermInput>({
    resolver: zodResolver(updateTermSchema),
    defaultValues: {
      name: term.name,
      startDate: fromISODateString(term.startDate),
      endDate: fromISODateString(term.endDate),
    },
  });

  const onSubmit = async (data: UpdateTermInput) => {
    try {
      await updateTerm({
        academicYearId,
        termId: term.id,
        body: {
          name: data.name,
          startDate: data.startDate ? toISODateString(data.startDate) : undefined,
          endDate: data.endDate ? toISODateString(data.endDate) : undefined,
        }
      }).unwrap();
      toast.success("Term updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const exam = term.exam;

  const getExamStatus = (exam: Exam) => {
    if (!exam.endDate) return { label: "Not configured", variant: "warning" as const };
    if (exam.isEntryOpen) return { label: "Entry open", variant: "success" as const };
    
    const now = new Date();
    const start = exam.startDate ? new Date(exam.startDate) : null;
    const end = new Date(exam.endDate);

    if (start && start > now) return { label: "Upcoming", variant: "info" as const };
    if (start && start <= now && end >= now) return { label: "In progress", variant: "primary" as const };
    
    return { label: "Not configured", variant: "warning" as const };
  };

  const status = getExamStatus(exam);

  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          {isEditing ? (
            <form id={`form-${term.id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Term Name"
                {...register("name")}
                error={errors.name?.message}
              />
              <div className="flex gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  {...register("startDate")}
                  error={errors.startDate?.message}
                />
                <Input
                  label="End Date"
                  type="date"
                  {...register("endDate")}
                  error={errors.endDate?.message}
                />
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-900">{term.name} (Term {term.sequence})</h3>
              <p className="text-sm text-slate-500">
                {term.startDate && term.endDate 
                  ? formatDateRange(term.startDate, term.endDate) 
                  : "Dates not configured"}
              </p>
            </>
          )}
        </div>
        
        {!isReadOnly && (
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { reset(); setIsEditing(false); }}>Cancel</Button>
                <Button type="submit" size="sm" form={`form-${term.id}`} isLoading={isLoading}>Save</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Term</Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Exam Period</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm text-slate-600">
              {exam.startDate && exam.endDate 
                ? formatDateRange(exam.startDate, exam.endDate) 
                : "Not set"}
            </span>
            {!exam.endDate && (
              <span className="text-sm font-medium text-amber-600 ml-2">
                Teachers cannot enter marks until configured.
              </span>
            )}
          </div>
          <Link to={ROUTES.ADMIN_EXAM_DETAIL.replace(":id", exam.id)}>
            <Button variant="outline" size="sm">
              Manage Exam
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function AcademicYearDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: year, isLoading, isError, error, refetch } = useGetAcademicYearByIdQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return <Spinner fullPage message="Loading academic year details..." />;
  }

  if (isError || !year) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Editing is locked once this is no longer the current academic year —
  // independent of whichever year is selected in the header.
  const isReadOnly = !year.isCurrent;

  // Sort terms by sequence
  const sortedTerms = [...year.terms].sort((a, b) => a.sequence - b.sequence);

  return (
    <PageContainer>
      <PageHeader
        title={`${year.name} Details`}
        description={formatDateRange(year.startDate, year.endDate)}
      />

      <div className="max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Terms & Exams</h2>
          <div className="space-y-6">
            {sortedTerms.map((term, index) => (
              <div key={term.id} className="relative">
                {index !== sortedTerms.length - 1 && (
                  <div className="absolute top-10 bottom-[-24px] left-[27px] w-0.5 bg-slate-200 z-0"></div>
                )}
                <div className="flex gap-4 relative z-10">
                  <div className="flex flex-col items-center mt-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {term.sequence}
                    </div>
                  </div>
                  <div className="flex-1">
                    <TermEditor 
                      term={term} 
                      academicYearId={year.id} 
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}