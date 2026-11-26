import { describe, expect, it } from "vitest";
import { requireOrderUser } from "@/lib/order-access";

describe("Signed-in orders only", () => {
  it("rejects visitors without a signed-in user", () => {
    expect(() => requireOrderUser(null)).toThrow("Sign in to place an order.");
  });
  it("uses the verified signed-in user identity", () => {
    expect(requireOrderUser("customer-123")).toBe("customer-123");
  });
});