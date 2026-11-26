import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/menu-assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // This public endpoint exposes only the public menu and a draft cart, never
        // private orders or payment actions. Reject cross-origin browser callers.
        const origin = request.headers.get("Origin");
        if (!origin || origin !== new URL(request.url).origin)
          return Response.json({ error: "Forbidden" }, { status: 403 });
        if (!request.headers.get("Content-Type")?.includes("application/json"))
          return Response.json({ error: "Expected a menu message." }, { status: 415 });
        const { menuAssistantResponse } = await import("@/lib/menu-assistant.server");
        return menuAssistantResponse(request);
      },
    },
  },
});
