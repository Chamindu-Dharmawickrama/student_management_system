import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal, Input, Button, Checkbox, Alert } from "@/shared/components/ui";
import { subjectSchema } from "../validation/subjects.schemas";
import type { SubjectInput } from "../validation/subjects.schemas";
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "../api/subjectsApi";
import type { Subject } from "../types/subjects.types";
import { getErrorMessage } from "@/types/api.types";

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: Subject | null;
}

export function SubjectModal({ isOpen, onClose, subject }: SubjectModalProps) {
  const isEditing = !!subject;
  const [createSubject, { isLoading: isCreating, error: createError }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdating, error: updateError }] = useUpdateSubjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(subjectSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        reset({
          name: subject.name,
          code: subject.code || "",
          isActive: subject.isActive,
        });
      } else {
        reset({
          name: "",
          code: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, subject, reset]);

  const onSubmit = async (data: SubjectInput) => {
    try {
      if (isEditing) {
        await updateSubject({ id: subject.id, body: data }).unwrap();
        toast.success("Subject updated successfully");
      } else {
        await createSubject(data).unwrap();
        toast.success("Subject created successfully");
      }
      onClose();
    } catch {
      // Error is handled by form error UI
    }
  };

  const error = createError || updateError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Subject" : "Create Subject"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {getErrorMessage(error)}
          </Alert>
        )}

        <Input
          label="Name"
          placeholder="e.g. Mathematics"
          {...register("name")}
          error={errors.name?.message}
        />

        <Input
          label="Code (Optional)"
          placeholder="e.g. MATH"
          {...register("code")}
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toUpperCase(); }}
          error={errors.code?.message}
          
        />

        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="isActive" {...register("isActive")} />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {isEditing ? "Save Changes" : "Create Subject"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
