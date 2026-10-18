import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { checkLicensingApiHealth } from "@/lib/licenses.functions";

export function ApiHealth() {
  const check = useServerFn(checkLicensingApiHealth);
  const q = useQuery({ queryKey: ["api-health"], queryFn: () => check(), refetchInterval: 60_000 });
  const d = q.data;
  const label = q.isFetching && !d ? "Checking…" : q.isError ? "Check failed" : d?.ok ? `Online${d.latencyMs != null ? ` · ${d.latencyMs} ms` : ""}` : d?.productOk === false ? "Product missing" : d?.detail ?? "Unknown";
  const tone = d?.ok ? "text-success" : q.isFetching && !d ? "text-muted-foreground" : "text-destructive";
  return (
    <span className="flex items-center gap-2">
      <span className={tone}>{label}</span>
      <button type="button" aria-label="Re-check validation API" onClick={() => q.refetch()} className="text-muted-foreground hover:text-foreground">
        <RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />
      </button>
    </span>
  );
}
