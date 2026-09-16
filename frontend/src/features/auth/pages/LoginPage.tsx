import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLE_HOME, ROUTES } from "@/constants/app.constants";
import { useLoginMutation } from "@/features/auth/api/authApi";
import { loginSchema, type LoginFormData } from "@/features/auth/validation/auth.schemas";
import { sanitizeRedirectPath } from "@/shared/utils/routeUtils";
import type { SerializedApiError } from "@/types/api.types";
import { Alert, Button, Input, PasswordInput } from "@/shared/components/ui";
import { useToast } from "@/shared/hooks/useToast";

export default function LoginPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const toast = useToast();
   const [login, { isLoading }] = useLoginMutation();
   const [formError, setFormError] = useState<string | null>(null);
   const [rateLimited, setRateLimited] = useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

   async function onSubmit(values: LoginFormData) {
      setFormError(null);
      try {
         const result = await login(values).unwrap();
         const user = result.data.user;

         if (user.mustChangePassword) {
            navigate(ROUTES.CHANGE_PASSWORD, { replace: true });
            return;
         }

         const from = sanitizeRedirectPath(
            (location.state as { from?: { pathname: string } })?.from?.pathname,
            ROLE_HOME[user.role],
         );
         navigate(from, { replace: true });
      } catch (err) {
         const status = (err as SerializedApiError)?.status;
         if (status === 429) {
            // The backend has two distinct 429 shapes here: a per-account
            // lockout (envelope-shaped, with a specific "try again in N
            // minutes" message) and a plain IP rate-limit (no `message`
            // field) — show the specific one when we have it.
            const message = (err as SerializedApiError).data?.message;
            setFormError(message ?? "Too many login attempts. Try again shortly.");
            setRateLimited(true);
            setTimeout(() => setRateLimited(false), 60_000);
         } else if (status === 400 || status === 401) {
            setFormError("Invalid username or password.");
         } else if (status === 403) {
            // Account locked/deactivated etc. — the backend's message is safe to show verbatim here.
            setFormError(
               (err as SerializedApiError).data?.message ?? "You don't have access to sign in.",
            );
         } else {
            toast.error("Something went wrong. Please try again.");
         }
      }
   }

   return (
      <div className="space-y-6">
         <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text-primary">Sign in</h1>
            <p className="text-sm text-text-muted">Enter your school-issued credentials to continue.</p>
         </div>

         {formError && <Alert variant="danger" title={formError} />}

         <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
               label="Username"
               autoComplete="username"
               autoFocus
               required
               error={errors.username?.message}
               {...register("username")}
            />
            <PasswordInput
               label="Password"
               autoComplete="current-password"
               required
               error={errors.password?.message}
               {...register("password")}
            />

            <div className="flex justify-end">
               <Button
                  variant="link"
                  type="button"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
               >
                  Forgot password?
               </Button>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} disabled={rateLimited}>
               Sign in
            </Button>
         </form>
      </div>
   );
}
