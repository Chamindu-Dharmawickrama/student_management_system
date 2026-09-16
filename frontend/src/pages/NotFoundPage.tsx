import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLE_HOME, ROUTES } from "@/constants/app.constants";
import { useAppSelector } from "@/app/hooks";
import { selectUser } from "@/features/auth/slices/authSlice";
import { Button } from "@/shared/components/ui";

/** Public catch-all — reachable regardless of auth state; a 404 leaks nothing. */
export default function NotFoundPage() {
   const navigate = useNavigate();
   const user = useAppSelector(selectUser);
   const home = user ? ROLE_HOME[user.role] : ROUTES.LOGIN;

   return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg-app p-6 text-center">
         <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-subtle text-text-muted">
            <Compass className="h-7 w-7" aria-hidden="true" />
         </div>
         <div className="space-y-1">
            <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
            <p className="max-w-sm text-sm text-text-muted">
               The page you're looking for doesn't exist or may have moved.
            </p>
         </div>
         <Button variant="primary" onClick={() => navigate(home)}>
            {user ? "Go to my dashboard" : "Go to login"}
         </Button>
      </div>
   );
}
