import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [{ title: "Reset password — License Control" }, { name: "description", content: "Choose a new License Control administrator password." }, { property: "og:title", content: "Reset password — License Control" }, { property: "og:description", content: "Choose a new administrator password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: ResetPage });
function ResetPage() {
  const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [recovery, setRecovery] = useState(false); const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!recovery) return; setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) { toast.error(error.message); return; } toast.success("Password updated"); await navigate({ to: "/dashboard", replace: true }); }
  return <main className="flex min-h-screen items-center justify-center bg-muted/40 px-5"><form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-7 shadow-sm"><div><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">{recovery ? "Use at least eight characters." : "Open the recovery link from your email to continue."}</p></div><div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} required disabled={!recovery} value={password} onChange={e => setPassword(e.target.value)} /></div><Button disabled={busy || !recovery} className="w-full">Update password</Button></form></main>;
}