import { useState } from "react";
import { useGetStudentTermReportQuery } from "../api/reportsApi";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";
import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, Button, Input, Select, ReportCard, ErrorState, SkeletonCard } from "@/shared/components/ui";
import { Search, Printer, Download, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { tokenService } from "@/services/tokenService";

export default function ReportsPage() {
    // Reconciled source of truth (see MarkSheetListPage.tsx for why the raw
    // selectCurrentYearId selector must never be read directly).
    const { yearId: currentYearId } = useSelectedAcademicYear();
    const { data: yearData, isLoading: yearLoading } = useGetAcademicYearByIdQuery(currentYearId || "", {
        skip: !currentYearId
    });

    const [studentId, setStudentId] = useState("");
    const [termId, setTermId] = useState("");

    const [searchStudentId, setSearchStudentId] = useState("");
    const [searchTermId, setSearchTermId] = useState("");

    const { data: report, isLoading: isReportLoading, error: reportError, isFetching } = useGetStudentTermReportQuery(
        { studentId: searchStudentId, termId: searchTermId },
        { skip: !searchStudentId || !searchTermId }
    );

    const [isDownloading, setIsDownloading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId) {
            toast.error("Please enter a Student ID");
            return;
        }
        if (!termId) {
            toast.error("Please select a Term");
            return;
        }
        setSearchStudentId(studentId);
        setSearchTermId(termId);
    };

    const handleDownloadPdf = async () => {
        if (!searchStudentId || !searchTermId || !report) return;
        setIsDownloading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/reports/student/${searchStudentId}/term/${searchTermId}?format=pdf`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenService.getToken()}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to download PDF");
            
            const blob = await response.blob();
            
            const disposition = response.headers.get("Content-Disposition");
            let filename = `ReportCard_${report.student.firstName}_${report.student.lastName}.pdf`;
            if (disposition && disposition.indexOf("filename=") !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
   
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error("Could not download the PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <PageContainer 
            header={{ 
                title: "Student Reports", 
                description: "View and print report cards for any student." 
            }}
            className="print:p-0 print:m-0"
        >
            <Card className="mb-8 print:hidden">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Student ID (User ID)</label>
                            <Input 
                                placeholder="Enter Student ID"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Term</label>
                            <Select 
                                value={termId} 
                                onChange={(e) => setTermId(e.target.value)}
                                disabled={yearLoading || !yearData}
                                required
                                placeholder="Select a Term"
                                options={yearData?.terms.map(t => ({
                                    value: t.id,
                                    label: t.name
                                })) || []}
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <Button type="submit" variant="primary" className="w-full md:w-auto h-[42px]" disabled={isFetching}>
                                <Search className="w-4 h-4 mr-2" />
                                {isFetching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {(isReportLoading || isFetching) && <SkeletonCard className="print:hidden" />}
                
                {reportError && (
                    <ErrorState 
                        error={reportError} 
                        className="print:hidden" 
                    />
                )}

                {report && !isFetching && !reportError && (
                    <>
                        <div className="flex justify-end gap-3 mb-4 print:hidden">
                            <Button variant="outline" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print Report
                            </Button>
                            <Button variant="primary" onClick={handleDownloadPdf} isLoading={isDownloading}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                        <ReportCard report={report} />
                    </>
                )}

                {!report && !isReportLoading && !isFetching && !reportError && (
                    <Card className="print:hidden">
                        <CardContent className="p-16 text-center text-text-muted flex flex-col items-center">
                            <User className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-lg font-medium text-text-primary mb-2">Search for a Student</h3>
                            <p>Enter a student ID and select a term to view their report card.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageContainer>
    );
}
