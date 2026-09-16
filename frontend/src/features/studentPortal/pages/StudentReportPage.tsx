/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetStudentDashboardQuery, useGetStudentReportQuery, useGetStudentMeQuery } from "../api/studentPortalApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, ErrorState, SkeletonCard, Button } from "@/shared/components/ui";
import { formatMark } from "@/shared/utils/formatUtils";
import { formatDate } from "@/shared/utils/dateUtils";
import { Download, Printer, FileText } from "lucide-react";
import { useToast } from "@/shared/hooks/useToast";
import { tokenService } from "@/services/tokenService";

export default function StudentReportPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   const toast = useToast();
   
   const { data: me, isLoading: meLoading } = useGetStudentMeQuery();
   const { data: dashboard, isLoading: dashLoading } = useGetStudentDashboardQuery();

   const releasedTerms = useMemo(() => dashboard?.terms.filter((t: any) => t.marksReleased) ?? [], [dashboard]);
   const termIdParam = searchParams.get("termId");
   
   const selectedTermId = termIdParam ?? releasedTerms[0]?.id ?? "";

   useEffect(() => {
      if (!termIdParam && releasedTerms.length > 0) {
         setSearchParams(prev => {
            prev.set("termId", releasedTerms[0].id);
            return prev;
         });
      }
   }, [termIdParam, releasedTerms, setSearchParams]);

   const { 
      data: report, 
      isLoading: reportLoading, 
      error: reportError, 
      refetch: reportRefetch 
   } = useGetStudentReportQuery(
      { studentId: me?.id ?? "", termId: selectedTermId }, 
      { skip: !me?.id || !selectedTermId }
   );

   const [isDownloading, setIsDownloading] = useState(false);

   const handleDownloadPdf = async () => {
      if (!me?.id || !selectedTermId) return;
      setIsDownloading(true);
      try {
         const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/reports/student/${me.id}/term/${selectedTermId}?format=pdf`,
            {
               headers: {
                  Authorization: `Bearer ${tokenService.getToken()}`,
               },
            }
         );
         if (!response.ok) throw new Error("Failed to download PDF");
         
         const blob = await response.blob();
         
         // Try to get filename from Content-Disposition
         const disposition = response.headers.get("Content-Disposition");
         let filename = `ReportCard_${me.firstName}_${me.lastName}.pdf`;
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

   const handlePrint = () => {
      window.print();
   };

   const isLoading = dashLoading || meLoading;

   if (isLoading) {
      return (
         <PageContainer header={{ title: "Report Card" }}>
            <SkeletonCard />
         </PageContainer>
      );
   }

   return (
      <PageContainer
         header={{
            title: "Report Card",
            description: "View, print, and download your official term reports.",
         }}
         // Don't show the generic header during print
         className="print:p-0 print:m-0"
      >
         <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border shadow-sm print:hidden">
               <div>
                  <span className="text-sm font-medium text-text-muted mr-2">Term:</span>
                  <select 
                     className="bg-transparent text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
                     value={selectedTermId}
                     onChange={e => {
                        setSearchParams(prev => {
                           prev.set("termId", e.target.value);
                           return prev;
                        });
                     }}
                     disabled={releasedTerms.length === 0}
                  >
                     {releasedTerms.length === 0 && <option value="">No released terms</option>}
                     {releasedTerms.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                  </select>
               </div>
               
               {report && (
                  <div className="flex gap-3">
                     <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer size={16} className="mr-2" /> Print
                     </Button>
                     <Button size="sm" onClick={() => void handleDownloadPdf()} isLoading={isDownloading}>
                        <Download size={16} className="mr-2" /> Download PDF
                     </Button>
                  </div>
               )}
            </div>

            {releasedTerms.length === 0 ? (
               <Card className="print:hidden">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                     <div className="w-16 h-16 bg-primary-subtle rounded-full flex items-center justify-center text-primary mb-4">
                        <FileText size={32} />
                     </div>
                     <h3 className="text-xl font-semibold text-text-primary mb-2">
                        No Report Cards Available
                     </h3>
                     <p className="text-text-muted max-w-md">
                        Report cards will appear here once results are published by the school.
                     </p>
                  </CardContent>
               </Card>
            ) : (
               <>
                  {reportLoading && <SkeletonCard className="print:hidden" />}
                  {reportError && <ErrorState error={reportError} onRetry={reportRefetch} className="print:hidden" />}
                  
                  {report && (
                     <div className="bg-white text-black p-8 sm:p-12 shadow-sm border border-border max-w-4xl mx-auto print:border-none print:shadow-none print:max-w-none print:p-0">
                        {/* School Header */}
                        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                           <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Student Management System</h1>
                           <h2 className="text-xl font-semibold text-gray-700">Official Report Card</h2>
                        </div>

                        {/* Student Details Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                           <div>
                              <span className="text-gray-500 font-medium">Name: </span>
                              <span className="font-semibold text-gray-900">{report.student.firstName} {report.student.lastName}</span>
                           </div>
                           <div>
                              <span className="text-gray-500 font-medium">Academic Year: </span>
                              <span className="font-semibold text-gray-900">{report.academicYear.name}</span>
                           </div>
                           <div>
                              <span className="text-gray-500 font-medium">Admission No: </span>
                              <span className="font-semibold text-gray-900">{report.student.admissionNumber}</span>
                           </div>
                           <div>
                              <span className="text-gray-500 font-medium">Term: </span>
                              <span className="font-semibold text-gray-900">{report.term.name}</span>
                           </div>
                           <div>
                              <span className="text-gray-500 font-medium">Class: </span>
                              <span className="font-semibold text-gray-900">{report.student.currentClass?.name ?? '—'}</span>
                           </div>
                           {report.term.startDate && report.term.endDate && (
                              <div>
                                 <span className="text-gray-500 font-medium">Exam Period: </span>
                                 <span className="font-semibold text-gray-900">
                                    {formatDate(report.term.startDate)} – {formatDate(report.term.endDate)}
                                 </span>
                              </div>
                           )}
                        </div>

                        {/* Marks Table */}
                        <table className="w-full text-left border-collapse mb-8">
                           <thead>
                              <tr className="bg-gray-100 border-y-2 border-gray-300 print:bg-gray-100">
                                 <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs">Subject</th>
                                 <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs text-right w-24">Marks</th>
                                 <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs text-center w-24">Grade</th>
                                 <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs w-1/3">Remarks</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {report.marks.map((m: any) => (
                                 <tr key={m.id} className="print:break-inside-avoid">
                                    <td className="py-3 px-4">
                                       <span className="font-semibold text-gray-900">{m.subject.name}</span>
                                       {m.subject.code && <span className="text-gray-500 text-xs ml-2">({m.subject.code})</span>}
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">
                                       {formatMark(m.marksObtained, m.maxMarks, m.isAbsent)}
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                                       {m.grade ?? "—"}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                       {m.remarks ?? "—"}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>

                        {/* Summary Section */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-md border border-gray-200 print:bg-gray-50 print:break-inside-avoid">
                           <div className="text-center">
                              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Total Marks</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">
                                 {report.summary.totalMarks} <span className="text-sm font-medium text-gray-500">/ {report.summary.maxPossibleMarks}</span>
                              </p>
                           </div>
                           <div className="text-center">
                              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Average</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">
                                 {report.summary.average !== null ? `${report.summary.average.toFixed(1)}%` : "—"}
                              </p>
                           </div>
                           <div className="text-center">
                              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Overall Grade</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">{report.summary.overallGrade ?? "—"}</p>
                           </div>
                           <div className="text-center">
                              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Passed</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">
                                 {report.summary.subjectsPassed} <span className="text-sm font-medium text-gray-500">/ {report.summary.totalSubjects}</span>
                              </p>
                           </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-20 flex justify-between px-8 print:break-inside-avoid">
                           <div className="text-center w-48">
                              <div className="border-t border-gray-400 pt-2 text-sm font-semibold text-gray-700">Class Teacher</div>
                           </div>
                           <div className="text-center w-48">
                              <div className="border-t border-gray-400 pt-2 text-sm font-semibold text-gray-700">Principal</div>
                           </div>
                        </div>
                     </div>
                  )}
               </>
            )}
         </div>
      </PageContainer>
   );
}
