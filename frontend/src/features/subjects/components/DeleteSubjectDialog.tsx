import toast from "react-hot-toast";
import { ConfirmDialog, Spinner, Alert } from "@/shared/components/ui";
import { useDeleteSubjectMutation, useGetSubjectByIdQuery } from "../api/subjectsApi";
import { getErrorMessage } from "@/types/api.types";
import type { Subject } from "../types/subjects.types";

interface DeleteSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
}

export function DeleteSubjectDialog({ isOpen, onClose, subject }: DeleteSubjectDialogProps) {
  const { data: subjectDetails, isLoading: isLoadingDetails } = useGetSubjectByIdQuery(
    subject?.id as string, 
    { skip: !subject || !isOpen }
  );
  
  const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation();

  if (!subject) return null;

  const handleDelete = async () => {
    try {
      const result = await deleteSubject(subject.id).unwrap();
      
      // If the backend deactivated it instead of deleting, report it honestly
      if (result.data?.deactivated) {
        toast.success(`${subject.name} was deactivated due to existing dependencies.`);
      } else {
        toast.success(`${subject.name} was deleted successfully.`);
      }
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      onClose();
    }
  };

  const renderMessage = () => {
    if (isLoadingDetails) {
      return (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      );
    }

    if (!subjectDetails) {
      return <p>Are you sure you want to delete {subject.name}?</p>;
    }

    const { teacherCount, teachingAssignmentCount } = subjectDetails;
    const hasDependencies = teacherCount > 0 || teachingAssignmentCount > 0;

    return (
      <div className="space-y-4">
        <p>Are you sure you want to remove <strong>{subject.name}</strong>?</p>
        
        {hasDependencies && (
          <Alert variant="warning" title="Warning">
            This subject has dependencies:
            <ul className="list-disc pl-5 mt-2">
              {teacherCount > 0 && <li>{teacherCount} teacher{teacherCount > 1 ? 's are' : ' is'} assigned this subject</li>}
              {teachingAssignmentCount > 0 && <li>{teachingAssignmentCount} active teaching assignment{teachingAssignmentCount > 1 ? 's' : ''}</li>}
            </ul>
            <p className="mt-2 text-sm">Because of these dependencies, the subject will be deactivated instead of permanently deleted to preserve historical data.</p>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Subject"
      description={renderMessage()}
      confirmLabel="Delete"
      onConfirm={handleDelete}
      isLoading={isDeleting || isLoadingDetails}
      variant="danger"
    />
  );
}
