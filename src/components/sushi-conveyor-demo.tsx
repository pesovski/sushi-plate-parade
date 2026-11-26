"use client";

import * as React from "react";
import { ArrowDown, ArrowUpRight, Check, CirclePlus, Minus, ShoppingBag, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SushiConveyorMenu, { type ConveyorDish } from "@/components/ui/sushi-conveyor-menu";
import { SUSHI_BELT_DISHES, SUSHI_BELT_LEGEND } from "@/lib/sushi-menu";

export { SUSHI_BELT_DISHES, SUSHI_BELT_LEGEND } from "@/lib/sushi-menu";

export default function SushiConveyorMenuDemo({ autoplay = true }: { autoplay?: boolean }) {
  const [order, setOrder] = React.useState<ConveyorDish[]>([]);
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

  return (
    <div data-sushi-demo className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Utensils className="size-5" aria-hidden="true" /></span>
          <div><p className="text-lg font-semibold">Sushi conveyor</p><p className="text-xs text-muted-foreground">Fresh plates. Good company.</p></div>
        </div>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="hidden text-xs text-accent-foreground sm:block">{flash ? "Added to your order" : ""}</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-order-count aria-label={`Your order: ${order.length} ${order.length === 1 ? "plate" : "plates"}`} className="rounded-full">
                <ShoppingBag aria-hidden="true" /><span className="hidden sm:inline">Your order</span><span data-order-total className="min-w-4 tabular-nums">{order.length}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85svh] overflow-y-auto">
              <DialogTitle>Your order</DialogTitle>
              <DialogDescription>{order.length ? `${order.length} ${order.length === 1 ? "plate" : "plates"} picked from the belt.` : "A little room for something delicious."}</DialogDescription>
              <div className="divide-y">
                {SUSHI_BELT_DISHES.filter((dish) => order.some((item) => item.id === dish.id)).map((dish) => {
                  const quantity = order.filter((item) => item.id === dish.id).length;
                  return <div key={dish.id} className="flex items-center gap-3 py-3"><img src={dish.image} alt="" className="size-14 object-contain" /><div className="flex-1"><p className="text-sm font-medium">{dish.name}</p><p className="text-xs text-muted-foreground">{quantity} × {dish.price}</p></div><Button variant="ghost" size="icon" aria-label={`Remove one ${dish.name}`} title={`Remove one ${dish.name}`} onClick={() => setOrder((previous) => { const index = previous.findIndex((item) => item.id === dish.id); return previous.filter((_, i) => i !== index); })}><Minus /></Button></div>;
                })}
              </div>
              <div className="flex justify-between border-t pt-4 font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              <p className="text-xs text-muted-foreground">Demo order · No payment is collected.</p>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main>
        <SushiConveyorMenu
          items={SUSHI_BELT_DISHES}
          legend={SUSHI_BELT_LEGEND}
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
          {showMenu && <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">{SUSHI_BELT_DISHES.map((dish) => <article key={dish.id} className="menu-item border-b py-5"><img src={dish.image} alt={dish.name} className="menu-item-image mx-auto aspect-square w-40 object-contain" /><div className="mt-4 flex justify-between gap-3"><h3 className="text-sm font-semibold">{dish.name}</h3><span className="text-sm tabular-nums">{dish.price}</span></div><p className="mt-2 min-h-14 text-xs leading-relaxed text-muted-foreground">{dish.description}</p><Button variant="outline" className="mt-3 w-full" onClick={() => add(dish)}><CirclePlus />Add to order</Button></article>)}</div>}
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-t px-6 py-5 text-xs text-muted-foreground md:px-10"><span>Sushi conveyor</span><span>Kaiten · A fresh kind of lunch</span></footer>
    </div>
  );
}