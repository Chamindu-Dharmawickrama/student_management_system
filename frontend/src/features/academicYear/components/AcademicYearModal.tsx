import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Modal, 
  Input, 
  Button, 
  Checkbox, 
  Alert 
} from "@/shared/components/ui";
import { createAcademicYearSchema } from "../validation/academicYear.schemas";
import type { CreateAcademicYearInput } from "../validation/academicYear.schemas";
import { useCreateAcademicYearMutation } from "../api/academicYearApi";
import { getErrorMessage } from "@/types/api.types";
import toast from "react-hot-toast";
import { toISODateString } from "@/shared/utils/dateUtils";

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AcademicYearModal({ isOpen, onClose }: AcademicYearModalProps) {
  const [createYear, { isLoading, error }] = useCreateAcademicYearMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearInput>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    },
  });

  const onSubmit = async (data: CreateAcademicYearInput) => {
    try {
      await createYear({
        ...data,
        startDate: toISODateString(data.startDate),
        endDate: toISODateString(data.endDate),
      }).unwrap();
      toast.success("Academic year created successfully");
      reset();
      onClose();
    } catch {
      // Error handled by form or error state below
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Academic Year">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {getErrorMessage(error)}
          </Alert>
        )}
        
        <Alert variant="info" title="Info" className="mb-4">
          Creating an academic year automatically provisions 3 terms, each with exactly one exam. Term dates and exam periods can be configured afterwards.
        </Alert>

        <Input
          label="Name"
          placeholder="e.g. 2026-2027"
          {...register("name")}
          error={errors.name?.message}
        />
        
        <div className="grid grid-cols-2 gap-4">
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

        <div className="flex items-center gap-2 pt-2">
          <Checkbox 
            id="isCurrent"
            {...register("isCurrent")}
          />
          <label htmlFor="isCurrent" className="text-sm font-medium text-slate-700">
            Mark as current year
          </label>
        </div>
        
        {/* We would need a ConfirmDialog if isCurrent is true and there is already a current year, but for now we just let the backend handle or surface 409 if needed, or just follow the prompt: 'isCurrent needs an explicit warning: marking a year current unsets the previous current year' - maybe we can just put a helper text */}
        <p className="text-xs text-slate-500 mt-1 pl-6">
          Warning: Marking this year as current will unset the previous current year.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Year
          </Button>
        </div>
      </form>
    </Modal>
  );
}
