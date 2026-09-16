import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal, Input, Button, Checkbox, Alert } from "@/shared/components/ui";
import { classSchema } from "../validation/classes.schemas";
import type { ClassInput } from "../validation/classes.schemas";
import { useCreateClassMutation, useUpdateClassMutation } from "../api/classesApi";
import type { Class } from "../types/classes.types";
import { useEffect } from "react";
import { getErrorMessage } from "@/types/api.types";
import { useAppSelector } from "@/app/hooks";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem?: Class | null;
}

export function ClassModal({ isOpen, onClose, classItem }: ClassModalProps) {
  const { currentYearId } = useAppSelector((state) => state.academicYear);
  const isEditing = !!classItem;
  
  const [createClass, { isLoading: isCreating, error: createError }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdating, error: updateError }] = useUpdateClassMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(classSchema) as any,
    defaultValues: {
      name: "",
      gradeLevel: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (classItem) {
        reset({
          name: classItem.name,
          gradeLevel: classItem.gradeLevel.level,
          isActive: classItem.isActive,
        });
      } else {
        reset({
          name: "",
          gradeLevel: undefined,
          isActive: true,
        });
      }
    }
  }, [isOpen, classItem, reset]);

  const onSubmit = async (data: ClassInput) => {
    if (!currentYearId) return;

    try {
      if (isEditing) {
        await updateClass({ 
          id: classItem.id, 
          body: { ...data, academicYearId: currentYearId } 
        }).unwrap();
        toast.success("Class updated successfully");
      } else {
        await createClass({ 
          ...data, 
          academicYearId: currentYearId 
        }).unwrap();
        toast.success("Class created successfully");
      }
      onClose();
    } catch {
      // Handled by form UI
    }
  };

  const error = createError || updateError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Class" : "Create Class"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {getErrorMessage(error)}
          </Alert>
        )}

        {!currentYearId && (
          <Alert variant="warning" title="Warning">
            No active academic year selected. You must select an academic year from the top bar before managing classes.
          </Alert>
        )}

        <Input
          label="Name"
          placeholder="e.g. 10A"
          {...register("name")}
          error={errors.name?.message}
          disabled={!currentYearId}
        />

        <Input
          label="Grade Level"
          type="number"
          placeholder="e.g. 10"
          {...register("gradeLevel")}
          error={errors.gradeLevel?.message}
          disabled={!currentYearId}
        />

        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="isActive" {...register("isActive")} disabled={!currentYearId} />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating} disabled={!currentYearId}>
            {isEditing ? "Save Changes" : "Create Class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
