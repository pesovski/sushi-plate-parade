import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset Password — Sushi Conveyor" },
    { name: "description", content: "Securely reset your Sushi Conveyor account password." },
    { property: "og:title", content: "Reset Password — Sushi Conveyor" },
    { property: "og:description", content: "Reset your password to return to your sushi orders." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (recovery && session)) setReady(true);
    });
    if (recovery) void supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
    return () => subscription.unsubscribe();
  }, []);
  return <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-5 px-6">
    <h1 className="menu-title text-3xl">Reset your password</h1>
    {done ? <p role="status">Your password has been updated.</p> : ready ? <form className="grid gap-4" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setError("");
      try { const result = await supabase.auth.updateUser({ password }); if (result.error) throw result.error; setDone(true); setPassword(""); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
      finally { setBusy(false); }
    }}><label className="grid gap-2 text-sm">New password<Input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><Button disabled={busy} type="submit">{busy ? "Saving…" : "Save password"}</Button></form> : <p className="text-muted-foreground">Open the password reset link from your email. If it has expired, request a new one from Sign in.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button variant="outline" asChild><Link to="/">Back to sushi menu</Link></Button>
  </main>;
}