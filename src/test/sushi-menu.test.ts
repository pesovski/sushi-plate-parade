import { describe, expect, it } from "vitest";
import { toConveyorDish } from "@/lib/sushi-menu";

describe("Supplied sushi tier prices", () => {
  it.each([
    [1, "$3.20"], [2, "$4.20"], [3, "$5.40"], [4, "$6.80"], [5, "$8.50"],
  ] as const)("prices tier %s at %s", (tier, price) => {
    const cents = [320, 420, 540, 680, 850][tier - 1];
    if (cents === undefined) throw new Error("Missing tier fixture");
    const dish = toConveyorDish({ id: "dish", name: "Dish", description: "", price_cents: cents, tier, image: "", details: [] });
    expect(dish.price).toBe(price);
    expect(dish.tier).toBe(tier);
  });
});