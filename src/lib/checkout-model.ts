import { z } from "zod";

export const cartSchema = z.array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(50) })).min(1).max(50);
export type CartItem = z.infer<typeof cartSchema>[number];
export type PricedProduct = { id: string; name: string; price_cents: number };

export function priceCart(input: unknown, products: PricedProduct[]) {
  const requested = cartSchema.parse(input);
  const quantities = new Map<string, number>();
  for (const item of requested) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  const items = [...quantities].map(([id, quantity]) => {
    const product = products.find((entry) => entry.id === id);
    if (!product || quantity > 50) throw new Error("A dish in your cart is unavailable. Please review your cart.");
    return { id, name: product.name, quantity, unit_price_cents: product.price_cents };
  });
  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Invalid order total.");
  return { items, total };
}

export function stripeCartLine(total: number) {
  return { quantity: 1, price_data: { currency: "usd", unit_amount: total, product_data: { name: "Sushi Conveyor order" } } };
}

export function isVerifiedPayment(session: { payment_status: string; amount_total: number | null; currency: string | null; client_reference_id: string | null }, order: { total_cents: number; currency: string; user_id: string }) {
  return session.payment_status === "paid" && session.amount_total === order.total_cents && session.currency === order.currency && session.client_reference_id === order.user_id;
}