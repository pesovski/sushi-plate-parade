import { describe, expect, it } from "vitest";
import { confirmationData, confirmationKey } from "@/lib/order-confirmation";

describe("Order confirmation", () => {
  const order = { id: "order-1", status: "paid", currency: "usd", total_cents: 1100, items: [{ id: "salmon", name: "Salmon nigiri", quantity: 1, unit_price_cents: 420 }, { id: "tuna", name: "Tuna nigiri", quantity: 1, unit_price_cents: 680 }] };
  it("includes the ordered dishes, quantities, prices and full total from the saved snapshot", () => {
    expect(confirmationData(order)).toEqual({ orderId: "order-1", currency: "usd", totalCents: 1100, items: order.items });
  });
  it("does not confirm an unpaid order", () => {
    expect(confirmationData({ ...order, status: "pending" })).toBeNull();
  });
  it("rejects inconsistent order totals", () => {
    expect(() => confirmationData({ ...order, total_cents: 1 })).toThrow();
  });
  it("uses the same delivery key for repeated verification of one order", () => {
    expect(confirmationKey("order-1")).toBe("order-confirmation-order-1");
    expect(confirmationKey("order-2")).not.toBe(confirmationKey("order-1"));
  });
});