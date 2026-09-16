import { useAppSelector } from "@/app/hooks";
import { ROLE_HOME } from "@/constants/app.constants";
import {
   selectIsAuthenticated,
   selectIsInitialized,
   selectUser,
} from "@/features/auth/slices/authSlice";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/shared/components/ui";
import { sanitizeRedirectPath } from "@/shared/utils/routeUtils";

interface GuestRouteProps {
   children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
   const isInitialized = useAppSelector(selectIsInitialized);
   const isAuthenticated = useAppSelector(selectIsAuthenticated);
   const user = useAppSelector(selectUser);
   const location = useLocation();

   // Still restoring session — show spinner to prevent flash of login page
   if (!isInitialized) {
      return <Spinner fullPage message="Loading…" />;
   }

   // If user is already authenticated, redirect them away from auth pages.
   // There is no shared dashboard — each role has its own home.
   if (isAuthenticated && user) {
      const from = sanitizeRedirectPath(
         (location.state as { from?: { pathname: string } })?.from?.pathname,
         ROLE_HOME[user.role],
      );
      return <Navigate to={from} replace />;
   }

   return <>{children}</>;
}
