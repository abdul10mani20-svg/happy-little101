import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ denied: search["denied"] === true || search["denied"] === "true" }),
  head: () => ({ meta: [{ title: "Administrator sign in — License Control" }, { name: "description", content: "Secure administrator access for License Control." }, { property: "og:title", content: "Administrator sign in — License Control" }, { property: "og:description", content: "Secure administrator access for License Control." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate(); const { denied } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(denied ? "This account is not authorized for administration." : "");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  useEffect(() => { supabase.auth.getUser().then(async ({ data }) => { if (!data.user) return; const { data: admin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }); if (admin) navigate({ to: "/dashboard", replace: true }); }); }, [navigate]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setMessage("Check your email for the password reset link."); return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: window.location.origin, data: { display_name: form.name } } });
        if (error) throw error;
        if (!data.session) { setMessage("Check your email to confirm your account, then sign in."); setMode("signin"); return; }
      } else { const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password }); if (error) throw error; }
      const { data: user } = await supabase.auth.getUser(); if (!user.user) throw new Error("Unable to verify account");
      const name = form.name || String(user.user.user_metadata?.["display_name"] ?? user.user.email?.split("@")[0] ?? "Administrator");
      const { data: claimed, error: claimError } = await supabase.rpc("claim_first_admin", { _display_name: name });
      if (claimError || !claimed) { await supabase.auth.signOut(); setMessage("An administrator already exists. Ask them to authorize this account."); return; }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to continue"); } finally { setBusy(false); }
  }
  async function google() { setBusy(true); const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.error) { toast.error(result.error.message); setBusy(false); } }
  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
    <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3 font-semibold"><span className="grid size-10 place-items-center rounded-md bg-primary-foreground/10"><KeyRound /></span>License Control</div><div className="max-w-xl"><p className="mb-4 text-sm font-semibold uppercase text-primary-foreground/70">Secure operations workspace</p><h1 className="text-5xl font-semibold leading-tight">Issue, activate, and govern every license from one place.</h1><p className="mt-5 text-lg text-primary-foreground/70">Authoritative validation, device binding, and a complete audit trail for your browser extension.</p></div><p className="text-sm text-primary-foreground/60">Protected by server-side authorization and database security policies.</p></section>
    <section className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-sm"><div className="mb-8 lg:hidden"><div className="mb-6 flex items-center gap-2 font-semibold"><KeyRound className="text-primary" /> License Control</div></div><div className="mb-7"><div className="mb-4 grid size-11 place-items-center rounded-md border bg-card"><LockKeyhole className="size-5" /></div><h2 className="text-2xl font-semibold">{mode === "signup" ? "Create administrator" : mode === "forgot" ? "Reset password" : "Welcome back"}</h2><p className="mt-2 text-sm text-muted-foreground">{mode === "signup" ? "The first verified account becomes the administrator." : mode === "forgot" ? "We’ll send a secure recovery link." : "Sign in to manage extension licenses."}</p></div>
      <form onSubmit={submit} className="space-y-4">{mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">Display name</Label><Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>}<div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>{mode !== "forgot" && <div className="space-y-1.5"><div className="flex justify-between"><Label htmlFor="password">Password</Label>{mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>}</div><Input id="password" type="password" minLength={8} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>}{message && <p className="rounded-md border bg-muted p-3 text-sm">{message}</p>}<Button className="w-full" disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}{mode === "signup" ? "Create account" : mode === "forgot" ? "Send recovery link" : "Sign in"}</Button></form>
      {mode !== "forgot" && <><div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div><Button variant="outline" className="w-full" onClick={google} disabled={busy}>Continue with Google</Button></>}
      <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "signin" ? "Setting up this system?" : "Already have access?"} <button className="font-medium text-foreground hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create the first account" : "Sign in"}</button></p>
    </div></section>
  </main>;
}