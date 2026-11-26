import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";
import { useAccount } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { getAdminAccess } from "@/lib/admin-orders.functions";

export function AdminOrdersLink() {
  const { user } = useAccount();
  const check = useServerFn(getAdminAccess);
  const access = useQuery({ queryKey: ["admin-access", user?.id], queryFn: () => check(), enabled: !!user });
  if (!access.data || !user) return null;
  return <Button asChild variant="ghost" title="Manage orders"><Link to="/admin" aria-label="Manage orders"><ClipboardList /><span className="hidden sm:inline">Manage orders</span></Link></Button>;
}