import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fulfillmentChangeSchema, requireAdmin } from "@/lib/admin-orders-model";

export const getAdminAccess = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error("Account access could not be checked.");
  return data === true;
});

export const getAdminOrders = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(0) }))
  .handler(async ({ data: input, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireAdmin(!role.error && role.data === true);
    const { data, error, count } = await context.supabase.from("orders")
      .select("id,user_id,created_at,status,currency,total_cents,items,fulfillment_status,accepted_at,delivered_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(input.page * 50, input.page * 50 + 49);
    if (error) throw new Error("Orders could not be loaded. Please try again.");
    return { orders: data, count: count ?? 0 };
  });

export const changeOrderFulfillment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(fulfillmentChangeSchema).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireAdmin(!role.error && role.data === true);
    const result = await context.supabase.rpc("set_order_fulfillment", { _order_id: data.orderId, _status: data.status });
    if (result.error) throw new Error("This order could not be updated. Refresh and check its payment and fulfillment status.");
    let push: string = "not-needed";
    if (data.status === "accepted") {
      try {
        const { notifyOrderAccepted } = await import("./push.server");
        push = await notifyOrderAccepted(data.orderId);
      } catch { push = "failed"; }
    }
    return { saved: true, push };
  });