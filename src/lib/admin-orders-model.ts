import { z } from "zod";

export const fulfillmentChangeSchema = z.object({ orderId: z.uuid(), status: z.enum(["accepted", "delivered"]) });
export const orderItemsSchema = z.array(z.object({ id: z.string(), name: z.string(), quantity: z.number().int().positive(), unit_price_cents: z.number().int().nonnegative() }));
export const fulfillmentLabels: Record<string, string> = { awaiting_acceptance: "Awaiting acceptance", accepted: "Accepted", delivered: "Delivered" };

export function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new Error("Admin access required.");
}

export function nextFulfillment(payment: string, fulfillment: string): "accepted" | "delivered" | null {
  if (payment !== "paid") return null;
  if (fulfillment === "awaiting_acceptance") return "accepted";
  if (fulfillment === "accepted") return "delivered";
  return null;
}