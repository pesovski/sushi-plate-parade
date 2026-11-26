import { createFileRoute } from "@tanstack/react-router";
import SushiConveyorMenuDemo from "@/components/sushi-conveyor-demo";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sushi Conveyor — Fresh Plates & Signature Rolls" },
      { name: "description", content: "Explore fresh nigiri, signature sushi rolls, and mochi on an animated kaiten sushi conveyor. Pick your favorite plates and create a demo order." },
      { property: "og:title", content: "Sushi Conveyor — Fresh Plates & Signature Rolls" },
      { property: "og:description", content: "Fresh nigiri, signature rolls, and a sweet finish. Explore the sushi conveyor and pick your favorite plates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <SushiConveyorMenuDemo />;
}
