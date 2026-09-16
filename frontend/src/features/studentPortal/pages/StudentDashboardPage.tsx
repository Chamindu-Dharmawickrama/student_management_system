/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetStudentDashboardQuery, useGetStudentMeQuery } from "../api/studentPortalApi";
import { useAppSelector } from "@/app/hooks";
import { selectUser } from "@/features/auth/slices/authSlice";
import { PageContainer } from "@/shared/components/layout";
import { Avatar, Badge, Card, CardContent, ErrorState, SkeletonCard } from "@/shared/components/ui";
import { ROUTES } from "@/constants/app.constants";
import { Link } from "react-router-dom";
import { formatMark } from "@/shared/utils/formatUtils";
import { formatDate } from "@/shared/utils/dateUtils";
import { BookOpen, Calendar, GraduationCap, TrendingUp, ChevronRight, Award } from "lucide-react";

export default function StudentDashboardPage() {
   const user = useAppSelector(selectUser);
   const { data: me, isLoading: meLoading, error: meError, refetch: meRefetch } = useGetStudentMeQuery();
   const { data: dashboard, isLoading: dashLoading, error: dashError, refetch: dashRefetch } = useGetStudentDashboardQuery();

   const isLoading = meLoading || dashLoading;
   const error = meError || dashError;

   function handleRetry() {
      if (meError) void meRefetch();
      if (dashError) void dashRefetch();
   }

   const subjectsEnrolled = dashboard?.subjects.length ?? 0;
   const termsReleased = dashboard?.terms.filter((t: any) => t.marksReleased).length ?? 0;

   return (
      <PageContainer header={{ title: "Dashboard" }}>
         {me && dashboard && (
            <div className="flex items-center gap-4 mb-8 bg-surface p-6 rounded-lg border border-border shadow-sm">
               <Avatar photoUrl={user?.photoUrl} firstName={me.firstName} size="xl" />
               <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                     Welcome, {me.firstName} {me.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-text-muted">
                     <span>Admission No: {me.admissionNumber}</span>
                     <span>•</span>
                     <span>{me.currentClass?.name ?? "No Class Assigned"}</span>
                     <span>•</span>
                     <span>{me.currentClass?.academicYear?.name ?? "No Year"}</span>
                  </div>
               </div>
            </div>
         )}
         {isLoading && <SkeletonCard />}
         {error && <ErrorState error={error} onRetry={handleRetry} />}

         {me && dashboard && (
            <div className="space-y-8">
               {/* StatCards */}
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                     <CardContent className="flex items-center p-6 gap-4">
                        <div className="p-3 rounded-md bg-primary-subtle text-primary">
                           <BookOpen size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-text-muted">Subjects Enrolled</p>
                           <p className="text-2xl font-semibold tabular-nums text-text-primary">{subjectsEnrolled}</p>
                        </div>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardContent className="flex items-center p-6 gap-4">
                        <div className="p-3 rounded-md bg-primary-subtle text-primary">
                           <Calendar size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-text-muted">Terms Released</p>
                           <p className="text-2xl font-semibold tabular-nums text-text-primary">{termsReleased}</p>
                        </div>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardContent className="flex items-center p-6 gap-4">
                        <div className="p-3 rounded-md bg-primary-subtle text-primary">
                           <TrendingUp size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-text-muted">Latest Average</p>
                           <p className="text-2xl font-semibold tabular-nums text-text-primary">
                              {dashboard.latestTermSummary?.average !== null && dashboard.latestTermSummary?.average !== undefined
                                 ? `${dashboard.latestTermSummary.average.toFixed(1)}%`
                                 : "—"}
                           </p>
                        </div>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardContent className="flex items-center p-6 gap-4">
                        <div className="p-3 rounded-md bg-primary-subtle text-primary">
                           <GraduationCap size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-text-muted">Latest Grade</p>
                           <p className="text-2xl font-semibold text-text-primary">
                              {typeof dashboard.latestTermSummary?.grade === 'object'
                                 ? dashboard.latestTermSummary?.grade?.grade
                                 : dashboard.latestTermSummary?.grade ?? "—"}
                           </p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* Term Progress */}
               <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Term Progress</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {dashboard.terms.map((term: any) => (
                        <Card key={term.id} className={term.marksReleased ? "border-primary" : ""}>
                           <CardContent className="p-5 flex flex-col h-full">
                              <div className="flex items-center justify-between mb-2">
                                 <h3 className="font-medium text-text-primary">{term.name}</h3>
                                 {term.marksReleased && <Badge variant="primary">Released</Badge>}
                              </div>
                              
                              <div className="text-sm text-text-muted flex-grow">
                                 {term.marksReleased ? (
                                    <div className="space-y-1">
                                       <p>Subjects Graded: {term.subjectsGraded} / {term.subjectsTotal}</p>
                                    </div>
                                 ) : (
                                    <div className="space-y-1">
                                       <p>Results have not been released yet.</p>
                                       {term.exam?.endDate && (
                                          <p>Exam ended: {formatDate(term.exam.endDate)}</p>
                                       )}
                                    </div>
                                 )}
                              </div>

                              {term.marksReleased && (
                                 <div className="mt-4 pt-4 border-t border-border">
                                    <Link
                                       to={`${ROUTES.STUDENT_MARKS}?termId=${term.id}`}
                                       className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover"
                                    >
                                       View full results <ChevronRight size={16} className="ml-1" />
                                    </Link>
                                 </div>
                              )}
                           </CardContent>
                        </Card>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Latest Results Preview */}
                  <div>
                     <h2 className="text-lg font-semibold text-text-primary mb-4 flex justify-between items-center">
                        Latest Results Preview
                        {dashboard.latestTermSummary && (
                           <Link
                              to={`${ROUTES.STUDENT_MARKS}?termId=${dashboard.latestTermSummary.termId}`}
                              className="text-sm font-medium text-primary hover:text-primary-hover"
                           >
                              See All
                           </Link>
                        )}
                     </h2>
                     <Card>
                        {dashboard.latestTermSummary ? (
                           <CardContent className="p-0">
                              <div className="p-4 bg-primary-subtle border-b border-border">
                                 <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                       <p className="text-xs font-medium text-primary mb-1">Highest</p>
                                       <p className="font-medium text-text-primary">
                                          {dashboard.latestTermSummary.highest?.subject.name ?? "—"}
                                       </p>
                                       <p className="text-xl font-bold tabular-nums text-text-primary">
                                          {formatMark(dashboard.latestTermSummary.highest?.marksObtained, 100, false)}
                                       </p>
                                    </div>
                                    <div className="w-px h-12 bg-border"></div>
                                    <div className="flex-1">
                                       <p className="text-xs font-medium text-text-muted mb-1">Lowest</p>
                                       <p className="font-medium text-text-primary">
                                          {dashboard.latestTermSummary.lowest?.subject.name ?? "—"}
                                       </p>
                                       <p className="text-xl font-bold tabular-nums text-text-primary">
                                          {formatMark(dashboard.latestTermSummary.lowest?.marksObtained, 100, false)}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </CardContent>
                        ) : (
                           <CardContent className="p-6 text-center">
                              <Award className="w-12 h-12 text-muted mx-auto mb-3" />
                              <p className="text-text-muted">No results released yet.</p>
                           </CardContent>
                        )}
                     </Card>
                  </div>

                  {/* My Subjects */}
                  <div>
                     <h2 className="text-lg font-semibold text-text-primary mb-4 flex justify-between items-center">
                        My Subjects
                        <Link
                           to={ROUTES.STUDENT_SUBJECTS}
                           className="text-sm font-medium text-primary hover:text-primary-hover"
                        >
                           Details
                        </Link>
                     </h2>
                     <Card>
                        <CardContent>
                           {dashboard.subjects.length === 0 ? (
                              <p className="text-text-muted py-2">No subjects assigned for this year.</p>
                           ) : (
                              <div className="flex flex-wrap gap-2">
                                 {dashboard.subjects.map((subj: any) => (
                                    <span
                                       key={subj.id}
                                       className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-surface border border-border text-text-primary shadow-sm"
                                    >
                                       {subj.name}
                                       {subj.code && <span className="ml-2 text-xs text-text-muted border-l border-border pl-2">{subj.code}</span>}
                                    </span>
                                 ))}
                              </div>
                           )}
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </div>
         )}
      </PageContainer>
   );
}
