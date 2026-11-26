import { describe, expect, it } from "vitest";
import { updateAssistantCart } from "@/lib/menu-assistant-model";

describe("Assistant menu ordering", () => {
  const products = [
    { id: "salmon-nigiri", name: "Salmon nigiri", price_cents: 420 },
    { id: "tuna-nigiri", name: "Tuna nigiri", price_cents: 680 },
  ];
  it("adds ordered plates with trusted menu pricing", () => {
    const result = updateAssistantCart([], [{ id: "salmon-nigiri", quantity: 2 }], products);
    expect(result.cart).toEqual([{ id: "salmon-nigiri", quantity: 2 }]);
    expect(result.totalCents).toBe(840);
  });
  it("preserves other dishes when changing one quantity", () => {
    const result = updateAssistantCart(
      [{ id: "tuna-nigiri", quantity: 1 }],
      [{ id: "salmon-nigiri", quantity: 2 }],
      products,
    );
    expect(result.totalCents).toBe(1520);
    expect(result.cart).toContainEqual({ id: "tuna-nigiri", quantity: 1 });
  });
  it("removes a requested dish without removing the rest of the cart", () => {
    expect(
      updateAssistantCart(
        [
          { id: "salmon-nigiri", quantity: 2 },
          { id: "tuna-nigiri", quantity: 1 },
        ],
        [{ id: "salmon-nigiri", quantity: 0 }],
        products,
      ).cart,
    ).toEqual([{ id: "tuna-nigiri", quantity: 1 }]);
  });
  it("rejects dishes outside the menu", () => {
    expect(() => updateAssistantCart([], [{ id: "pizza", quantity: 1 }], products)).toThrow();
  });
});
