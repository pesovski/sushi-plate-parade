import { z } from "zod";

export const pushDeviceSchema = z.object({ token: z.string().min(20).max(4096) });
export function acceptedOrderMessage(orderId: string) {
  return {
    notification: { title: "restorani.bar", body: `Your order ${orderId.slice(0, 8)} has been accepted.` },
    data: { path: "/", orderId },
    webpush: { notification: { icon: "/icon-192.png", tag: `order-accepted-${orderId}` } },
  };
}

export function isStalePushToken(status: number, body: string) {
  try {
    const result = JSON.parse(body) as { error?: { details?: { errorCode?: string }[] } };
    return (status === 404 || status === 400) && (result.error?.details ?? []).some(
      (detail) => detail.errorCode === "UNREGISTERED" || detail.errorCode === "INVALID_ARGUMENT",
    );
  } catch { return false; }
}