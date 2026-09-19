import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, LayoutDashboard, ListChecks, LogOut, ScrollText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/dashboard" as const, label: "Overview", icon: LayoutDashboard },
  { to: "/licenses" as const, label: "Licenses", icon: ListChecks },
  { to: "/audit" as const, label: "Audit log", icon: ScrollText },
];

export function AdminShell({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { denied: false }, replace: true });
  }
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-5 px-4 sm:px-6">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5 font-semibold"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><KeyRound className="size-4" /></span><span className="hidden sm:inline">License Control</span></Link>
        <nav className="ml-auto flex items-center gap-1">{links.map(({ to, label, icon: Icon }) => <Link key={to} to={to} activeProps={{ className: "bg-accent text-accent-foreground" }} className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Icon className="size-4" /><span className="hidden md:inline">{label}</span></Link>)}</nav>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut /><span className="sr-only">Sign out</span></Button>
      </div>
    </header>
    <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-9">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-semibold uppercase text-primary">Administration</p><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1><p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>
      {children}
    </main>
  </div>;
}