import { Badge } from "@/components/ui/primitives";
import { isProjectStatus, STATUS_META } from "@/lib/projects/status";

export function StatusBadge({ status }: { status: string }) {
  if (!isProjectStatus(status)) return <Badge>{status}</Badge>;
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
