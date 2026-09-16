/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetStudentDashboardQuery, useGetStudentMarksQuery } from "../api/studentPortalApi";
import { PageContainer } from "@/shared/components/layout";
import { Badge, Card, CardContent, ErrorState, SkeletonCard } from "@/shared/components/ui";
import { formatMark } from "@/shared/utils/formatUtils";
import { formatDate } from "@/shared/utils/dateUtils";
import { Info } from "lucide-react";

export default function StudentMarksPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   
   const { data: dashboard, isLoading: dashLoading, error: dashError, refetch: dashRefetch } = useGetStudentDashboardQuery();

   // Academic Year Selector - default to current
   const dashboardYearId = dashboard?.academicYear?.id;
   const [selectedYearId, setSelectedYearId] = useState<string>("");
   
   const activeYearId = selectedYearId || dashboardYearId || "";

   // Determine selected term, default to Term 1 of that year if any
   const terms = useMemo(() => dashboard?.terms ?? [], [dashboard]);
   const termIdParam = searchParams.get("termId");
   
   // Sync term with URL
   const selectedTermId = termIdParam ?? terms[0]?.id ?? "";
   
   const handleTermChange = (id: string) => {
      setSearchParams(prev => {
         prev.set("termId", id);
         return prev;
      });
   };

   const { 
      data: marksData, 
      isLoading: marksLoading, 
      error: marksError, 
      refetch: marksRefetch 
   } = useGetStudentMarksQuery(
      { termId: selectedTermId, limit: 100 }, 
      { skip: !selectedTermId }
   );

   const isLoading = dashLoading;
   const error = dashError;

   const selectedTerm = terms.find((t: any) => t.id === selectedTermId);
   const marks = useMemo(() => marksData?.data ?? [], [marksData]);

   const summary = useMemo(() => {
      if (!selectedTerm?.marksReleased) return null;
      
      const nonAbsentMarks = marks.filter((m: any) => !m.isAbsent && m.marksObtained !== null);
      const totalMarksObtained = nonAbsentMarks.reduce((sum: number, m: any) => sum + (m.marksObtained ?? 0), 0);
      const totalMaxMarks = nonAbsentMarks.reduce((sum: number, m: any) => sum + m.maxMarks, 0);
      const subjectsGraded = nonAbsentMarks.length;
      const average = subjectsGraded > 0 ? totalMarksObtained / subjectsGraded : null;
      return {
         subjectsGraded: marks.length,
         average,
         totalMarks: totalMarksObtained,
         maxPossible: totalMaxMarks,
      };
   }, [selectedTerm, marks]);

   return (
      <PageContainer
         header={{
            title: "My Marks",
            description: "View your academic performance across terms.",
         }}
      >
         {isLoading && <SkeletonCard />}
         {error && <ErrorState error={error} onRetry={dashRefetch} />}

         {dashboard && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border shadow-sm">
                  <div>
                     <span className="text-sm font-medium text-text-muted mr-2">Academic Year:</span>
                     <select 
                        className="bg-transparent text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
                        value={activeYearId}
                        onChange={e => setSelectedYearId(e.target.value)}
                        disabled
                     >
                        <option value={dashboard.academicYear?.id}>{dashboard.academicYear?.name}</option>
                     </select>
                  </div>
               </div>

               {terms.length > 0 ? (
                  <>
                     <div className="flex gap-2 overflow-x-auto mb-6 pb-2 border-b border-border">
                        {terms.map((t: any) => (
                           <button
                              key={t.id}
                              onClick={() => handleTermChange(t.id)}
                              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap ${selectedTermId === t.id ? "bg-primary text-white" : "bg-surface text-text-muted hover:bg-primary-subtle"}`}
                           >
                              {t.name}
                           </button>
                        ))}
                     </div>
                     
                     <div>
                        {selectedTerm && (
                           <div>
                              {!selectedTerm.marksReleased ? (
                                 <Card className="bg-surface">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                       <div className="w-16 h-16 bg-primary-subtle rounded-full flex items-center justify-center text-primary mb-4">
                                          <Info size={32} />
                                       </div>
                                       <h3 className="text-xl font-semibold text-text-primary mb-2">
                                          Results not released yet
                                       </h3>
                                       <p className="text-text-muted max-w-md">
                                          Results for {selectedTerm.name} haven't been released yet.
                                       </p>
                                       {selectedTerm.exam?.endDate && (
                                          <p className="text-sm text-text-muted mt-4 bg-app-bg px-4 py-2 rounded-md border border-border">
                                             Exam ended on {formatDate(selectedTerm.exam.endDate)}
                                          </p>
                                       )}
                                    </CardContent>
                                 </Card>
                              ) : (
                                 <div className="space-y-6">
                                    {marksLoading && <SkeletonCard />}
                                    {marksError && <ErrorState error={marksError} onRetry={marksRefetch} />}
                                    
                                    {!marksLoading && !marksError && summary && (
                                       <>
                                          <Card>
                                             <CardContent className="p-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left divide-x-0 md:divide-x divide-border">
                                                   <div className="px-4">
                                                      <p className="text-sm font-medium text-text-muted">Subjects Graded</p>
                                                      <p className="text-2xl font-semibold text-text-primary mt-1">{summary.subjectsGraded}</p>
                                                   </div>
                                                   <div className="px-4">
                                                      <p className="text-sm font-medium text-text-muted">Total Marks</p>
                                                      <p className="text-2xl font-semibold tabular-nums text-text-primary mt-1">
                                                         {summary.totalMarks} <span className="text-sm text-text-muted font-normal">/ {summary.maxPossible}</span>
                                                      </p>
                                                   </div>
                                                   <div className="px-4">
                                                      <p className="text-sm font-medium text-text-muted">Average</p>
                                                      <p className="text-2xl font-semibold tabular-nums text-text-primary mt-1">
                                                         {summary.average !== null ? `${summary.average.toFixed(1)}%` : '—'}
                                                      </p>
                                                   </div>
                                                   <div className="px-4">
                                                      <p className="text-sm font-medium text-text-muted">Overall Grade</p>
                                                      <p className="text-2xl font-semibold text-text-primary mt-1">
                                                         {dashboard.latestTermSummary?.termId === selectedTerm.id 
                                                            ? (typeof dashboard.latestTermSummary?.grade === 'object' ? dashboard.latestTermSummary?.grade?.grade : dashboard.latestTermSummary?.grade) 
                                                            : "—"}
                                                      </p>
                                                   </div>
                                                </div>
                                             </CardContent>
                                          </Card>

                                          <Card>
                                             <CardContent className="p-6">
                                                <h3 className="text-sm font-medium text-text-primary mb-6">Subject Performance</h3>
                                                <div className="flex h-48 items-end gap-2 md:gap-4 w-full">
                                                   {marks.map((m: any) => {
                                                      const heightPct = m.isAbsent || m.marksObtained === null ? 0 : (m.marksObtained / m.maxMarks) * 100;
                                                      return (
                                                         <div key={m.id} className="flex-1 flex flex-col items-center group relative h-full">
                                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface border border-border shadow-sm text-xs font-medium px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none text-text-primary">
                                                               {m.subject.code ?? m.subject.name}: {formatMark(m.marksObtained, m.maxMarks, m.isAbsent)}
                                                            </div>
                                                            <div className="w-full flex-1 flex items-end bg-primary-subtle/30 rounded-t-sm relative">
                                                               <div 
                                                                  className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out" 
                                                                  style={{ height: `${Math.max(heightPct, 2)}%`, opacity: m.isAbsent ? 0.3 : 1 }}
                                                               />
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs font-medium text-text-muted mt-2 truncate w-full text-center px-1" title={m.subject.name}>
                                                               {m.subject.code ?? m.subject.name.substring(0, 3).toUpperCase()}
                                                            </span>
                                                         </div>
                                                      );
                                                   })}
                                                </div>
                                             </CardContent>
                                          </Card>

                                          <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                                             <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                   <thead className="bg-app-bg border-b border-border">
                                                      <tr>
                                                         <th className="px-6 py-3 font-semibold text-text-muted uppercase text-xs tracking-wider">Subject</th>
                                                         <th className="px-6 py-3 font-semibold text-text-muted uppercase text-xs tracking-wider text-right">Marks</th>
                                                         <th className="px-6 py-3 font-semibold text-text-muted uppercase text-xs tracking-wider text-center">Grade</th>
                                                         <th className="px-6 py-3 font-semibold text-text-muted uppercase text-xs tracking-wider">Remarks</th>
                                                      </tr>
                                                   </thead>
                                                   <tbody className="divide-y divide-border">
                                                      {marks.map((m: any) => {
                                                         const isFail = m.grade === 'F' || m.grade === 'E'; // Simple heuristic without isPassing
                                                         return (
                                                            <tr key={m.id} className="hover:bg-primary-subtle/10 transition-colors">
                                                               <td className="px-6 py-4">
                                                                  <p className="font-medium text-text-primary">{m.subject.name}</p>
                                                                  {m.subject.code && <p className="text-xs text-text-muted mt-0.5">{m.subject.code}</p>}
                                                               </td>
                                                               <td className="px-6 py-4 text-right font-medium tabular-nums text-text-primary">
                                                                  {formatMark(m.marksObtained, m.maxMarks, m.isAbsent)}
                                                               </td>
                                                               <td className="px-6 py-4 text-center">
                                                                  {m.grade ? (
                                                                     <Badge variant={isFail ? 'danger' : 'primary'}>{m.grade}</Badge>
                                                                  ) : (
                                                                     <span className="text-text-muted">—</span>
                                                                  )}
                                                               </td>
                                                               <td className="px-6 py-4 max-w-xs">
                                                                  {m.remarks ? (
                                                                     <p className="text-text-muted text-sm line-clamp-2" title={m.remarks}>
                                                                        {m.remarks}
                                                                     </p>
                                                                  ) : (
                                                                     <span className="text-text-muted">—</span>
                                                                  )}
                                                               </td>
                                                            </tr>
                                                         );
                                                      })}
                                                   </tbody>
                                                </table>
                                             </div>
                                          </div>
                                       </>
                                    )}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  </>
               ) : (
                  <Card>
                     <CardContent className="p-8 text-center text-text-muted">
                        No terms configured for this academic year.
                     </CardContent>
                  </Card>
               )}
            </div>
         )}
      </PageContainer>
   );
}
