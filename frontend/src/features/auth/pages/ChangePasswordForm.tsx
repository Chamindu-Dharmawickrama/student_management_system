import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ROLE_HOME, ROUTES } from "@/constants/app.constants";
import { useAppSelector } from "@/app/hooks";
import { selectUser } from "@/features/auth/slices/authSlice";
import { useChangePasswordMutation, useLogoutMutation } from "@/features/auth/api/authApi";
import {
   changePasswordSchema,
   type ChangePasswordFormData,
} from "@/features/auth/validation/auth.schemas";
import type { SerializedApiError } from "@/types/api.types";
import { getErrorMessage } from "@/types/api.types";
import { Alert, Button, PasswordInput } from "@/shared/components/ui";
import { useToast } from "@/shared/hooks/useToast";

export interface ChangePasswordFormProps {
   mode: "forced" | "voluntary";
   onCancel?: () => void;
}

export function ChangePasswordForm({ mode, onCancel }: ChangePasswordFormProps) {
   const navigate = useNavigate();
   const toast = useToast();
   const user = useAppSelector(selectUser);
   const [changePassword, { isLoading }] = useChangePasswordMutation();
   const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
   const [formError, setFormError] = useState<string | null>(null);

   const {
      register,
      handleSubmit,
      control,
      formState: { errors },
   } = useForm<ChangePasswordFormData>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
   });

   async function onSubmit(values: ChangePasswordFormData) {
      setFormError(null);
      try {
         const result = await changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
         }).unwrap();
         toast.success("Password changed successfully.");
         navigate(ROLE_HOME[result.data.user.role], { replace: true });
      } catch (err) {
         const status = (err as SerializedApiError)?.status;
         if (status === 400) {
            setFormError(
               (err as SerializedApiError).data?.message ?? "Current password is incorrect.",
            );
         } else if (status === 429) {
            setFormError("Too many attempts. Please wait a minute and try again.");
         } else {
            setFormError(getErrorMessage(err));
         }
      }
   }

   async function handleLogout() {
      try {
         await logout().unwrap();
      } finally {
         navigate(ROUTES.LOGIN, { replace: true });
      }
   }

   return (
      <div className="space-y-6">
         <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text-primary">
               {mode === "forced" ? "Change your temporary password" : "Change password"}
            </h1>
            {mode === "forced" ? (
               <p className="text-sm text-text-muted">
                  Your account was created with a temporary password. You must set a new
                  password before you can continue using {user ? "your account" : "the app"}.
               </p>
            ) : (
               <p className="text-sm text-text-muted">Choose a new password for your account.</p>
            )}
         </div>

         {formError && <Alert variant="danger" title={formError} />}

         <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <PasswordInput
               label="Current password"
               autoComplete="current-password"
               autoFocus
               required
               error={errors.currentPassword?.message}
               {...register("currentPassword")}
            />
            <Controller
               name="newPassword"
               control={control}
               render={({ field }) => (
                  <PasswordInput
                     label="New password"
                     autoComplete="new-password"
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

            <div className="flex flex-col gap-2">
               <Button type="submit" fullWidth isLoading={isLoading}>
                  Change password
               </Button>
               {mode === "voluntary" && onCancel && (
                  <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
                     Cancel
                  </Button>
               )}
               {mode === "forced" && (
                  <Button
                     type="button"
                     variant="ghost"
                     fullWidth
                     isLoading={isLoggingOut}
                     onClick={() => void handleLogout()}
                  >
                     Log out
                  </Button>
               )}
            </div>
         </form>
      </div>
   );
}
