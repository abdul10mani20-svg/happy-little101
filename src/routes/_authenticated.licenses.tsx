import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { LicenseFormDialog } from "@/components/license-form-dialog";
import { LicenseTable } from "@/components/license-table";
import { workspaceQuery } from "@/components/workspace-state";
import type { LicenseRow } from "@/lib/license-ui";
export const Route = createFileRoute("/_authenticated/licenses")({ loader: ({ context }) => context.queryClient.ensureQueryData(workspaceQuery), head: () => ({ meta: [{ title: "Licenses — License Control" }, { name: "description", content: "Create and manage browser extension licenses." }, { property: "og:title", content: "Licenses — License Control" }, { property: "og:description", content: "Create and manage browser extension licenses." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Licenses });
function Licenses(){const {data}=useSuspenseQuery(workspaceQuery);return <AdminShell title="Licenses" description="Search, issue, extend, revoke, and manage device bindings." action={<LicenseFormDialog/>}><LicenseTable licenses={data.licenses as LicenseRow[]}/></AdminShell>}