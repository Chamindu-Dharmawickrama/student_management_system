import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentYearId } from "@/features/academicYear/slices/academicYearSlice";
import { useGetMarkSheetsQuery, useApproveMarkSheetMutation } from "../api/markSheetsApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, Button, StatusBadge, SkeletonCard, ErrorState, Input, Select, Pagination } from "@/shared/components/ui";
import { FileText, CheckCircle, Search, FilterX, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";
import type { MarkSheetDto } from "../types/markSheets.types";
import { toast } from "react-hot-toast";

export default function MarkSheetListPage() {
    const currentYearId = useAppSelector(selectCurrentYearId);
    const [searchParams, setSearchParams] = useSearchParams();

    // URL State
    const page = parseInt(searchParams.get("page") || "1", 10);
    const status = searchParams.get("status") || "SUBMITTED";
    const termId = searchParams.get("termId") || "";
    
    // We'll keep classId and subjectId as local text input state for simplicity, applied on "Search"
    const [classId, setClassId] = useState(searchParams.get("classId") || "");
    const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") || "");

    const { data, isLoading, error, refetch } = useGetMarkSheetsQuery(
        { 
            page, 
            limit: 20, 
            status: status !== "ALL" ? status : undefined, 
            termId: termId || undefined,
            classId: classId || undefined,
            subjectId: subjectId || undefined,
            academicYearId: currentYearId || undefined 
        },
        { skip: !currentYearId }
    );

    const [approveMarkSheet, { isLoading: isApproving }] = useApproveMarkSheetMutation();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

    const handleFilterChange = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value && value !== "ALL") {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        next.set("page", "1"); // Reset to page 1 on filter
        setSearchParams(next);
        setSelectedIds(new Set()); // Clear selection on filter change
    };

    const handleApplyTextFilters = () => {
        const next = new URLSearchParams(searchParams);
        if (classId) next.set("classId", classId);
        else next.delete("classId");
        
        if (subjectId) next.set("subjectId", subjectId);
        else next.delete("subjectId");
        
        next.set("page", "1");
        setSearchParams(next);
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
        setClassId("");
        setSubjectId("");
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAllSelection = () => {
        if (!data) return;
        const submittableSheets = data.items.filter(m => m.status === "SUBMITTED");
        if (selectedIds.size === submittableSheets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(submittableSheets.map(m => m.id)));
        }
    };

    const toggleTermExpansion = (termName: string) => {
        const next = new Set(expandedTerms);
        if (next.has(termName)) next.delete(termName);
        else next.add(termName);
        setExpandedTerms(next);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        
        if (!window.confirm(`Are you sure you want to approve ${selectedIds.size} mark sheets?`)) {
            return;
        }

        const ids = Array.from(selectedIds);
        let successCount = 0;
        
        // Sequential requests as requested by prompt 08
        const toastId = toast.loading(`Approving 0/${ids.length}...`);
        
        for (let i = 0; i < ids.length; i++) {
            try {
                await approveMarkSheet(ids[i]).unwrap();
                successCount++;
                toast.loading(`Approving ${successCount}/${ids.length}...`, { id: toastId });
            } catch (err) {
                console.error("Failed to approve marksheet", ids[i], err);
                toast.error(`Failed to approve marksheet ${ids[i]}`);
                // Continue with others
            }
        }
        
        toast.success(`Successfully approved ${successCount} out of ${ids.length} mark sheets.`, { id: toastId });
        setSelectedIds(new Set());
    };

    const groupedByTerm = useMemo(() => {
        if (!data) return {};
        const groups: Record<string, MarkSheetDto[]> = {};
        for (const item of data.items) {
            const termName = item.exam.term.name;
            if (!groups[termName]) groups[termName] = [];
            groups[termName].push(item);
        }
        return groups;
    }, [data]);

    if (isLoading) {
        return (
            <PageContainer header={{ title: "Mark Sheets" }}>
                <SkeletonCard />
            </PageContainer>
        );
    }

    if (error) {
        return (
            <PageContainer header={{ title: "Mark Sheets" }}>
                <ErrorState error={error} onRetry={refetch} />
            </PageContainer>
        );
    }

    const submittableSheetsCount = data?.items.filter(m => m.status === "SUBMITTED").length || 0;

    return (
        <PageContainer header={{ 
            title: "Mark Sheets", 
            description: "Review and approve mark sheets submitted by teachers." 
        }}>
            
            <Card className="mb-6">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-grow w-full">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
                            <Select
                                value={status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full"
                                options={[
                                    { value: "ALL", label: "All Statuses" },
                                    { value: "SUBMITTED", label: "Awaiting Approval" },
                                    { value: "DRAFT", label: "Draft" },
                                    { value: "APPROVED", label: "Approved" },
                                    { value: "REJECTED", label: "Rejected" },
                                    { value: "LOCKED", label: "Locked" },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">Class ID</label>
                            <Input
                                placeholder="Filter by Class ID"
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyTextFilters()}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">Subject ID</label>
                            <Input
                                placeholder="Filter by Subject ID"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyTextFilters()}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button variant="secondary" onClick={handleApplyTextFilters} className="w-full">
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                            <Button variant="secondary" onClick={clearFilters} aria-label="Clear Filters" title="Clear Filters">
                                <FilterX className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedIds.size > 0 && (
                <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center text-teal-800">
                        <CheckCircle className="w-5 h-5 mr-3 text-teal-600" />
                        <span className="font-medium">{selectedIds.size} mark sheet{selectedIds.size > 1 ? 's' : ''} selected</span>
                    </div>
                    <Button 
                        variant="primary" 
                        onClick={handleBulkApprove}
                        disabled={isApproving}
                    >
                        {isApproving ? "Approving..." : "Approve Selected"}
                    </Button>
                </div>
            )}

            {!data || data.items.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-text-muted">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No Mark Sheets Found</h3>
                        <p>No mark sheets match your current filters.</p>
                        <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByTerm).map(([termName, items]) => {
                        const isExpanded = !expandedTerms.has(termName);
                        return (
                            <Card key={termName} className="overflow-hidden border border-border">
                                <div 
                                    className="bg-surface-alt p-4 flex items-center justify-between cursor-pointer select-none"
                                    onClick={() => toggleTermExpansion(termName)}
                                >
                                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                        {termName} <span className="text-sm font-normal text-text-muted tabular-nums ml-2">({items.length})</span>
                                    </h3>
                                </div>
                                
                                {isExpanded && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-surface border-b border-border text-text-muted">
                                                    <th className="p-4 w-12">
                                                        {status === "SUBMITTED" && submittableSheetsCount > 0 && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); toggleAllSelection(); }}
                                                                className="text-text-muted hover:text-primary transition-colors focus-ring rounded"
                                                            >
                                                                {selectedIds.size > 0 && selectedIds.size === submittableSheetsCount ? (
                                                                    <CheckSquare className="w-5 h-5" />
                                                                ) : (
                                                                    <Square className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </th>
                                                    <th className="p-4 font-medium">Exam</th>
                                                    <th className="p-4 font-medium">Class</th>
                                                    <th className="p-4 font-medium">Subject</th>
                                                    <th className="p-4 font-medium">Teacher</th>
                                                    <th className="p-4 font-medium">Status</th>
                                                    <th className="p-4 font-medium">Completion</th>
                                                    <th className="p-4 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {items.map((item) => {
                                                    const isSelected = selectedIds.has(item.id);
                                                    const canSelect = item.status === "SUBMITTED";
                                                    const percent = item.stats.totalStudents > 0 
                                                        ? (item.stats.marksEntered / item.stats.totalStudents) * 100 
                                                        : 0;

                                                    return (
                                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-teal-50/30' : ''}`}>
                                                            <td className="p-4">
                                                                {canSelect && (
                                                                    <button 
                                                                        onClick={() => toggleSelection(item.id)}
                                                                        className={`transition-colors focus-ring rounded ${isSelected ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}
                                                                    >
                                                                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="p-4 font-medium text-text-primary">{item.exam.name}</td>
                                                            <td className="p-4 text-text-secondary">{item.class.name}</td>
                                                            <td className="p-4 text-text-secondary">{item.subject.name}</td>
                                                            <td className="p-4 text-text-secondary">{item.teacher.firstName} {item.teacher.lastName}</td>
                                                            <td className="p-4">
                                                                <StatusBadge kind="markSheet" status={item.status} />
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                                                                            style={{ width: `${percent}%` }} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-text-muted w-12 tabular-nums">
                                                                        {item.stats.marksEntered}/{item.stats.totalStudents}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <Link to={`/admin/marksheets/${item.id}`}>
                                                                    <Button variant="secondary" className="px-3 py-1.5 h-auto text-sm">
                                                                        Review
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {data.meta && data.meta.totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <Pagination
                                meta={data.meta}
                                onPageChange={(p) => handleFilterChange("page", p.toString())}
                            />
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}
