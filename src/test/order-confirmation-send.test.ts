import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendOrderConfirmation } from "@/lib/order-confirmation.server";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

vi.mock("@/lib/email-templates/send-email", () => ({ sendTemplateEmail: vi.fn() }));

describe("Confirmation sending", () => {
  const order = { id: "order-1", status: "paid", currency: "usd", total_cents: 420, items: [{ id: "salmon", name: "Salmon nigiri", quantity: 1, unit_price_cents: 420 }] };
  beforeEach(() => vi.mocked(sendTemplateEmail).mockReset());
  it("sends the fixed confirmation to the order owner's verified address", async () => {
    vi.mocked(sendTemplateEmail).mockResolvedValue({ sent: true });
    await sendOrderConfirmation(order, "owner@example.com");
    expect(sendTemplateEmail).toHaveBeenCalledWith("order-confirmation", "owner@example.com", {
      templateData: { orderId: "order-1", items: order.items, totalCents: 420, currency: "usd" },
      idempotencyKey: "order-confirmation-order-1",
    });
  });
  it("never sends before payment is confirmed", async () => {
    await sendOrderConfirmation({ ...order, status: "pending" }, "owner@example.com");
    expect(sendTemplateEmail).not.toHaveBeenCalled();
  });
  it("accepts suppression without retrying the recipient", async () => {
    vi.mocked(sendTemplateEmail).mockResolvedValue({ sent: false, reason: "recipient_suppressed" });
    expect(await sendOrderConfirmation(order, "owner@example.com")).toEqual({ sent: false, reason: "recipient_suppressed" });
    expect(sendTemplateEmail).toHaveBeenCalledTimes(1);
  });
});