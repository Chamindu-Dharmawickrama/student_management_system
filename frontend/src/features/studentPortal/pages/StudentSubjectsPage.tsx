/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useGetStudentMeQuery } from "../api/studentPortalApi";
import { PageContainer } from "@/shared/components/layout";
import { Card, CardContent, ErrorState, SkeletonCard } from "@/shared/components/ui";
import { Book } from "lucide-react";
import type { StudentSubjectDto } from "../types/studentPortal.types";

export default function StudentSubjectsPage() {
   const { data: me, isLoading, error, refetch } = useGetStudentMeQuery();

   const subjectsByYear = useMemo(() => {
      if (!me) return [];
      const grouped = new Map<string, { yearName: string; isCurrent: boolean; subjects: StudentSubjectDto[] }>();
      
      const currentYearId = me.currentClass?.academicYear?.id;

      me.subjects.forEach((s: any) => {
         const yearId = s.academicYear.id;
         if (!grouped.has(yearId)) {
            grouped.set(yearId, {
               yearName: s.academicYear.name,
               isCurrent: yearId === currentYearId,
               subjects: []
            });
         }
         grouped.get(yearId)!.subjects.push(s);
      });

      return Array.from(grouped.values()).sort((a, b) => {
         if (a.isCurrent) return -1;
         if (b.isCurrent) return 1;
         return b.yearName.localeCompare(a.yearName);
      });
   }, [me]);

   return (
      <PageContainer
         header={{
            title: "My Subjects",
            description: "Your selected subjects across different academic years.",
         }}
      >
         {isLoading && <SkeletonCard />}
         {error && <ErrorState error={error} onRetry={refetch} />}

         {me && (
            <div className="space-y-8">
               <div className="bg-primary-subtle border-l-4 border-primary p-4 rounded-r-md">
                  <p className="text-sm text-text-primary">
                     Your subjects are set by the school office. Contact them if something looks wrong.
                  </p>
               </div>

               {subjectsByYear.length === 0 ? (
                  <Card>
                     <CardContent className="p-8 text-center">
                        <Book className="w-12 h-12 text-muted mx-auto mb-4" />
                        <p className="text-text-muted">No subjects have been assigned to you yet.</p>
                     </CardContent>
                  </Card>
               ) : (
                  <div className="space-y-8">
                     {subjectsByYear.map((group) => (
                        <div key={group.yearName}>
                           <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              {group.yearName}
                              {group.isCurrent && (
                                 <span className="text-xs font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                                    Current
                                 </span>
                              )}
                           </h2>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {group.subjects.map((sub) => (
                                 <Card key={sub.id}>
                                    <CardContent className="p-5 flex items-start gap-4">
                                       <div className="p-3 rounded-md bg-surface border border-border shrink-0">
                                          <Book className="text-text-muted" size={24} />
                                       </div>
                                       <div>
                                          <p className="font-medium text-text-primary">{sub.subject.name}</p>
                                          {sub.subject.code && (
                                             <p className="text-sm text-text-muted mt-1">{sub.subject.code}</p>
                                          )}
                                       </div>
                                    </CardContent>
                                 </Card>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}
      </PageContainer>
   );
}
