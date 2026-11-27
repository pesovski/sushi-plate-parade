import { acceptedOrderMessage, isStalePushToken } from "./push-model";

// Only called after the authenticated admin role check and fulfillment write.
export async function notifyOrderAccepted(orderId: string): Promise<"sent" | "no-devices" | "already-attempted" | "failed"> {
  const key = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!key || !connectionKey) return "failed";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const claim = await supabaseAdmin.from("orders").update({ accepted_push_attempted_at: new Date().toISOString() })
    .eq("id", orderId).eq("status", "paid").eq("fulfillment_status", "accepted")
    .is("accepted_push_attempted_at", null).select("id,user_id").maybeSingle();
  if (claim.error) return "failed";
  if (!claim.data) return "already-attempted";
  const devices = await supabaseAdmin.from("push_devices").select("token").eq("user_id", claim.data.user_id);
  if (devices.error) return "failed";
  if (!devices.data.length) return "no-devices";
  let failed = false;
  for (const device of devices.data) {
    try {
      const response = await fetch("https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { token: device.token, ...acceptedOrderMessage(orderId) } }),
      });
      if (!response.ok) {
        const body = await response.text();
        // Do not log device tokens or provider bodies that may echo them.
        console.error("Order push failed", { status: response.status, orderId });
        if (isStalePushToken(response.status, body)) {
          await supabaseAdmin.from("push_devices").delete().eq("token", device.token).eq("user_id", claim.data.user_id);
        } else failed = true;
      }
    } catch { failed = true; console.error("Order push transport failed", { orderId }); }
  }
  return failed ? "failed" : "sent";
}