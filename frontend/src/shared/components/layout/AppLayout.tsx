import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Alert, Drawer, SkeletonCard, SkeletonText } from "@/shared/components/ui";
import { useAppSelector } from "@/app/hooks";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";
import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const SIDEBAR_COLLAPSED_KEY = "sms.sidebarCollapsed";

function readCollapsedPreference(): boolean {
   try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
   } catch {
      return false;
   }
}

function RouteSkeleton() {
   return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
         <SkeletonText lines={2} />
         <SkeletonCard />
      </div>
   );
}

function ReadOnlyYearBanner() {
   const { year, isReadOnly } = useSelectedAcademicYear();
   if (!isReadOnly || !year) return null;
   return (
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
         <Alert variant="warning" title={`Viewing ${year.name} — a past academic year`}>
            Changes are disabled while a non-current year is selected.
         </Alert>
      </div>
   );
}

export interface AppLayoutProps {
   /** Rendered instead of `<Outlet/>` when this shell is mounted directly
    * rather than as a layout route (e.g. the voluntary change-password screen). */
   children?: ReactNode;
}

/** The authenticated shell: sidebar + topbar + content outlet. Mounted once
 * for the whole authenticated route tree so it never remounts on navigation. */
export function AppLayout({ children }: AppLayoutProps) {
   const user = useAppSelector(selectUser);
   const isAdmin = useAppSelector(selectIsAdmin);
   const location = useLocation();
   const { isOpen: isMobileNavOpen, open: openMobileNav, close: closeMobileNav } = useDisclosure(false);
   const [collapsed, setCollapsed] = useState(readCollapsedPreference);

   useEffect(() => {
      closeMobileNav();
   }, [location.pathname, closeMobileNav]);

   function toggleCollapsed() {
      setCollapsed((prev) => {
         const next = !prev;
         try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
         } catch {
            // ignore
         }
         return next;
      });
   }

   if (!user) return null;

   return (
      <div className="flex h-dvh w-full overflow-hidden bg-bg-app">
         <aside
            className={`hidden shrink-0 border-r border-border bg-bg-card transition-[width] duration-(--transition-base) lg:flex ${collapsed ? "w-16" : "w-64"}`}
         >
            <Sidebar role={user.role} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
         </aside>

         <Drawer isOpen={isMobileNavOpen} onClose={closeMobileNav} title="Menu" side="left" size="sm">
            <Sidebar role={user.role} onNavigate={closeMobileNav} showBrand={false} />
         </Drawer>

         <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onMenuClick={openMobileNav} />

            {isAdmin && <ReadOnlyYearBanner />}

            <main className="flex-1 overflow-y-auto">
               <ErrorBoundary key={location.pathname}>
                  <Suspense fallback={<RouteSkeleton />}>
                     {children ?? <Outlet />}
                  </Suspense>
               </ErrorBoundary>
            </main>
         </div>
      </div>
   );
}
