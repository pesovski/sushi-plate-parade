// Messaging only: no app-shell caching, navigation interception or offline mode.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const page = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (page) { await page.focus(); await page.navigate("/"); }
    else await self.clients.openWindow("/");
  })());
});
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();