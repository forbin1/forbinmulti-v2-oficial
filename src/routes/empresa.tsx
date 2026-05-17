import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Briefcase, Users, Store, DollarSign, Heart, Settings, ArrowLeft, Menu, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

export const Route = createFileRoute("/empresa")({
  component: EmpresaLayout,
});

const ITEMS = [
  { to: "/empresa", label: "Dashboard & Vagas", icon: Briefcase, exact: true },
  { to: "/empresa/candidatos", label: "Candidatos", icon: Users },
  { to: "/empresa/afiliados", label: "Marketplace de Cursos", icon: Store },
  { to: "/empresa/vendas", label: "Dashboard de Vendas", icon: DollarSign },
  { to: "/empresa/favoritos", label: "Favoritos", icon: Heart },
  { to: "/empresa/configuracoes", label: "Configurações", icon: Settings },
];

function EmpresaSidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.username) {
        setUsername(data.username);
      }
    })();
  }, [user]);

  return (
    <div className="flex h-full flex-col bg-card border-r border-border/60">
      <div className="flex h-20 items-center border-b border-border/60 px-6">
        <Logo />
      </div>

      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Painel Empresa</p>
          <p className="text-xs text-muted-foreground">Gestão e Vendas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-2">
        <Link
          to="/"
          className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à plataforma
        </Link>
        <Link
          to={username ? "/perfil/$username" : "/perfil-empresa"}
          params={username ? { username } : undefined}
          className="flex w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
        >
          <Building2 className="h-4 w-4" />
          Ver meu perfil
        </Link>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

function EmpresaLayout() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Dashboard routes under /empresa
  const dashboardRoutes = [
    "/empresa",
    "/empresa/candidatos",
    "/empresa/afiliados",
    "/empresa/vendas",
    "/empresa/favoritos",
    "/empresa/configuracoes"
  ];
  const isDashboard = dashboardRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  if (!isDashboard) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <EmpresaSidebarContents />
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/60 bg-card px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="text-sm font-semibold tracking-wide text-foreground">Painel Empresa</span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <EmpresaSidebarContents onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Nested Route Outlet wrapped in SubscriptionGuard */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-6 md:p-8">
          <SubscriptionGuard requiredRole="company" feature="acessar o painel da empresa">
            <Outlet />
          </SubscriptionGuard>
        </main>
      </div>
    </div>
  );
}
