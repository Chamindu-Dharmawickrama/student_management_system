import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { ROLE_HOME, ROUTES } from "@/constants/app.constants";
import { selectUser } from "@/features/auth/slices/authSlice";

/** Rendered at `/` inside the authenticated shell — sends each role to its own home. */
export function RoleRedirect() {
   const user = useAppSelector(selectUser);
   return <Navigate to={user ? ROLE_HOME[user.role] : ROUTES.LOGIN} replace />;
}
