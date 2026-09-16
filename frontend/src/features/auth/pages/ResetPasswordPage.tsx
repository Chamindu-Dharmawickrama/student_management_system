import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/constants/app.constants";
import { useResetPasswordMutation } from "@/features/auth/api/authApi";
import {
   resetPasswordSchema,
   type ResetPasswordFormData,
} from "@/features/auth/validation/auth.schemas";
import type { SerializedApiError } from "@/types/api.types";
import { getErrorMessage } from "@/types/api.types";
import { Alert, Button, PasswordInput } from "@/shared/components/ui";

export default function ResetPasswordPage() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token");
   const [resetPassword, { isLoading }] = useResetPasswordMutation();
   const [done, setDone] = useState(false);
   const [formError, setFormError] = useState<string | null>(null);

   const {
      register,
      handleSubmit,
      control,
      formState: { errors },
   } = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: { newPassword: "", confirmPassword: "" },
   });

   if (!token) {
      return (
         <div className="space-y-4 text-center">
            <div className="space-y-1">
               <h1 className="text-xl font-semibold text-text-primary">Invalid reset link</h1>
               <p className="text-sm text-text-muted">
                  This password reset link is missing or invalid. Request a new one to continue.
               </p>
            </div>
            <Button variant="primary" fullWidth onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
               Request a new link
            </Button>
         </div>
      );
   }

   if (done) {
      return (
         <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
               <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
               <h1 className="text-xl font-semibold text-text-primary">Password reset</h1>
               <p className="text-sm text-text-muted">You can now sign in with your new password.</p>
            </div>
            <Button variant="primary" fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
               Go to sign in
            </Button>
         </div>
      );
   }

   async function onSubmit(values: ResetPasswordFormData) {
      setFormError(null);
      try {
         await resetPassword({ token: token as string, newPassword: values.newPassword }).unwrap();
         setDone(true);
      } catch (err) {
         const status = (err as SerializedApiError)?.status;
         if (status === 429) {
            setFormError("Too many attempts. Please wait a few minutes and try again.");
         } else if (status === 400) {
            setFormError("This reset link is invalid or has expired. Request a new one.");
         } else {
            setFormError(getErrorMessage(err));
         }
      }
   }

   return (
      <div className="space-y-6">
         <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text-primary">Reset your password</h1>
            <p className="text-sm text-text-muted">Choose a new password for your account.</p>
         </div>

         {formError && <Alert variant="danger" title={formError} />}

         <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
               name="newPassword"
               control={control}
               render={({ field }) => (
                  <PasswordInput
                     label="New password"
                     autoComplete="new-password"
                     autoFocus
                     required
                     showStrengthMeter
                     error={errors.newPassword?.message}
                     {...field}
                  />
               )}
            />
            <PasswordInput
               label="Confirm new password"
               autoComplete="new-password"
               required
               error={errors.confirmPassword?.message}
               {...register("confirmPassword")}
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
               Reset password
            </Button>
         </form>
      </div>
   );
}
