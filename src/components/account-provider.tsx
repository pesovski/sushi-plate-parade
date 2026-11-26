import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const AccountContext = createContext<{ user: User | null; loading: boolean; signOut: () => Promise<void> }>({ user: null, loading: true, signOut: async () => {} });

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    let transitioned = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "INITIAL_SESSION") { setUser(session?.user ?? null); setLoading(false); return; }
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      transitioned = true;
      setUser(session?.user ?? null);
      setLoading(false);
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (alive && !transitioned) { setUser(data.user); setLoading(false); }
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [queryClient, router]);
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await router.navigate({ to: "/", replace: true });
  };
  return <AccountContext.Provider value={{ user, loading, signOut }}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);