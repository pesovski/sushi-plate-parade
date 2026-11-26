import { describe, expect, it } from "vitest";
import { fulfillmentChangeSchema, nextFulfillment, requireAdmin } from "@/lib/admin-orders-model";

describe("Admin order rules", () => {
  it("rejects non-admins", () => { expect(() => requireAdmin(false)).toThrow("Admin access required."); });
  it("permits admins", () => { expect(() => requireAdmin(true)).not.toThrow(); });
  it("allows a paid order to be accepted", () => { expect(nextFulfillment("paid", "awaiting_acceptance")).toBe("accepted"); });
  it("allows an accepted order to be delivered", () => { expect(nextFulfillment("paid", "accepted")).toBe("delivered"); });
  it("does not change payment through fulfillment inputs", () => { expect(fulfillmentChangeSchema.safeParse({ orderId: "ce10eb82-97c3-4bba-9e25-e4d906a46133", status: "paid" }).success).toBe(false); });
  it("blocks fulfillment of unpaid orders", () => { expect(nextFulfillment("pending", "awaiting_acceptance")).toBeNull(); });
  it("does not move delivered orders backwards", () => { expect(nextFulfillment("paid", "delivered")).toBeNull(); });
});