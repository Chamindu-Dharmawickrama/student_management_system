import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal, Input, Button, Checkbox, Alert } from "@/shared/components/ui";
import { gradeBandSchema } from "../validation/gradeBands.schemas";
import type { GradeBandInput } from "../validation/gradeBands.schemas";
import { useCreateGradeBandMutation, useUpdateGradeBandMutation } from "../api/gradeBandsApi";
import type { GradeBand } from "../types/gradeBands.types";
import { getErrorMessage } from "@/types/api.types";

interface GradeBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeBand?: GradeBand | null;
}

export function GradeBandModal({ isOpen, onClose, gradeBand }: GradeBandModalProps) {
  const isEditing = !!gradeBand;
  
  const [createGradeBand, { isLoading: isCreating, error: createError }] = useCreateGradeBandMutation();
  const [updateGradeBand, { isLoading: isUpdating, error: updateError }] = useUpdateGradeBandMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradeBandInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(gradeBandSchema) as any,
    defaultValues: {
      grade: "",
      minMark: undefined,
      maxMark: undefined,
      gradePoint: undefined,
      isPassing: true,
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (gradeBand) {
        reset({
          grade: gradeBand.grade,
          minMark: gradeBand.minMark,
          maxMark: gradeBand.maxMark,
          gradePoint: gradeBand.gradePoint || undefined,
          isPassing: gradeBand.isPassing,
          description: gradeBand.description || "",
        });
      } else {
        reset({
          grade: "",
          minMark: undefined,
          maxMark: undefined,
          gradePoint: undefined,
          isPassing: true,
          description: "",
        });
      }
    }
  }, [isOpen, gradeBand, reset]);

  const onSubmit = async (data: GradeBandInput) => {
    try {
      if (isEditing) {
        await updateGradeBand({ 
          id: gradeBand.id, 
          body: data 
        }).unwrap();
        toast.success("Grade band updated successfully");
      } else {
        await createGradeBand(data).unwrap();
        toast.success("Grade band created successfully");
      }
      onClose();
    } catch {
      // Handled by form UI
    }
  };

  const error = createError || updateError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Grade Band" : "Create Grade Band"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {getErrorMessage(error)}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Grade"
            placeholder="e.g. A+"
            {...register("grade")}
            error={errors.grade?.message}
          />
          <Input
            label="Grade Point"
            type="number"
            step="0.1"
            placeholder="e.g. 4.0 (Optional)"
            {...register("gradePoint")}
            error={errors.gradePoint?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Mark"
            type="number"
            placeholder="e.g. 80"
            {...register("minMark")}
            error={errors.minMark?.message}
          />
          <Input
            label="Max Mark"
            type="number"
            placeholder="e.g. 100"
            {...register("maxMark")}
            error={errors.maxMark?.message}
          />
        </div>

        <Input
          label="Description (Optional)"
          placeholder="e.g. Excellent"
          {...register("description")}
          error={errors.description?.message}
        />

        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="isPassing" {...register("isPassing")} />
          <label htmlFor="isPassing" className="text-sm font-medium text-slate-700">
            Counts as passing grade
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {isEditing ? "Save Changes" : "Create Grade Band"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
