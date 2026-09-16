import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { ROUTES } from "@/constants/app.constants";
import { useForgotPasswordMutation } from "@/features/auth/api/authApi";
import {
   forgotPasswordSchema,
   type ForgotPasswordFormData,
} from "@/features/auth/validation/auth.schemas";
import type { SerializedApiError } from "@/types/api.types";
import { Alert, Button, Input } from "@/shared/components/ui";

export default function ForgotPasswordPage() {
   const navigate = useNavigate();
   const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
   const [submitted, setSubmitted] = useState(false);
   const [rateLimited, setRateLimited] = useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

   async function onSubmit(values: ForgotPasswordFormData) {
      try {
         await forgotPassword(values).unwrap();
      } catch (err) {
         // The backend always responds success to prevent account enumeration —
         // a real failure here is almost always the rate limit.
         if ((err as SerializedApiError)?.status === 429) {
            setRateLimited(true);
            return;
         }
      }
      // Neutral confirmation regardless of outcome — never imply whether the address exists.
      setSubmitted(true);
   }

   if (submitted) {
      return (
         <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">
               <MailCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
               <h1 className="text-xl font-semibold text-text-primary">Check your email</h1>
               <p className="text-sm text-text-muted">
                  If an account exists for that address, we've sent reset instructions.
               </p>
            </div>
            <Button variant="secondary" fullWidth onClick={() => navigate(ROUTES.LOGIN)}>
               Back to sign in
            </Button>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text-primary">Forgot password</h1>
            <p className="text-sm text-text-muted">
               Enter your account email and we'll send you reset instructions.
            </p>
         </div>

         {rateLimited && (
            <Alert variant="warning" title="Too many requests">
               Please wait a few minutes before trying again.
            </Alert>
         )}

         <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
               label="Email"
               type="email"
               autoComplete="email"
               autoFocus
               required
               error={errors.email?.message}
               {...register("email")}
            />
            <Button type="submit" fullWidth isLoading={isLoading} disabled={rateLimited}>
               Send reset instructions
            </Button>
            <Button variant="link" type="button" onClick={() => navigate(ROUTES.LOGIN)}>
               Back to sign in
            </Button>
         </form>
      </div>
   );
}
