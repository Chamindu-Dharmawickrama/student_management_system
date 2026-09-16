import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLE_HOME, ROUTES } from "@/constants/app.constants";
import { useAppSelector } from "@/app/hooks";
import { selectUser } from "@/features/auth/slices/authSlice";
import { Button } from "@/shared/components/ui";

export default function ForbiddenPage() {
   const user = useAppSelector(selectUser);
   const navigate = useNavigate();
   const home = user ? ROLE_HOME[user.role] : ROUTES.LOGIN;

   return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
         <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-subtle text-danger">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
         </div>
         <div className="space-y-1">
            <h1 className="text-xl font-semibold text-text-primary">You don't have access to this</h1>
            <p className="max-w-sm text-sm text-text-muted">
               Your account role doesn't permit viewing this page. If you think this is a
               mistake, contact your school administrator.
            </p>
         </div>
         <Button variant="primary" onClick={() => navigate(home)}>
            Go to my dashboard
         </Button>
      </div>
   );
}
