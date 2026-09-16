import { useAppSelector } from "@/app/hooks";
import { ROUTES, type UserRole } from "@/constants/app.constants";
import {
   selectIsAuthenticated,
   selectIsInitialized,
   selectMustChangePassword,
   selectUser,
} from "@/features/auth/slices/authSlice";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/shared/components/ui";

interface ProtectedRouteProps {
   children: ReactNode;
   allowedRoles?: UserRole[]; // If provided, only users with one of these roles can access the route
}

export function ProtectedRoute({
   children,
   allowedRoles,
}: ProtectedRouteProps) {
   const isInitialized = useAppSelector(selectIsInitialized);
   const isAuthenticated = useAppSelector(selectIsAuthenticated);
   const mustChangePassword = useAppSelector(selectMustChangePassword);
   const user = useAppSelector(selectUser);
   const location = useLocation();

   // Still restoring session — show spinner, not login redirect
   if (!isInitialized) {
      return <Spinner fullPage message="Restoring session…" />;
   }

   // Not authenticated → preserve intended destination for post-login redirect
   if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
   }

   // Unskippable forced password-change gate — every route except the
   // change-password screen itself redirects there while this is true.
   if (mustChangePassword && location.pathname !== ROUTES.CHANGE_PASSWORD) {
      return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
   }

   // Role check — a user who followed a stale/foreign link gets an explicit
   // explanation, never a silent bounce to some other dashboard.
   if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
      return <Navigate to={ROUTES.FORBIDDEN} replace />;
   }

   return <>{children}</>;
}
