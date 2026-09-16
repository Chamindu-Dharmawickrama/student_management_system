import { useState, useEffect, useRef, useCallback } from "react";
import { MarkCell } from "./MarkCell";
import { Button } from "@/shared/components/ui";
import { Save, X, AlertCircle } from "lucide-react";
import type { MarkDTO, BulkMarksPayload } from "../types/teacherPortal.types";
import type { GradeBand } from "@/features/gradeBands/types/gradeBands.types";
import { gradebookEntrySchema } from "../validation/teacherPortal.schemas";

interface GradebookGridProps {
    examId: string;
    marks: MarkDTO[];
    gradeBands: GradeBand[];
    isEditable: boolean;
    onSave: (payload: BulkMarksPayload) => Promise<boolean>;
    isSaving: boolean;
}

export function GradebookGrid({ examId, marks, gradeBands, isEditable, onSave, isSaving }: GradebookGridProps) {
    const [localMarks, setLocalMarks] = useState<Record<string, { marksObtained: string; isAbsent: boolean; remarks: string }>>(() => {
        const initial: Record<string, { marksObtained: string; isAbsent: boolean; remarks: string }> = {};
        marks.forEach(m => {
            initial[m.id] = {
                marksObtained: m.marksObtained !== null ? String(m.marksObtained) : "",
                isAbsent: m.isAbsent,
                remarks: m.remarks || ""
            };
        });
        return initial;
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Sync when marks array changes (e.g. after a save or refetch)
    const prevMarksRef = useRef(marks);
    if (prevMarksRef.current !== marks) {
        prevMarksRef.current = marks;
        const initial: Record<string, { marksObtained: string; isAbsent: boolean; remarks: string }> = {};
        marks.forEach(m => {
            initial[m.id] = {
                marksObtained: m.marksObtained !== null ? String(m.marksObtained) : "",
                isAbsent: m.isAbsent,
                remarks: m.remarks || ""
            };
        });
        setLocalMarks(initial);
        setErrors({});
    }

    const computeGrade = (marksObtained: string) => {
        if (!marksObtained) return "—";
        const val = Number(marksObtained);
        if (isNaN(val)) return "—";
        const band = gradeBands.find(b => val >= b.minMark && val <= b.maxMark);
        return band ? band.grade : "—";
    };

    const isDirty = useCallback((markId: string) => {
        const original = marks.find(m => m.id === markId);
        if (!original) return false;
        const current = localMarks[markId];
        if (!current) return false;

        const origMarks = original.marksObtained !== null ? String(original.marksObtained) : "";
        const origRemarks = original.remarks || "";

        return current.marksObtained !== origMarks || current.isAbsent !== original.isAbsent || current.remarks !== origRemarks;
    }, [marks, localMarks]);

    const validateCell = useCallback((markId: string, data: { marksObtained: string; isAbsent: boolean; remarks: string }) => {
        const mark = marks.find(m => m.id === markId);
        if (!mark) return true;

        const result = gradebookEntrySchema.safeParse({
            studentId: mark.student.id,
            isAbsent: data.isAbsent,
            marksObtained: data.marksObtained === "" ? undefined : Number(data.marksObtained),
            remarks: data.remarks
        });

        if (!result.success) {
            const err = result.error.issues[0]?.message || "Invalid";
            setErrors(prev => ({ ...prev, [markId]: err }));
            return false;
        } else {
            setErrors(prev => {
                const next = { ...prev };
                delete next[markId];
                return next;
            });
            return true;
        }
    }, [marks]);

    const handleChange = (markId: string, field: "marksObtained" | "isAbsent" | "remarks", value: string | boolean) => {
        setLocalMarks(prev => {
            const current = prev[markId] || { marksObtained: "", isAbsent: false, remarks: "" };
            const next = { ...current, [field]: value };
            
            // if marked absent, clear marks
            if (field === "isAbsent" && value === true) {
                next.marksObtained = "";
            }

            validateCell(markId, next);
            return { ...prev, [markId]: next };
        });
    };

    const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
        if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            const nextRowId = marks[rowIndex + 1]?.id;
            if (nextRowId) {
                cellRefs.current[`${nextRowId}-${colIndex}`]?.focus();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prevRowId = marks[rowIndex - 1]?.id;
            if (prevRowId) {
                cellRefs.current[`${prevRowId}-${colIndex}`]?.focus();
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            const markId = marks[rowIndex].id;
            const original = marks.find(m => m.id === markId);
            if (original) {
                const revertData = {
                    marksObtained: original.marksObtained !== null ? String(original.marksObtained) : "",
                    isAbsent: original.isAbsent,
                    remarks: original.remarks || ""
                };
                setLocalMarks(prev => ({ ...prev, [markId]: revertData }));
                setErrors(prev => { const n = {...prev}; delete n[markId]; return n; });
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent, startRowIndex: number) => {
        e.preventDefault();
        if (!isEditable) return;
        const text = e.clipboardData.getData("text");
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== "");
        
        const newMarks = { ...localMarks };
        const newErrors = { ...errors };

        rows.forEach((rowVal, i) => {
            const mark = marks[startRowIndex + i];
            if (mark) {
                const val = rowVal.trim();
                const next = { ...newMarks[mark.id], marksObtained: val };
                
                const result = gradebookEntrySchema.safeParse({
                    studentId: mark.student.id,
                    isAbsent: next.isAbsent,
                    marksObtained: next.marksObtained === "" ? undefined : Number(next.marksObtained),
                    remarks: next.remarks
                });

                if (!result.success) {
                    newErrors[mark.id] = result.error.issues[0]?.message || "Invalid";
                } else {
                    delete newErrors[mark.id];
                }

                newMarks[mark.id] = next;
            }
        });

        setLocalMarks(newMarks);
        setErrors(newErrors);
    };

    const handleSave = useCallback(() => {
        if (!isEditable || isSaving) return;

        // Validate all dirty cells
        let hasErrors = false;
        const changes: BulkMarksPayload["entries"] = [];

        for (const mark of marks) {
            if (isDirty(mark.id)) {
                const current = localMarks[mark.id];
                const isValid = validateCell(mark.id, current);
                if (!isValid) hasErrors = true;
                else {
                    changes.push({
                        studentId: mark.student.id,
                        isAbsent: current.isAbsent,
                        marksObtained: current.marksObtained === "" ? undefined : Number(current.marksObtained),
                        remarks: current.remarks
                    });
                }
            }
        }

        if (hasErrors || changes.length === 0) return;

        onSave({ examId, entries: changes });
    }, [isEditable, isSaving, marks, localMarks, isDirty, validateCell, onSave, examId]);

    // Keyboard save shortcut (Ctrl+S or Cmd+S)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [handleSave]);

    const dirtyCount = marks.filter(m => isDirty(m.id)).length;
    const errorCount = Object.keys(errors).length;
    const enteredCount = marks.filter(m => {
        const current = localMarks[m.id];
        return current && (current.isAbsent || current.marksObtained !== "");
    }).length;

    return (
        <div className="flex flex-col h-full relative">
            <div className="overflow-x-auto pb-24">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-border bg-surface text-sm font-medium text-text-muted">
                            <th className="p-3 pl-4 sticky left-0 z-10 bg-surface">Admission No.</th>
                            <th className="p-3 sticky left-[120px] z-10 bg-surface min-w-[200px]">Student Name</th>
                            <th className="p-3 w-32">Marks</th>
                            <th className="p-3 w-24">Absent</th>
                            <th className="p-3 w-24">Grade</th>
                            <th className="p-3 min-w-[200px]">Remarks</th>
                            <th className="p-3 w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {marks.map((mark, i) => {
                            const current = localMarks[mark.id] || { marksObtained: "", isAbsent: false, remarks: "" };
                            const dirty = isDirty(mark.id);
                            const err = errors[mark.id];
                            
                            return (
                                <tr key={mark.id} className="hover:bg-primary-subtle/10">
                                    <td className="p-3 pl-4 sticky left-0 z-10 bg-app-bg text-text-muted tabular-nums">
                                        {mark.student.admissionNumber}
                                    </td>
                                    <td className="p-3 sticky left-[120px] z-10 bg-app-bg font-medium text-text-primary shadow-[1px_0_0_var(--color-border)]">
                                        {mark.student.firstName} {mark.student.lastName}
                                    </td>
                                    <td className="p-3">
                                        <MarkCell
                                            ref={(el) => { cellRefs.current[`${mark.id}-1`] = el; }}
                                            rowIndex={i}
                                            colIndex={1}
                                            value={current.marksObtained}
                                            isAbsent={current.isAbsent}
                                            error={err}
                                            disabled={!isEditable || isSaving}
                                            onChange={(val) => handleChange(mark.id, "marksObtained", val)}
                                            onAbsentChange={(val) => handleChange(mark.id, "isAbsent", val)}
                                            onKeyDown={handleKeyDown}
                                            onPaste={handlePaste}
                                        />
                                    </td>
                                    <td className="p-3">
                                        {/* Absent checkbox is part of MarkCell but we could also split them. Here it's inside MarkCell for layout, but let's visually show it. */}
                                    </td>
                                    <td className="p-3 font-medium text-text-primary">
                                        {current.isAbsent ? "—" : computeGrade(current.marksObtained)}
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={current.remarks}
                                            onChange={(e) => handleChange(mark.id, "remarks", e.target.value)}
                                            disabled={!isEditable || isSaving}
                                            className="w-full h-8 px-2 text-sm rounded border border-border bg-surface text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
                                            placeholder="Optional"
                                        />
                                    </td>
                                    <td className="p-3">
                                        {err ? (
                                            <span className="text-xs text-danger flex items-center gap-1 font-medium" title={err}>
                                                <AlertCircle className="w-3 h-3" /> Error
                                            </span>
                                        ) : dirty ? (
                                            <span className="text-xs text-warning font-medium">Modified</span>
                                        ) : (
                                            <span className="text-xs text-text-muted">Saved</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Sticky footer for saving */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 p-4 bg-surface border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-text-muted font-medium">
                    <span>{enteredCount} of {marks.length} entered</span>
                    {dirtyCount > 0 && <span className="text-warning">{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>}
                    {errorCount > 0 && <span className="text-danger flex items-center gap-1"><AlertCircle className="w-4 h-4"/> {errorCount} error{errorCount > 1 ? 's' : ''}</span>}
                </div>
                <div className="flex gap-3">
                    {dirtyCount > 0 && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                // Revert all dirty changes
                                const reverted = { ...localMarks };
                                marks.forEach(m => {
                                    reverted[m.id] = {
                                        marksObtained: m.marksObtained !== null ? String(m.marksObtained) : "",
                                        isAbsent: m.isAbsent,
                                        remarks: m.remarks || ""
                                    };
                                });
                                setLocalMarks(reverted);
                                setErrors({});
                            }}
                            disabled={isSaving}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Discard
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        disabled={!isEditable || dirtyCount === 0 || errorCount > 0 || isSaving}
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save All
                    </Button>
                </div>
            </div>
        </div>
    );
}
