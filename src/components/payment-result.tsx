import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "@/components/account-provider";
import { AccountDialog } from "@/components/account-dialog";
import { verifyCheckout } from "@/lib/checkout.functions";
import { Button } from "@/components/ui/button";

export function PaymentResult({ sessionId, cancelled, onPaid }: { sessionId?: string; cancelled: boolean; onPaid: () => void }) {
  const { user, loading } = useAccount();
  const verify = useServerFn(verifyCheckout);
  const client = useQueryClient();
  const result = useQuery({ queryKey: ["payment-result", sessionId, user?.id], queryFn: () => {
    if (!sessionId) throw new Error("No checkout reference provided.");
    return verify({ data: { sessionId } });
  }, enabled: !!sessionId && !!user, retry: false });
  const paid = result.data?.status === "paid";
  useEffect(() => { if (paid) { onPaid(); void client.invalidateQueries({ queryKey: ["my-orders"] }); } }, [paid, onPaid, client]);
  if (!sessionId && !cancelled) return null;
  return <section className="mx-auto max-w-7xl border-b px-6 py-5 md:px-10">
    {cancelled ? <p>Payment cancelled. Your cart is still here.</p> : loading ? <p>Checking your account…</p> : !user ? <><p className="mb-3">Sign in to see your payment confirmation.</p><AccountDialog /></> : result.isPending ? <p>Verifying your payment with Stripe…</p> : result.isError ? <><p role="alert" className="text-destructive">{result.error.message}</p><Button variant="outline" className="mt-3" onClick={() => void result.refetch()}>Check payment again</Button></> : <>
      <h2 className="font-semibold">{paid ? "Payment confirmed. Thank you!" : result.data?.status === "expired" ? "This checkout has expired." : "Your payment has not completed yet."}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Order {result.data?.id.slice(0,8)} · ${((result.data?.total_cents ?? 0) / 100).toFixed(2)}</p>
      {!paid && <Button variant="outline" className="mt-3" onClick={() => void result.refetch()}>Check payment again</Button>}
    </>}
  </section>;
}