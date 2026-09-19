import { queryOptions } from "@tanstack/react-query";
import { getAdminWorkspace } from "@/lib/licenses.functions";

export const workspaceQuery = queryOptions({ queryKey: ["admin-workspace"], queryFn: () => getAdminWorkspace(), staleTime: 15_000 });