import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/app.constants";
import { useGetProfileQuery } from "@/features/profile/api/profileApi";
import { useLogoutAllMutation } from "@/features/auth/api/authApi";
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
import { formatDateTime } from "@/shared/utils/dateUtils";

const ROLE_LABELS: Record<string, string> = {
   SCHOOL_ADMIN: "School Admin",
   TEACHER: "Teacher",
   STUDENT: "Student",
};

export default function AccountPage() {
   const navigate = useNavigate();
   const toast = useToast();
   const { data: profile, isLoading, error, refetch } = useGetProfileQuery();
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
            title: "Account",
            description: "Your identity details, managed by the school office.",
         }}
      >
         {dialog}

         {isLoading && <SkeletonCard />}
         {error && <ErrorState error={error} onRetry={refetch} />}

         {profile && (
            <div className="max-w-2xl space-y-6">
               <Card>
                  <CardContent className="flex items-center gap-4">
                     <Avatar photoUrl={profile.photoUrl} firstName={profile.username} size="xl" />
                     <div>
                        <p className="text-lg font-semibold text-text-primary">{profile.username}</p>
                        <Badge variant="primary">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardContent>
                     <DescriptionList
                        columns={2}
                        items={[
                           { label: "Username", value: profile.username },
                           { label: "Email", value: profile.email },
                           { label: "Role", value: ROLE_LABELS[profile.role] ?? profile.role },
                           { label: "Account status", value: profile.isActive ? "Active" : "Inactive" },
                           { label: "Member since", value: formatDateTime(profile.createdAt) },
                        ]}
                     />
                     <p className="mt-4 text-sm text-text-muted">
                        Your name, username, email, and photo are managed by the school office and
                        can't be changed from here.
                     </p>
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
         )}
      </PageContainer>
   );
}
