import { z } from "zod";

const snapshotSchema = z.array(z.object({
  id: z.string(), name: z.string(), quantity: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
}));

export interface ConfirmationOrder {
  id: string;
  status: string;
  items: unknown;
  total_cents: number;
  currency: string;
}

export function confirmationData(order: ConfirmationOrder) {
  if (order.status !== "paid") return null;
  const items = snapshotSchema.parse(order.items);
  if (items.reduce((total, item) => total + item.quantity * item.unit_price_cents, 0) !== order.total_cents) {
    throw new Error("Order snapshot total does not match.");
  }
  return { orderId: order.id, items, totalCents: order.total_cents, currency: order.currency };
}

export function confirmationKey(orderId: string) {
  return `order-confirmation-${orderId}`;
}