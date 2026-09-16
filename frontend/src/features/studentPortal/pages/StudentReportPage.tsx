import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetStudentDashboardQuery, useGetStudentReportQuery, useGetStudentMeQuery } from "../api/studentPortalApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, ErrorState, SkeletonCard, Button, ReportCard } from "@/shared/components/ui";
import { Download, Printer, FileText } from "lucide-react";
import { useToast } from "@/shared/hooks/useToast";
import { tokenService } from "@/services/tokenService";

export default function StudentReportPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   const toast = useToast();
   
   const { data: me, isLoading: meLoading } = useGetStudentMeQuery();
   const { data: dashboard, isLoading: dashLoading } = useGetStudentDashboardQuery();

   const releasedTerms = useMemo(() => dashboard?.terms.filter(t => t.marksReleased) ?? [], [dashboard]);
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
                     {releasedTerms.map((t) => (
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
                  
                  {report && <ReportCard report={report} />}
               </>
            )}
         </div>
      </PageContainer>
   );
}
