import { type ReactNode } from "react";
import { Outlet } from "react-router-dom";

export interface AuthLayoutProps {
   children?: ReactNode;
}

/**
 * Centered-card layout for login/forgot/reset and the forced password-change
 * screen — the first screen anyone sees, and the only one a locked-out user
 * (mustChangePassword) can reach besides logout. Renders `children` when
 * given (the forced change-password page mounts this directly, outside the
 * router's nested layout), otherwise an `<Outlet/>` for guest routes.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
   return (
      <div className="flex min-h-[100dvh] w-full bg-bg-app">
         <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
            <div className="flex items-center gap-2">
               <img src="/mainLogo.png" alt="" className="h-8 w-8 rounded-md object-contain" />
               <span className="text-lg font-semibold">Student Management System</span>
            </div>
            <div className="max-w-md space-y-3">
               <h2 className="text-3xl font-semibold leading-tight">
                  Manage your school, all in one place.
               </h2>
               <p className="text-primary-subtle/90 text-sm">
                  Academic years, classes, marks, and reporting — built for the
                  people who run a school day to day.
               </p>
            </div>
            <div
               className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10"
               aria-hidden="true"
            />
         </div>

         <div className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
            <div className="w-full max-w-sm">
               <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
                  <img src="/mainLogo.png" alt="" className="h-7 w-7 rounded-md object-contain" />
                  <span className="text-base font-semibold text-text-primary">
                     Student Management System
                  </span>
               </div>
               {children ?? <Outlet />}
            </div>
         </div>
      </div>
   );
}
