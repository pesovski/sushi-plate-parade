<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application structure
- Keep the reusable conveyor in `src/components/ui/sushi-conveyor-menu.tsx` and its demo composition separate so animation and consumer order state remain independent.
- Read the product catalog from Cloud through a public read-only server function and route-loader query; the conveyor adapter only formats those rows.
- Keep the cart in React state; completed orders belong in Cloud and must be created through an authenticated server function with server-owned catalog pricing.
- Use one root account provider for session events and private-cache cleanup; no profiles table is needed for login-only accounts.
- Private order reads use authenticated server functions and owner-scoped RLS; payment state is never writable by customers.
- Checkout validates Cloud prices and stores item snapshots before sending one aggregate Stripe line; verify the Stripe session owner, total, and currency on return and when reading pending orders, without webhooks.
- Keep only a temporary list of cart IDs in sessionStorage to survive OAuth navigation; never treat its contents as trusted prices or permissions.
