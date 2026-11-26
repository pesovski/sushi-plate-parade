import { describe, expect, it } from "vitest";
import { isVerifiedPayment, priceCart, stripeCartLine } from "@/lib/checkout-model";

describe("Cart-total checkout", () => {
  const products = [{ id: "salmon", name: "Salmon nigiri", price_cents: 420 }, { id: "tuna", name: "Tuna nigiri", price_cents: 680 }];
  it("calculates the full total from trusted catalog prices, not client amounts", () => {
    expect(priceCart([{ id: "salmon", quantity: 2, price: 1 }, { id: "tuna", quantity: 1 }], products).total).toBe(1520);
  });
  it("sends Stripe only one generic total without dish information", () => {
    expect(stripeCartLine(1520)).toEqual({ quantity: 1, price_data: { currency: "usd", unit_amount: 1520, product_data: { name: "Sushi Conveyor order" } } });
  });
  it("rejects dish IDs absent from the Cloud catalog", () => {
    expect(() => priceCart([{ id: "unavailable", quantity: 1 }], products)).toThrow();
  });
  it("does not mark an unpaid or mismatched payment as paid", () => {
    const order = { total_cents: 1520, currency: "usd", user_id: "user-1" };
    const session = { payment_status: "paid", amount_total: 1520, currency: "usd", client_reference_id: "user-1" };
    expect(isVerifiedPayment(session, order)).toBe(true);
    expect(isVerifiedPayment({ ...session, payment_status: "unpaid" }, order)).toBe(false);
    expect(isVerifiedPayment({ ...session, amount_total: 1 }, order)).toBe(false);
    expect(isVerifiedPayment({ ...session, client_reference_id: "user-2" }, order)).toBe(false);
  });
});