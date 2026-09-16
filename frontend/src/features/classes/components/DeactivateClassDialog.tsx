import { useState } from "react";
import toast from "react-hot-toast";
import { Modal, Button, Spinner, Alert, Input } from "@/shared/components/ui";
import { useUpdateClassMutation, useGetClassByIdQuery } from "../api/classesApi";
import { getErrorMessage } from "@/types/api.types";
import type { Class } from "../types/classes.types";

interface DeactivateClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: Class | null;
}

export function DeactivateClassDialog({ isOpen, onClose, classItem }: DeactivateClassDialogProps) {
  const { data: classDetails, isLoading: isLoadingDetails } = useGetClassByIdQuery(
    classItem?.id as string, 
    { skip: !classItem || !isOpen }
  );
  
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();
  const [confirmPhrase, setConfirmPhrase] = useState("");

  if (!classItem) return null;

  const handleDeactivate = async () => {
    if (confirmPhrase !== classItem.name) return;

    try {
      await updateClass({
        id: classItem.id,
        body: { isActive: false }
      }).unwrap();
      
      toast.success(`${classItem.name} was successfully deactivated.`);
      setConfirmPhrase("");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    setConfirmPhrase("");
    onClose();
  };

  const isConfirmed = confirmPhrase === classItem.name;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Deactivate Class">
      {isLoadingDetails ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="danger" title="Cannot Deactivate">
            <h4 className="font-semibold mb-1">Cannot deactivate this class</h4>
            <p className="mb-2">Deactivating a class has immediate consequences:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>{classDetails?.teachingAssignments.length || 0} active teaching assignment(s)</strong> will end.
              </li>
              <li>
                The assigned class teacher ({classDetails?.classTeacher ? `${classDetails.classTeacher.firstName} ${classDetails.classTeacher.lastName}` : "none"}) will be unassigned.
              </li>
              <li>
                Affected teachers will <strong>immediately lose the ability to enter marks</strong> for this class.
              </li>
            </ul>
          </Alert>

          <p className="text-sm text-slate-700">
            Please type <strong>{classItem.name}</strong> to confirm you want to deactivate this class.
          </p>

          <Input
            label=""
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            placeholder={classItem.name}
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeactivate} 
              isLoading={isUpdating} 
              disabled={!isConfirmed}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              Deactivate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
