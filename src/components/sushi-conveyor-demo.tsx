"use client";

import * as React from "react";
import { ArrowDown, ArrowUpRight, Check, CirclePlus, Minus, ShoppingBag, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SushiConveyorMenu, { type ConveyorDish } from "@/components/ui/sushi-conveyor-menu";
import { toConveyorDish } from "@/lib/sushi-menu";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { catalogOptions } from "@/lib/catalog-query";
import { createCheckout } from "@/lib/checkout.functions";
import { PaymentResult } from "@/components/payment-result";
import { AccountDialog } from "@/components/account-dialog";
import { AdminOrdersLink } from "@/components/admin-orders-link";
import { useAccount } from "@/components/account-provider";
import logoAsset from "@/assets/restorani-logo-wide.png.asset.json";
import { MenuAssistant } from "@/components/menu-assistant";
import { InstallPrompt } from "@/components/install-prompt";
import { OrderAlerts } from "@/components/order-alerts";
import { assistantCartSchema } from "@/lib/menu-assistant-model";

export default function SushiConveyorMenuDemo({ autoplay = true, payment, sessionId }: { autoplay?: boolean; payment?: "success" | "cancelled" | undefined; sessionId?: string | undefined }) {
  const { user } = useAccount();
  const { data: catalog } = useSuspenseQuery(catalogOptions);
  const dishes = React.useMemo(() => catalog.map(toConveyorDish), [catalog]);
  const checkout = useServerFn(createCheckout);
  const [checkoutBusy, setCheckoutBusy] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState("");
  const attempt = React.useRef<string | null>(null);
  const [order, setOrder] = React.useState<ConveyorDish[]>([]);
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [restored, setRestored] = React.useState(false);
  React.useEffect(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem("sushi-cart") ?? "[]");
      if (Array.isArray(stored)) setOrder(stored.slice(0, 100).flatMap((id: unknown) => { const dish = dishes.find((entry) => entry.id === id); return dish ? [dish] : []; }));
    } catch { /* An invalid navigation draft is discarded. */ }
    setRestored(true);
  }, [dishes]);
  React.useEffect(() => {
    if (restored) { try { sessionStorage.setItem("sushi-cart", JSON.stringify(order.map((item) => item.id))); } catch { /* Cart still works in memory. */ } }
    attempt.current = null;
  }, [order, restored]);
  const clearPaidCart = React.useCallback(() => setOrder([]), []);
  const pay = async () => {
    if (!user || checkoutBusy || !order.length) return;
    setCheckoutBusy(true); setCheckoutError("");
    // Open synchronously so the payment tab is not blocked after the server call.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const quantities = new Map<string, number>();
      for (const item of order) quantities.set(item.id, (quantities.get(item.id) ?? 0) + 1);
      attempt.current ??= crypto.randomUUID();
      const result = await checkout({ data: { items: [...quantities].map(([id, quantity]) => ({ id, quantity })), attempt: attempt.current } });
      if (tab) tab.location.href = result.url;
      else window.location.assign(result.url);
    } catch (cause) {
      tab?.close();
      setCheckoutError(cause instanceof Error ? cause.message : "Checkout failed. Please try again.");
      attempt.current = null;
    } finally { setCheckoutBusy(false); }
  };
  const [flash, setFlash] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const timer = React.useRef(0);
  const menuRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = (item: ConveyorDish) => {
    setOrder((previous) => [...previous, item]);
    setFlash(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(false), 2400);
  };
  const revealMenu = () => {
    setShowMenu(true);
    window.setTimeout(() => menuRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }), 50);
  };
  const total = order.reduce((sum, item) => sum + Number(item.price.slice(1)), 0);
  const assistantCart = dishes.flatMap((dish) => {
    const quantity = order.filter((item) => item.id === dish.id).length;
    return quantity ? [{ id: dish.id, quantity }] : [];
  });

  return (
    <div data-sushi-demo className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 border-b px-4 py-6 sm:px-6 md:px-10">
        <img src={logoAsset.url} alt="Restorani.bar" width={1902} height={610} className="w-40 min-w-0 shrink object-contain sm:w-56" />
        <div className="flex items-center gap-1 sm:gap-3">
          <MenuAssistant cart={assistantCart} total={total} onReview={() => setOrderOpen(true)} onCartChange={(cart) => {
            const result = assistantCartSchema.safeParse(cart);
            if (!result.success || result.data.some((item) => !dishes.some((dish) => dish.id === item.id))) return;
            setOrder(result.data.flatMap(({ id, quantity }) => {
              const dish = dishes.find((item) => item.id === id);
              return dish ? Array.from({ length: quantity }, () => dish) : [];
            }));
          }} />
          <AccountDialog />
          <OrderAlerts />
          <AdminOrdersLink />
          <span aria-live="polite" className="hidden text-xs text-accent-foreground sm:block">{flash ? "Added to your order" : ""}</span>
          <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-order-count aria-label={`Your order: ${order.length} ${order.length === 1 ? "plate" : "plates"}`} className="rounded-full">
                <ShoppingBag aria-hidden="true" /><span className="hidden sm:inline">Your order</span><span data-order-total className="min-w-4 tabular-nums">{order.length}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85svh] overflow-y-auto">
              <DialogTitle>Your order</DialogTitle>
              <DialogDescription>{order.length ? `${order.length} ${order.length === 1 ? "plate" : "plates"} picked from the belt.` : "A little room for something delicious."}</DialogDescription>
              <div className="divide-y">
                {dishes.filter((dish) => order.some((item) => item.id === dish.id)).map((dish) => {
                  const quantity = order.filter((item) => item.id === dish.id).length;
                  return <div key={dish.id} className="flex items-center gap-3 py-3"><img src={dish.image} alt="" className="size-14 object-contain" /><div className="flex-1"><p className="text-sm font-medium">{dish.name}</p><p className="text-xs text-muted-foreground">{quantity} × {dish.price}</p></div><Button variant="ghost" size="icon" aria-label={`Remove one ${dish.name}`} title={`Remove one ${dish.name}`} onClick={() => setOrder((previous) => { const index = previous.findIndex((item) => item.id === dish.id); return previous.filter((_, i) => i !== index); })}><Minus /></Button></div>;
                })}
              </div>
              <div className="flex justify-between border-t pt-4 font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              {order.length > 0 && (!user ? <AccountDialog checkout /> : <Button onClick={() => void pay()} disabled={checkoutBusy}>{checkoutBusy ? "Opening secure checkout…" : `Pay $${total.toFixed(2)} with Stripe`}</Button>)}
              {checkoutError && <p role="alert" className="text-sm text-destructive">{checkoutError}</p>}
              <p className="text-xs text-muted-foreground">Secure payment through Stripe. Only your order total is shared.</p>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main>
        <PaymentResult {...(sessionId ? { sessionId } : {})} cancelled={payment === "cancelled"} onPaid={clearPaidCart} />
        <SushiConveyorMenu
          items={dishes}
          eyebrow="Kaiten · Lunch belt"
          heading="A little of everything."
          caption="Fresh nigiri, signature rolls, and a sweet finish. Every plate, made to be enjoyed."
          autoplay={autoplay}
          onAdd={add}
          action={<Button size="lg" className="rounded-full" onClick={revealMenu}>See full menu <ArrowUpRight /></Button>}
        />

        <section className="border-y bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-7 sm:grid-cols-3 md:px-10">
            <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-accent-foreground"><Utensils className="size-4" /></span><div><p className="text-sm font-medium">Made fresh, plate by plate</p><p className="mt-1 text-xs text-muted-foreground">Simple ingredients. Beautifully balanced.</p></div></div>
            <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-accent-foreground"><CirclePlus className="size-4" /></span><div><p className="text-sm font-medium">Small plates, more possibilities</p><p className="mt-1 text-xs text-muted-foreground">From $3.20. Find your next favorite.</p></div></div>
            <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-accent-foreground"><Check className="size-4" /></span><div><p className="text-sm font-medium">Something for every appetite</p><p className="mt-1 text-xs text-muted-foreground">From classic nigiri to matcha mochi.</p></div></div>
          </div>
        </section>

        <section ref={menuRef} className="mx-auto max-w-7xl scroll-mt-6 px-6 py-12 md:px-10">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs text-muted-foreground">FROM THE KITCHEN</p><h2 className="menu-title mt-2 text-3xl">Find your favorite plate.</h2></div><Button variant="ghost" onClick={() => setShowMenu((value) => !value)} aria-expanded={showMenu}> {showMenu ? "Close menu" : "All 8 plates"}<ArrowDown className={showMenu ? "rotate-180" : ""} /></Button></div>
          {showMenu && <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">{dishes.map((dish) => <article key={dish.id} className="menu-item border-b py-5"><img src={dish.image} alt={dish.name} className="menu-item-image mx-auto aspect-square w-40 object-contain" /><div className="mt-4 flex justify-between gap-3"><h3 className="text-sm font-semibold">{dish.name}</h3><span className="text-sm tabular-nums">{dish.price}</span></div><p className="mt-2 min-h-14 text-xs leading-relaxed text-muted-foreground">{dish.description}</p><Button variant="outline" className="mt-3 w-full" onClick={() => add(dish)}><CirclePlus />Add to order</Button></article>)}</div>}
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-t px-6 py-5 text-xs text-muted-foreground md:px-10"><span>Sushi conveyor</span><span>Kaiten · A fresh kind of lunch</span></footer>
      <InstallPrompt />
    </div>
  );
}