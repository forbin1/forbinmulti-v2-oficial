import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar, AdminMobileBar } from "@/components/admin/AdminSidebar";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — FORBIN" },
      { name: "description", content: "Painel administrativo da plataforma FORBIN." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return;
    }

    let { data: { session } } = await supabase.auth.getSession();
    
    // Check if there is an active session in local storage to prevent premature redirects on hard refresh
    const storageKeys = Object.keys(localStorage);
    const hasAuthToken = storageKeys.some(key => key.startsWith("sb-") && key.endsWith("-auth-token"));
    
    if (!session && hasAuthToken) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 40));
        const res = await supabase.auth.getSession();
        if (res.data.session) {
          session = res.data.session;
          break;
        }
      }
    }

    const user = session?.user ?? null;
    if (!user) throw redirect({ to: "/login" });
    if (user.email === "admin@gmail.com") return;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminMobileBar />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
