import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    role: null,
  });

  // Uma única busca de role por usuário (evita requisições e renders repetidos)
  const roleRequestFor = useRef<string | null>(null);
  const fetchRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    return data?.role ?? null;
  }, []);
  const loadRoleOnce = useCallback((user: User) => {
    if (roleRequestFor.current === user.id) return;
    roleRequestFor.current = user.id;
    if (user.email === "admin@gmail.com") {
      setState((prev) => (prev.role === "admin" ? prev : { ...prev, role: "admin" }));
      return;
    }
    fetchRole(user.id).then((fetchedRole) => {
      const finalRole = fetchedRole || user.user_metadata?.role || "professional";
      setState((prev) => (prev.role === finalRole ? prev : { ...prev, role: finalRole }));
    });
  }, [fetchRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        // Atualiza estado imediatamente — NÃO use await aqui (deadlock do Supabase)
        setState((prev) =>
          prev.user?.id === user?.id && prev.session?.access_token === session?.access_token && !prev.loading
            ? prev
            : { user, session, loading: false, role: user ? prev.role : null }
        );
        if (user) {
          // Check for pending company registration sync
          const pendingSync = localStorage.getItem(`pending_company_sync_${user.id}`);
          if (pendingSync) {
            try {
              const parsed = JSON.parse(pendingSync);
              supabase.from("companies").update(parsed).eq("user_id", user.id).then(({ error }) => {
                if (!error) {
                  localStorage.removeItem(`pending_company_sync_${user.id}`);
                  console.log("Successfully synced pending company profile!");
                } else {
                  console.error("Error syncing pending company:", error);
                }
              });
            } catch (e) {
              console.error("Error parsing pending company sync:", e);
            }
          }

          // Busca role de forma diferida (fire-and-forget), uma vez por usuário
          setTimeout(() => loadRoleOnce(user), 0);
        } else {
          roleRequestFor.current = null;
          setState((prev) => (prev.role === null ? prev : { ...prev, role: null }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState((prev) =>
        prev.user?.id === user?.id && !prev.loading ? prev : { user, session, loading: false, role: prev.role }
      );
      if (user) {
        // Check for pending company registration sync
        const pendingSync = localStorage.getItem(`pending_company_sync_${user.id}`);
        if (pendingSync) {
          try {
            const parsed = JSON.parse(pendingSync);
            supabase.from("companies").update(parsed).eq("user_id", user.id).then(({ error }) => {
              if (!error) {
                localStorage.removeItem(`pending_company_sync_${user.id}`);
                console.log("Successfully synced pending company profile on initial session!");
              }
            });
          } catch (e) {
            console.error(e);
          }
        }

        loadRoleOnce(user);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadRoleOnce]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    roleRequestFor.current = null;
    setState({ user: null, session: null, loading: false, role: null });
  }, []);

  const value = useMemo(() => ({ ...state, signOut }), [state, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
