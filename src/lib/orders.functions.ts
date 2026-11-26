import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireOrderUser } from "@/lib/order-access";

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = requireOrderUser(context.userId);
    const { data, error } = await context.supabase.from("orders")
      .select("id,created_at,status,currency,total_cents,items,stripe_session_id,fulfillment_status")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error("Your orders could not be loaded. Please try again.");
    return data;
  });