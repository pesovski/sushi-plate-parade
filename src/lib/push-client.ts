// Browser-only Firebase imports are loaded on demand, never during SSR.
export async function pushClient() {
  const appId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"];
  const apiKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"];
  const projectId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"];
  const vapidKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"];
  const messagingSenderId = appId?.split(":")[1];
  if (!appId || !apiKey || !projectId || !vapidKey || !messagingSenderId) return null;
  const sdk = await import("firebase/messaging");
  if (!(await sdk.isSupported())) return null;
  const { getApps, initializeApp } = await import("firebase/app");
  const config = { appId, apiKey, projectId, messagingSenderId };
  const app = getApps().find((entry) => entry.name === "order-alerts") ?? initializeApp(config, "order-alerts");
  return { sdk, messaging: sdk.getMessaging(app), config, vapidKey };
}

export async function getPushToken() {
  const client = await pushClient();
  if (!client) throw new Error("Order alerts are not available on this browser or are not configured.");
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(client.config)}`, { scope: "/firebase-push/" });
  if (!registration.active) await new Promise<void>((resolve, reject) => {
    const worker = registration.installing ?? registration.waiting;
    if (!worker) { reject(new Error("Order alerts could not start.")); return; }
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
      if (worker.state === "redundant") reject(new Error("Order alerts could not start."));
    });
  });
  return client.sdk.getToken(client.messaging, { vapidKey: client.vapidKey, serviceWorkerRegistration: registration });
}