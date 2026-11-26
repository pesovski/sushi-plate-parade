import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountDialog } from "@/components/account-dialog";
import { AdminOrdersLink } from "@/components/admin-orders-link";
import { Button } from "@/components/ui/button";
import logo from "@/assets/restorani-logo-wide.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Account — restorani.bar" },
    { name: "description", content: "Sign in to your restorani.bar account." },
    { property: "og:title", content: "Account — restorani.bar" },
    { property: "og:description", content: "Your restorani.bar account and orders." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-6"><img src={logo.url} width={1902} height={610} className="w-56" alt="Restorani.bar" /><h1 className="menu-title text-3xl">Your account</h1><AccountDialog /><AdminOrdersLink /><Button asChild variant="outline"><Link to="/">Back to menu</Link></Button></main>,
});