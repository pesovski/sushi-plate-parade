import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAccount } from "./account-provider";
import { getPushToken, pushClient } from "@/lib/push-client";
import { registerPushDevice, removePushDevice } from "@/lib/push.functions";

export function OrderAlerts() {
  const { user } = useAccount();
  const register = useServerFn(registerPushDevice);
  const remove = useServerFn(removePushDevice);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const token = useRef("");
  useEffect(() => {
    setEnabled(false); setNotice("");
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    if (!user || !("Notification" in window) || Notification.permission !== "granted" || window.top !== window.self) return;
    void (async () => {
      if (localStorage.getItem("order-alerts-enabled") !== "yes") return;
      const current = await getPushToken();
      if (!alive || !current) return;
      token.current = current;
      await register({ data: { token: current } });
      if (!alive) return;
      setEnabled(true);
      const client = await pushClient();
      if (alive && client) unsubscribe = client.sdk.onMessage(client.messaging, (message) => {
        setNotice(message.notification?.body ?? "Your order has been accepted."); setOpen(true);
      });
    })().catch(() => { if (alive) setNotice("Order alerts could not reconnect. Please enable them again."); });
    return () => { alive = false; unsubscribe?.(); };
  }, [user?.id, register, revision]);

  const toggle = async () => {
    setNotice("");
    if (!user) return;
    if (!("Notification" in window)) { setNotice("This browser does not support order alerts. On iPhone, add restorani.bar to your Home Screen first."); return; }
    if (window.top !== window.self) { setNotice("Open the app in its own tab or use restorani.bar to enable notifications."); return; }
    if (enabled) {
      setBusy(true);
      try {
        if (token.current) await remove({ data: { token: token.current } });
        const client = await pushClient();
        if (client) await client.sdk.deleteToken(client.messaging);
        localStorage.removeItem("order-alerts-enabled"); setEnabled(false);
        setRevision((value) => value + 1);
        setNotice("Order alerts are off on this device.");
      } catch (error) { setNotice(error instanceof Error ? error.message : "Order alerts could not be disabled."); }
      finally { setBusy(false); }
      return;
    }
    // Permission is requested directly from the customer's click, before any async SDK load.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setNotice("Notifications are blocked. Allow notifications in your browser’s site settings, then try again."); return; }
    setBusy(true);
    try {
      const current = await getPushToken();
      if (!current) throw new Error("No notification device was registered. Please try again.");
      await register({ data: { token: current } }); token.current = current;
      localStorage.setItem("order-alerts-enabled", "yes"); setEnabled(true);
      setRevision((value) => value + 1);
      setNotice("You’ll receive an alert when your order is accepted.");
    } catch { setNotice("This browser could not register notifications. Open restorani.bar in its own tab and allow notifications in site settings. On iPhone, use the Home Screen app."); }
    finally { setBusy(false); }
  };

  if (!user) return null;
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Order notifications" title="Order notifications"><Bell /></Button>
  </DialogTrigger><DialogContent><DialogTitle>Order notifications</DialogTitle>
    <DialogDescription>Get notified when the kitchen accepts your order.</DialogDescription>
    <Button disabled={busy} onClick={() => void toggle()}>{enabled ? <BellOff /> : <Bell />}{busy ? "Updating…" : enabled ? "Turn off alerts" : "Enable order alerts"}</Button>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </DialogContent></Dialog>;
}