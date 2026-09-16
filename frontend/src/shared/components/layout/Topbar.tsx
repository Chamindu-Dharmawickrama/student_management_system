import { Menu, ChevronDown, User, KeyRound, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { ROUTES, type UserRole } from "@/constants/app.constants";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";
import { useLogoutMutation } from "@/features/auth/api/authApi";
import { useGetProfileQuery } from "@/features/profile/api/profileApi";
import { YearSwitcher } from "@/features/academicYear/components/YearSwitcher";
import { Avatar, Badge, Breadcrumbs, DropdownMenu, type BreadcrumbItem } from "@/shared/components/ui";
import { useToast } from "@/shared/hooks/useToast";

const ROLE_LABELS: Record<UserRole, string> = {
   SCHOOL_ADMIN: "Admin",
   TEACHER: "Teacher",
   STUDENT: "Student",
};

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
   const segments = pathname.split("/").filter(Boolean);
   let path = "";
   return segments.map((segment) => {
      path += `/${segment}`;
      const looksLikeId = /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
      const label = looksLikeId
         ? "Details"
         : segment
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
      return { label, href: path };
   });
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
   const location = useLocation();
   const navigate = useNavigate();
   const toast = useToast();
   const user = useAppSelector(selectUser);
   const isAdmin = useAppSelector(selectIsAdmin);
   const [logout] = useLogoutMutation();

   // Always mounted for any authenticated user — hydrates email/photoUrl/etc.
   // into the auth slice shortly after a page refresh (see authSlice.ts).
   useGetProfileQuery();

   if (!user) return null;

   async function handleLogout() {
      try {
         await logout().unwrap();
      } catch {
         // logout is best-effort client-side; state is already cleared either way
      } finally {
         toast.success("Logged out");
         navigate(ROUTES.LOGIN, { replace: true });
      }
   }

   const breadcrumbs = getBreadcrumbItems(location.pathname);

   return (
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-bg-card px-4 sm:px-6">
         <div className="flex min-w-0 items-center gap-3">
            <button
               type="button"
               onClick={onMenuClick}
               aria-label="Open navigation menu"
               className="rounded-md p-2 text-text-secondary hover:bg-bg-subtle lg:hidden"
            >
               <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="hidden min-w-0 sm:block">
               <Breadcrumbs items={breadcrumbs} />
            </div>
         </div>

         <div className="flex shrink-0 items-center gap-4">
            {isAdmin && <YearSwitcher />}

            <DropdownMenu
               align="end"
               trigger={
                  <button
                     type="button"
                     className="flex items-center gap-2.5 rounded-full p-1.5 pr-3 hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors border border-transparent hover:border-border"
                  >
                     <Avatar photoUrl={user.photoUrl} firstName={user.username} size="sm" />
                     <span className="hidden flex-col items-start sm:flex">
                        <span className="text-sm font-semibold text-text-primary leading-none mb-1">{user.username}</span>
                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0 min-h-[18px] h-[18px]">
                           {ROLE_LABELS[user.role]}
                        </Badge>
                     </span>
                     <ChevronDown className="hidden h-4 w-4 text-text-muted sm:block ml-1" aria-hidden="true" />
                  </button>
               }
               items={[
                  {
                     label: "Account",
                     icon: <User className="h-4 w-4" aria-hidden="true" />,
                     onSelect: () => navigate(ROUTES.ACCOUNT),
                  },
                  {
                     label: "Change password",
                     icon: <KeyRound className="h-4 w-4" aria-hidden="true" />,
                     onSelect: () => navigate(ROUTES.CHANGE_PASSWORD),
                  },
                  {
                     label: "Log out",
                     icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
                     danger: true,
                     onSelect: () => void handleLogout(),
                  },
               ]}
            />
         </div>
      </header>
   );
}
