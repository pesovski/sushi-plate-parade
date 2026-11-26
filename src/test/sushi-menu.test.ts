import { describe, expect, it } from "vitest";
import { SUSHI_BELT_DISHES, SUSHI_BELT_LEGEND } from "@/lib/sushi-menu";

describe("Supplied sushi tier prices", () => {
  it.each([
    [1, "$3.20"], [2, "$4.20"], [3, "$5.40"], [4, "$6.80"], [5, "$8.50"],
  ] as const)("prices tier %s at %s", (tier, price) => {
    expect(SUSHI_BELT_LEGEND[tier]).toBe(price);
    const dishes = SUSHI_BELT_DISHES.filter((dish) => dish.tier === tier);
    expect(dishes.length).toBeGreaterThan(0);
    for (const dish of dishes) expect(dish.price).toBe(price);
  });
});