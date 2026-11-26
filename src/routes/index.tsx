import { createFileRoute } from "@tanstack/react-router";
import SushiConveyorMenuDemo from "@/components/sushi-conveyor-demo";
import { catalogOptions } from "@/lib/catalog-query";
import { z } from "zod";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  validateSearch: z.object({ payment: z.enum(["success", "cancelled"]).optional(), session_id: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(300).optional() }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogOptions),
  head: () => ({
    meta: [
      { title: "restorani.bar" },
      { name: "description", content: "Explore fresh nigiri, signature sushi rolls, and mochi. Sign in to order your favorite plates with secure Stripe checkout." },
      { property: "og:title", content: "restorani.bar" },
      { property: "og:description", content: "Fresh nigiri, signature rolls, and a sweet finish. Explore the sushi conveyor and pick your favorite plates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  const search = Route.useSearch();
  return <SushiConveyorMenuDemo payment={search.payment} sessionId={search.session_id} />;
}
