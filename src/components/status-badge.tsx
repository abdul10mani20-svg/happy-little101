import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("capitalize", status === "active" && "border-success/30 bg-success/10 text-success", status === "expired" && "border-warning/30 bg-warning/10 text-warning-foreground", status === "revoked" && "border-destructive/30 bg-destructive/10 text-destructive", status === "unactivated" && "border-border bg-muted text-muted-foreground")}>{status}</Badge>;
}