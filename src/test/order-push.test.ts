import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptedOrderMessage, isStalePushToken } from "@/lib/push-model";

const mocks = vi.hoisted(() => ({ from: vi.fn(), fetch: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from } }));
import { notifyOrderAccepted } from "@/lib/push.server";

describe("Accepted order push", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    vi.stubEnv("FIREBASE_MESSAGING_API_KEY", "test-connection");
    vi.stubGlobal("fetch", mocks.fetch);
  });
  function setup(order: { id: string; user_id: string } | null) {
    const claim = { update: vi.fn(), eq: vi.fn(), is: vi.fn(), select: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }) };
    claim.update.mockReturnValue(claim); claim.eq.mockReturnValue(claim); claim.is.mockReturnValue(claim); claim.select.mockReturnValue(claim);
    const devices = { select: vi.fn(), eq: vi.fn().mockResolvedValue({ data: [{ token: "device-token-for-owner" }], error: null }) };
    devices.select.mockReturnValue(devices);
    mocks.from.mockImplementation((table: string) => table === "orders" ? claim : devices);
    return { claim, devices };
  }
  it("targets only the accepted paid order's authenticated owner devices", async () => {
    const { claim, devices } = setup({ id: "order-123", user_id: "owner-456" });
    mocks.fetch.mockResolvedValue(new Response("{}"));
    expect(await notifyOrderAccepted("order-123")).toBe("sent");
    expect(claim.eq).toHaveBeenCalledWith("status", "paid");
    expect(claim.eq).toHaveBeenCalledWith("fulfillment_status", "accepted");
    expect(claim.is).toHaveBeenCalledWith("accepted_push_attempted_at", null);
    expect(devices.eq).toHaveBeenCalledWith("user_id", "owner-456");
    const call = mocks.fetch.mock.calls[0];
    if (!call) throw new Error("No push request");
    expect(JSON.parse(call[1].body).message).toEqual({ token: "device-token-for-owner", ...acceptedOrderMessage("order-123") });
  });
  it("does not repeat a previously claimed notification", async () => {
    setup(null);
    expect(await notifyOrderAccepted("order-123")).toBe("already-attempted");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("reports delivery failure without reversing accepted status or replaying", async () => {
    const { claim } = setup({ id: "order-123", user_id: "owner-456" });
    mocks.fetch.mockRejectedValue(new Error("Network unavailable"));
    expect(await notifyOrderAccepted("order-123")).toBe("failed");
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(claim.update).toHaveBeenCalledTimes(1);
  });
  it("removes only explicitly stale device errors, not quota or authorization errors", () => {
    expect(isStalePushToken(404, JSON.stringify({ error: { details: [{ errorCode: "UNREGISTERED" }] } }))).toBe(true);
    expect(isStalePushToken(403, JSON.stringify({ error: { details: [{ errorCode: "PERMISSION_DENIED" }] } }))).toBe(false);
    expect(isStalePushToken(429, "quota")).toBe(false);
  });
});