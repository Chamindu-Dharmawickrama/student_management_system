import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/app.constants";
import { useGetStudentMeQuery } from "../api/studentPortalApi";
import { useLogoutAllMutation } from "@/features/auth/api/authApi";
import { useAppSelector } from "@/app/hooks";
import { selectUser } from "@/features/auth/slices/authSlice";
import { PageContainer } from "@/shared/components/layout";
import {
   Avatar,
   Badge,
   Button,
   Card,
   CardContent,
   DescriptionList,
   ErrorState,
   SkeletonCard,
} from "@/shared/components/ui";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useToast } from "@/shared/hooks/useToast";
import { formatDate } from "@/shared/utils/dateUtils";

export default function StudentProfilePage() {
   const navigate = useNavigate();
   const toast = useToast();
   const user = useAppSelector(selectUser);
   const { data: profile, isLoading, error, refetch } = useGetStudentMeQuery();
   const [logoutAll, { isLoading: isLoggingOutAll }] = useLogoutAllMutation();
   const { confirm, dialog } = useConfirm();

   async function handleLogoutAllDevices() {
      const confirmed = await confirm({
         title: "Log out of all devices",
         description:
            "This ends every other active session for your account, on every device. You'll stay signed in here until you next log out.",
         confirmLabel: "Log out everywhere",
         variant: "danger",
      });
      if (!confirmed) return;

      try {
         await logoutAll().unwrap();
         toast.success("All other sessions have been logged out.");
      } catch {
         toast.error("Couldn't log out other sessions. Please try again.");
      }
   }

   return (
      <PageContainer
         header={{
            title: "My Profile",
            description: "Your details are managed by the school office.",
         }}
      >
         {dialog}

         {isLoading && <SkeletonCard />}
         {error && <ErrorState error={error} onRetry={refetch} />}

         {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <Card>
                     <CardContent className="flex items-center gap-4">
                        <Avatar photoUrl={user?.photoUrl} firstName={profile.firstName} size="xl" />
                        <div>
                           <p className="text-lg font-semibold text-text-primary">
                              {profile.firstName} {profile.lastName}
                           </p>
                           <p className="text-sm text-text-muted">Admission No: {profile.admissionNumber}</p>
                           <Badge variant="primary" className="mt-1">Student</Badge>
                        </div>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent>
                        <h3 className="text-sm font-medium text-text-primary mb-4 border-b border-border pb-2">
                           Personal Information
                        </h3>
                        <DescriptionList
                           columns={2}
                           items={[
                              { label: "Date of Birth", value: formatDate(profile.dateOfBirth) },
                              { label: "Gender", value: profile.gender },
                              { label: "Email", value: profile.email },
                              { label: "Current Class", value: profile.currentClass?.name ?? "—" },
                              { label: "Academic Year", value: profile.currentClass?.academicYear?.name ?? "—" },
                           ]}
                        />

                        <h3 className="text-sm font-medium text-text-primary mb-4 mt-6 border-b border-border pb-2">
                           Guardian Information
                        </h3>
                        <DescriptionList
                           columns={2}
                           items={[
                              { label: "Guardian Name", value: profile.guardianName ?? "—" },
                              { label: "Guardian Phone", value: profile.guardianPhone ?? "—" },
                           ]}
                        />
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                           <p className="text-sm font-medium text-text-primary">Password</p>
                           <p className="text-sm text-text-muted">Change your account password.</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}>
                           Change password
                        </Button>
                     </CardContent>
                  </Card>

                  <Card>
                     <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                           <p className="text-sm font-medium text-text-primary">Log out of all devices</p>
                           <p className="text-sm text-text-muted">
                              Ends every other session signed in as you.
                           </p>
                        </div>
                        <Button
                           variant="danger"
                           isLoading={isLoggingOutAll}
                           onClick={() => void handleLogoutAllDevices()}
                        >
                           Log out everywhere
                        </Button>
                     </CardContent>
                  </Card>
               </div>

               <div className="space-y-6">
                  <Card>
                     <CardContent>
                        <h3 className="text-sm font-medium text-text-primary mb-4">
                           Enrollment History
                        </h3>
                        {profile.enrollmentHistory.length === 0 ? (
                           <p className="text-sm text-text-muted">No enrollment history available.</p>
                        ) : (
                           <div className="space-y-4">
                              {/* Sort descending by enrolledAt */}
                              {[...profile.enrollmentHistory]
                                 .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
                                 .map((hist, idx, arr) => (
                                    <div key={idx} className="flex gap-4">
                                       <div className="flex flex-col items-center">
                                          <div className={`w-3 h-3 rounded-full shrink-0 ${hist.isActive ? 'bg-primary' : 'bg-muted'}`} />
                                          {idx < arr.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
                                       </div>
                                       <div className="pb-4">
                                          <p className="text-sm font-medium text-text-primary">
                                             {hist.class.name}
                                          </p>
                                          <p className="text-xs text-text-muted">
                                             {hist.academicYear.name}
                                          </p>
                                          <p className="text-xs text-text-muted mt-1">
                                             {formatDate(hist.enrolledAt)}
                                          </p>
                                       </div>
                                    </div>
                                 ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
            </div>
         )}
      </PageContainer>
   );
}
