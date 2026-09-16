import { Construction } from "lucide-react";
import { PageContainer } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/ui";

export interface PlaceholderPageProps {
   title: string;
   description?: string;
}

/**
 * Generic stand-in for every admin/teacher/student screen this prompt
 * doesn't own. Later prompts replace individual routes' `element` with a
 * real lazy-loaded page — this component itself never needs to change.
 */
export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
   return (
      <PageContainer header={{ title, description }}>
         <EmptyState
            icon={<Construction className="h-6 w-6" aria-hidden="true" />}
            title="Coming soon"
            description="This screen is being built in a later prompt."
         />
      </PageContainer>
   );
}
