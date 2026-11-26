import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAccount } from "@/components/account-provider";
import { getMyOrders } from "@/lib/orders.functions";
import { verifyCheckout } from "@/lib/checkout.functions";

export function AccountDialog({ checkout = false }: { checkout?: boolean }) {
  const { user, loading, signOut } = useAccount();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const readOrders = useServerFn(getMyOrders);
  const verify = useServerFn(verifyCheckout);
  const orders = useQuery({ queryKey: ["my-orders", user?.id], queryFn: async () => {
    const saved = await readOrders();
    const pending = saved.filter((order) => order.status === "pending" && order.stripe_session_id);
    if (pending.length) {
      await Promise.allSettled(pending.map((order) => order.stripe_session_id ? verify({ data: { sessionId: order.stripe_session_id } }) : Promise.resolve()));
      return readOrders();
    }
    return saved;
  }, enabled: open && !!user });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setMessage("Check your email for a password reset link.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (result.error) throw result.error;
        setPassword("");
        setMessage(result.data.session ? "Your account is ready." : "Check your email to confirm your account before signing in.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        setPassword(""); setMessage("You’re signed in.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const social = async (provider: "google" | "lovable") => {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed. Please try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant={checkout ? "default" : "ghost"} disabled={loading} className={checkout ? "w-full" : ""}><UserRound />{loading ? "Loading…" : user ? "My account" : checkout ? "Sign in to checkout" : "Sign in"}</Button></DialogTrigger>
    <DialogContent className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>{user ? "My account" : mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</DialogTitle>
      <DialogDescription>{user ? "Your sushi orders, in one place." : "Sign in before placing an order."}</DialogDescription>
      {user ? <>
        <p className="break-all text-sm">{user.email}</p>
        <h3 className="border-t pt-4 font-semibold">Your orders</h3>
        {orders.isPending ? <p className="text-sm text-muted-foreground">Loading your orders…</p> : orders.isError ? <div><p role="alert" className="text-sm text-destructive">Your orders could not be loaded.</p><Button variant="outline" onClick={() => void orders.refetch()}>Try again</Button></div> : orders.data?.length ? <ul className="divide-y">{orders.data.map((order) => <li key={order.id} className="flex justify-between gap-4 py-3"><div><p className="text-sm font-medium">Order {order.id.slice(0, 8)}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p></div><span className="text-sm">${(order.total_cents / 100).toFixed(2)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No orders yet.</p>}
        <Button variant="outline" onClick={async () => { try { await signOut(); setOpen(false); } catch { setError("Could not sign out. Please try again."); } }}><LogOut />Sign out</Button>
      </> : <>
        {mode !== "forgot" && <div className="grid gap-2">
          <Button variant="outline" className="google-signin" disabled={busy} onClick={() => void social("google")}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button>
          <Button variant="outline" disabled={busy} onClick={() => void social("lovable")}><LovableMark />Continue with Lovable</Button>
        </div>}
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <label className="grid gap-1 text-sm">Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode !== "forgot" && <label className="grid gap-1 text-sm">Password<Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          <Button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
        </form>
        <div className="flex flex-wrap justify-between gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setError(""); }}>{mode === "signup" ? "Already have an account?" : "Create account"}</Button><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setMessage(""); setError(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>
      </>}
      {message && <p role="status" className="text-sm text-accent-foreground">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent>
  </Dialog>;
}