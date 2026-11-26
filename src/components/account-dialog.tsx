import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/account-provider";
import { getMyOrders } from "@/lib/orders.functions";
import { verifyCheckout } from "@/lib/checkout.functions";
import { fulfillmentLabels } from "@/lib/admin-orders-model";

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
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant={checkout ? "default" : "ghost"} disabled={loading} className={checkout ? "w-full" : ""} aria-label={loading ? "Loading account" : user ? "My account" : checkout ? "Sign in to checkout" : "Sign in"} title={user ? "My account" : "Sign in"}><UserRound /><span className={checkout ? "" : "hidden sm:inline"}>{loading ? "Loading…" : user ? "My account" : checkout ? "Sign in to checkout" : "Sign in"}</span></Button></DialogTrigger>
    <DialogContent className="max-h-[85svh] overflow-y-auto">
      <DialogTitle>{user ? "My account" : mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</DialogTitle>
      <DialogDescription>{user ? "Your sushi orders, in one place." : "Sign in before placing an order."}</DialogDescription>
      {user ? <>
        <p className="break-all text-sm">{user.email}</p>
        <h3 className="border-t pt-4 font-semibold">Your orders</h3>
        {orders.isPending ? <p className="text-sm text-muted-foreground">Loading your orders…</p> : orders.isError ? <div><p role="alert" className="text-sm text-destructive">Your orders could not be loaded.</p><Button variant="outline" onClick={() => void orders.refetch()}>Try again</Button></div> : orders.data?.length ? <ul className="divide-y">{orders.data.map((order) => <li key={order.id} className="flex justify-between gap-4 py-3"><div><p className="text-sm font-medium">Order {order.id.slice(0, 8)}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p>{order.status === "paid" && <p className="text-xs text-accent-foreground">{fulfillmentLabels[order.fulfillment_status]}</p>}</div><span className="text-sm">${(order.total_cents / 100).toFixed(2)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No orders yet.</p>}
        <Button variant="outline" onClick={async () => { try { await signOut(); setOpen(false); } catch { setError("Could not sign out. Please try again."); } }}><LogOut />Sign out</Button>
      </> : <>
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