export function requireOrderUser(userId: string | null | undefined): string {
  if (!userId) throw new Error("Sign in to place an order.");
  return userId;
}