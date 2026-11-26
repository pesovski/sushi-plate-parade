import type { ConveyorDish, DishTier } from "@/components/ui/sushi-conveyor-menu";

export function toConveyorDish(row: { id: string; name: string; description: string; price_cents: number; tier: number; image: string; details: string[] }): ConveyorDish {
  const tier: DishTier = row.tier === 2 ? 2 : row.tier === 3 ? 3 : row.tier === 4 ? 4 : row.tier === 5 ? 5 : 1;
  return { id: row.id, name: row.name, description: row.description, price: `$${(row.price_cents / 100).toFixed(2)}`, tier, image: row.image, details: row.details };
}

