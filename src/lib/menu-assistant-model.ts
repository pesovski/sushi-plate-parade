import { z } from "zod";

export const assistantCartSchema = z
  .array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(0).max(50) }))
  .max(50);
const textPart = z.object({ type: z.literal("text"), text: z.string().max(8000) });
const toolPart = z.object({
  type: z.literal("tool-cart"),
  callId: z.string(),
  name: z.enum(["update_cart", "review_cart"]),
  state: z.enum(["input-available", "output-available", "output-error"]),
  input: z.string().max(8000),
  output: z.string().max(8000),
});
export const assistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.union([textPart, toolPart])).max(30),
});
export const assistantRequestSchema = z.object({
  messages: z.array(assistantMessageSchema).min(1).max(100),
  cart: assistantCartSchema,
});
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type AssistantCart = z.infer<typeof assistantCartSchema>;
export type AssistantToolPart = z.infer<typeof toolPart>;
export const cartChangesSchema = z.object({ changes: assistantCartSchema });

export type AssistantEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; part: AssistantToolPart; cart?: AssistantCart }
  | { type: "done" }
  | { type: "error"; message: string };

export function updateAssistantCart(
  cart: AssistantCart,
  changes: AssistantCart,
  products: { id: string; name: string; price_cents: number }[],
) {
  const quantities = new Map(cart.map((item) => [item.id, item.quantity]));
  for (const item of assistantCartSchema.parse(changes)) {
    if (!products.some((product) => product.id === item.id))
      throw new Error("That dish is not on the current menu.");
    if (item.quantity === 0) quantities.delete(item.id);
    else quantities.set(item.id, item.quantity);
  }
  const items = [...quantities]
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => {
      const product = products.find((item) => item.id === id);
      if (!product) throw new Error("A dish is no longer available.");
      return { id, quantity, name: product.name, unitPriceCents: product.price_cents };
    });
  return {
    cart: items.map(({ id, quantity }) => ({ id, quantity })),
    items,
    totalCents: items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0),
  };
}
