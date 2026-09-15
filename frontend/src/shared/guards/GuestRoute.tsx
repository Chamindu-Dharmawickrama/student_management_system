import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/app.constants";
import {
   selectIsAuthenticated,
   selectIsInitialized,
} from "@/features/auth/slices/authSlice";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
//import { Spinner } from "../components/ui/Spinner";
import { sanitizeRedirectPath } from "@/shared/utils/routeUtils";

interface GuestRouteProps {
   children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
   const isInitialized = useAppSelector(selectIsInitialized);
   const isAuthenticated = useAppSelector(selectIsAuthenticated);
   const location = useLocation();

   // Still restoring session — show spinner to prevent flash of login page
   if (!isInitialized) {
      //return <Spinner fullPage message="Loading..." />;
      return null;
   }

   // If user is already authenticated, redirect them away from auth pages
   if (isAuthenticated) {
      // If they were trying to go somewhere else before being redirected to login, send them there.
      // Otherwise, send them to the dashboard.
      const from = sanitizeRedirectPath(
         (location.state as { from?: { pathname: string } })?.from?.pathname,
         ROUTES.DASHBOARD,
      );
      return <Navigate to={from} replace />;
   }

   return <>{children}</>;
}
