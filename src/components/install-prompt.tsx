import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Phones only: browsers that support a real install prompt get an Install
// button; the rest are shown the manual route. No caching or offline storage.
export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);
  const [show, setShow] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [manualRoute, setManualRoute] = React.useState<"ios" | "other">("other");
  const fired = React.useRef(false);

  React.useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || !window.matchMedia("(max-width: 640px)").matches) return;
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    setManualRoute(iOS ? "ios" : "other");
    const onAvailable = (event: Event) => {
      event.preventDefault();
      fired.current = true;
      setDeferred(event as InstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onAvailable);
    // Browsers that never fire their own prompt still need a way in.
    const timer = window.setTimeout(() => {
      if (!fired.current) setShow(true);
    }, 2500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onAvailable);
      window.clearTimeout(timer);
    };
  }, []);

  const install = async () => {
    const event = deferred;
    if (!event) return;
    setDeferred(null);
    await event.prompt();
    void event.userChoice.then(() => setShow(false));
  };

  if (!show || dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 sm:hidden" role="note">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download aria-hidden="true" className="size-4" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-snug">
          {deferred
            ? "Add restorani.bar to your home screen for one-tap ordering."
            : manualRoute === "ios"
              ? "Add restorani.bar to your home screen: tap Share, then Add to Home Screen."
              : "Add restorani.bar to your home screen: open your browser menu and tap Install app."}
        </p>
        {deferred && (
          <Button size="sm" className="shrink-0 rounded-full" onClick={() => void install()}>
            Install
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Dismiss install suggestion"
          className="size-8 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}
