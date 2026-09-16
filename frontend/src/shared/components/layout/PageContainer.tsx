import type { ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";

export interface PageContainerProps {
   header?: PageHeaderProps;
   children: ReactNode;
   className?: string;
}

/** Consistent max-width/padding wrapper + PageHeader placement for every page. */
export function PageContainer({ header, children, className }: PageContainerProps) {
   return (
      <div className={cn("mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8", className)}>
         {header && <PageHeader {...header} />}
         {children}
      </div>
   );
}
