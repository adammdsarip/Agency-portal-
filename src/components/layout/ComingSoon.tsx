import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/feedback";

/** Placeholder for modules that exist in the navigation but aren't built yet. */
export function ComingSoon({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState icon={icon} title="Coming soon" description={description} />
    </div>
  );
}
