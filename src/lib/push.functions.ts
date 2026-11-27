import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pushDeviceSchema } from "./push-model";

export const registerPushDevice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(pushDeviceSchema).handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("register_push_device", { _token: data.token });
    if (error) throw new Error("Order alerts could not be enabled. Please try again.");
    return { saved: true };
  });

export const removePushDevice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(pushDeviceSchema).handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_devices").delete().eq("token", data.token).eq("user_id", context.userId);
    if (error) throw new Error("Order alerts could not be disabled. Please try again.");
    return { saved: true };
  });