import { forwardRef, type KeyboardEvent, type ChangeEvent } from "react";
import { Checkbox } from "@/shared/components/ui";

interface MarkCellProps {
    rowIndex: number;
    colIndex: 1 | 2; // 1 = marks, 2 = absent (remarks could be 3)
    value: string; // The mark value as a string for the input
    isAbsent: boolean;
    error?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onAbsentChange: (checked: boolean) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLButtonElement>, row: number, col: number) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>, row: number) => void;
}

export const MarkCell = forwardRef<HTMLInputElement, MarkCellProps>(
    ({ rowIndex, value, isAbsent, error, disabled, onChange, onAbsentChange, onKeyDown, onPaste }, ref) => {
        return (
            <div className="flex items-center gap-4">
                <div className="relative w-20">
                    <input
                        ref={ref}
                        id={`cell-${rowIndex}-1`}
                        type="text"
                        inputMode="numeric"
                        disabled={disabled || isAbsent}
                        value={isAbsent ? "" : value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, rowIndex, 1)}
                        onPaste={(e) => onPaste(e, rowIndex)}
                        className={`w-full h-10 px-3 rounded border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary ${
                            error 
                                ? "border-danger focus:border-danger focus:ring-danger" 
                                : "border-border focus:border-primary"
                        } disabled:bg-muted/10 disabled:text-text-muted transition-shadow`}
                        placeholder={isAbsent ? "—" : ""}
                    />
                </div>
                <div className="flex items-center">
                    <Checkbox
                        id={`cell-${rowIndex}-2`}
                        checked={isAbsent}
                        disabled={disabled}
                        onChange={(e) => onAbsentChange(e.target.checked)}
                        onKeyDown={(e) => onKeyDown(e as unknown as KeyboardEvent<HTMLButtonElement>, rowIndex, 2)}
                    />
                </div>
            </div>
        );
    }
);

MarkCell.displayName = "MarkCell";
