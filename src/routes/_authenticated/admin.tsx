import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountDialog } from "@/components/account-dialog";
import { useAccount } from "@/components/account-provider";
import { getAdminAccess, getAdminOrders, changeOrderFulfillment } from "@/lib/admin-orders.functions";
import { fulfillmentLabels, nextFulfillment, orderItemsSchema } from "@/lib/admin-orders-model";
import logo from "@/assets/restorani-logo-wide.png.asset.json";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Manage orders — restorani.bar" },
    { name: "description", content: "Admin order management for restorani.bar." },
    { property: "og:title", content: "Manage orders — restorani.bar" },
    { property: "og:description", content: "Review orders and manage acceptance and delivery." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminOrders,
});

function AdminOrders() {
  const { user } = useAccount();
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const queryClient = useQueryClient();
  const checkAccess = useServerFn(getAdminAccess);
  const read = useServerFn(getAdminOrders);
  const change = useServerFn(changeOrderFulfillment);
  const access = useQuery({ queryKey: ["admin-access", user?.id], queryFn: () => checkAccess(), enabled: !!user });
  const orders = useQuery({ queryKey: ["admin-orders", user?.id, page], queryFn: () => read({ data: { page } }), enabled: !!user && access.data === true });
  const mutation = useMutation({ mutationFn: (data: { orderId: string; status: "accepted" | "delivered" }) => change({ data }),
    onSuccess: async (_, input) => {
      setNotice(`Order ${input.orderId.slice(0, 8)} ${input.status}.`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-orders"] }), queryClient.invalidateQueries({ queryKey: ["my-orders"] })]);
    },
  });
  return <div className="min-h-svh bg-background text-foreground">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 border-b px-4 py-5 sm:px-8"><Link to="/" aria-label="Restorani.bar menu"><img src={logo.url} alt="Restorani.bar" width={1902} height={610} className="w-40 sm:w-56" /></Link><AccountDialog /></header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <Button asChild variant="link" className="px-0"><Link to="/"><ArrowLeft />Menu</Link></Button>
      <div className="mb-8 mt-4 flex items-center justify-between gap-4"><div><p className="text-xs text-muted-foreground">RESTORANI.BAR / KITCHEN</p><h1 className="menu-title mt-2 text-4xl">Orders</h1></div>{access.data && <Button variant="outline" size="icon" title="Refresh orders" aria-label="Refresh orders" disabled={orders.isFetching} onClick={() => void orders.refetch()}><RefreshCw className={orders.isFetching ? "animate-spin motion-reduce:animate-none" : ""} /></Button>}</div>
      {access.isPending ? <p role="status">Checking account access…</p> : access.isError ? <p role="alert">Could not check your access. <Button variant="link" onClick={() => void access.refetch()}>Try again</Button></p> : !access.data ? <p role="alert">Admin access is required to manage orders.</p> : <>
        {notice && <p role="status" className="mb-4 text-accent-foreground">{notice}</p>}
        {mutation.isError && <p role="alert" className="mb-4 text-destructive">{mutation.error.message}</p>}
        {orders.isPending ? <p role="status">Loading orders…</p> : orders.isError ? <p role="alert">Orders could not be loaded. <Button variant="link" onClick={() => void orders.refetch()}>Try again</Button></p> : <>
          <p className="mb-4 text-sm text-muted-foreground">{orders.data.count} orders · Newest first</p>
          {!orders.data.orders.length && <p>No orders yet.</p>}
          <div className="divide-y border-y">{orders.data.orders.map((order) => {
            const items = orderItemsSchema.safeParse(order.items);
            const next = nextFulfillment(order.status, order.fulfillment_status);
            const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency }).format(cents / 100);
            return <article key={order.id} aria-label={`Order ${order.id.slice(0, 8)}`} className="grid gap-5 py-6 md:grid-cols-[1fr_2fr_1fr]">
              <div><h2 className="font-semibold">Order {order.id.slice(0, 8)}</h2><p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p><p className="mt-2 break-all text-xs text-muted-foreground" title={order.user_id}>Customer {order.user_id.slice(0, 8)}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant={order.status === "paid" ? "secondary" : "outline"}>Payment: {order.status}</Badge><Badge variant={order.fulfillment_status === "delivered" ? "secondary" : "outline"}>{fulfillmentLabels[order.fulfillment_status] ?? order.fulfillment_status}</Badge></div></div>
              <div>{items.success ? <ul className="space-y-2">{items.data.map((item) => <li key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.name}</span><span className="shrink-0 tabular-nums">{money(item.quantity * item.unit_price_cents)}</span></li>)}</ul> : <p className="text-destructive">Order details unavailable.</p>}<div className="mt-4 flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{money(order.total_cents)}</span></div></div>
              <div className="flex flex-col items-start gap-2 md:items-end">{next && <Button disabled={mutation.isPending} onClick={() => { setNotice(""); mutation.mutate({ orderId: order.id, status: next }); }}>{next === "accepted" ? <Check /> : <Truck />}{mutation.isPending && mutation.variables?.orderId === order.id ? "Saving…" : next === "accepted" ? "Accept order" : "Mark delivered"}</Button>}{order.accepted_at && <p className="text-xs text-muted-foreground">Accepted {new Date(order.accepted_at).toLocaleString()}</p>}{order.delivered_at && <p className="text-xs text-muted-foreground">Delivered {new Date(order.delivered_at).toLocaleString()}</p>}</div>
            </article>;
          })}</div>
          <div className="mt-6 flex items-center justify-between gap-4"><Button variant="outline" disabled={page === 0 || orders.isFetching} onClick={() => setPage((value) => value - 1)}><ArrowLeft />Previous</Button><span className="text-sm">Page {page + 1} of {Math.max(1, Math.ceil(orders.data.count / 50))}</span><Button variant="outline" disabled={(page + 1) * 50 >= orders.data.count || orders.isFetching} onClick={() => setPage((value) => value + 1)}>Next<ArrowRight /></Button></div>
        </>}
      </>}
    </main>
  </div>;
}