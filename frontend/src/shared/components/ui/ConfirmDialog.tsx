import { useId, useState, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  /** When set, the confirm button stays disabled until the user types this exact string. */
  confirmPhrase?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  confirmPhrase,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const inputId = useId();

  // Reset the typed confirmation phrase whenever the dialog transitions to
  // open, adjusting state during render instead of in an effect.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTyped('');
  }

  const phraseSatisfied = !confirmPhrase || typed === confirmPhrase;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={!phraseSatisfied}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-text-secondary">
        <div>{description}</div>
        {confirmPhrase && (
          <Input
            id={inputId}
            label={`Type "${confirmPhrase}" to confirm`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        )}
      </div>
    </Modal>
  );
}
