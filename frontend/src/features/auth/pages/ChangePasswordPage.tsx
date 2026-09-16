import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/app.constants";
import { selectMustChangePassword } from "@/features/auth/slices/authSlice";
import { AppLayout, AuthLayout, PageContainer } from "@/shared/components/layout";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * `/change-password` is a top-level route, sibling to the shared AppLayout
 * route group (not nested inside it) — forced mode must render with zero
 * app chrome, which the persistent shell can't provide. This page picks the
 * chrome itself based on live Redux state, not the route it was reached from.
 */
export default function ChangePasswordPage() {
   const mustChangePassword = useAppSelector(selectMustChangePassword);
   const navigate = useNavigate();

   if (mustChangePassword) {
      return (
         <AuthLayout>
            <ChangePasswordForm mode="forced" />
         </AuthLayout>
      );
   }

   return (
      <AppLayout>
         <PageContainer className="max-w-md">
            <ChangePasswordForm mode="voluntary" onCancel={() => navigate(ROUTES.ACCOUNT)} />
         </PageContainer>
      </AppLayout>
   );
}
