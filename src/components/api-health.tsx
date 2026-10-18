import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { checkLicensingApiHealth, getApiHealthHistory } from "@/lib/licenses.functions";

export function ApiHealth() {
  const check = useServerFn(checkLicensingApiHealth);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["api-health"], queryFn: async () => { const r = await check(); qc.invalidateQueries({ queryKey: ["api-health-history"] }); return r; }, refetchInterval: 60_000 });
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

export function ApiHealthHistory() {
  const load = useServerFn(getApiHealthHistory);
  const q = useQuery({ queryKey: ["api-health-history"], queryFn: () => load() });
  const rows = q.data ?? [];
  return (
    <section className="mt-5 border bg-card p-5">
      <h2 className="font-semibold">Validation API health history</h2>
      <div className="mt-4 max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 font-medium">Checked at</th><th className="py-2 font-medium">Status</th><th className="py-2 text-right font-medium">Response time</th></tr></thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2">{new Date(r.checked_at).toLocaleString()}</td>
                <td className={`py-2 ${r.ok ? "text-success" : "text-destructive"}`}>{r.ok ? "Online" : r.detail ?? "Failed"}</td>
                <td className="py-2 text-right font-mono text-xs">{r.latency_ms != null ? `${r.latency_ms} ms` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
        {q.isError && <p className="py-6 text-center text-sm text-destructive">Unable to load history.</p>}
        {!q.isLoading && !q.isError && !rows.length && <p className="py-6 text-center text-sm text-muted-foreground">No checks recorded yet.</p>}
      </div>
    </section>
  );
}
