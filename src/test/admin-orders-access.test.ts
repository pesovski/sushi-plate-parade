import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = { middleware: () => builder, inputValidator: () => builder, handler: (handler: unknown) => handler };
    return builder;
  },
}));

import { changeOrderFulfillment, getAdminOrders } from "@/lib/admin-orders.functions";

// Exercise the actual handlers with an authenticated customer whose trusted role read is false.
type Handler = (input: { data: unknown; context: { userId: string; supabase: { rpc: ReturnType<typeof vi.fn>; from: ReturnType<typeof vi.fn> } } }) => Promise<unknown>;

describe("Admin endpoint permissions", () => {
  it("does not read all orders for an authenticated non-admin", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const from = vi.fn();
    const handler = getAdminOrders as unknown as Handler;
    await expect(handler({ data: { page: 0 }, context: { userId: "customer", supabase: { rpc, from } } })).rejects.toThrow("Admin access required.");
    expect(from).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "customer", _role: "admin" });
  });
  it("does not update fulfillment for an authenticated non-admin", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const handler = changeOrderFulfillment as unknown as Handler;
    await expect(handler({ data: { orderId: "3e1aab92-22aa-4ecc-9bcf-35a3d1784a10", status: "delivered" }, context: { userId: "customer", supabase: { rpc, from: vi.fn() } } })).rejects.toThrow("Admin access required.");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalledWith("set_order_fulfillment", expect.anything());
  });
});