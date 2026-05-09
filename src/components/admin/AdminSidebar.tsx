import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Video,
  GraduationCap,
  Briefcase,
  Users,
  Sparkles,
  LayoutTemplate,
  CreditCard,
  Award,
  ArrowLeft,
  Shield,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const ITEMS: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/vsl", label: "VSL", icon: Video },
  { to: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/admin/vagas", label: "Vagas", icon: Briefcase },
  { to: "/admin/profissionais", label: "Profissionais", icon: Users },
  { to: "/admin/experiencias", label: "Experiências", icon: Sparkles },
  { to: "/admin/landing", label: "Landing Page", icon: LayoutTemplate },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/certificados", label: "Certificados", icon: Award },
];

function getReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const stored = window.sessionStorage.getItem("admin:returnTo");
  if (stored && !stored.startsWith("/admin") && stored !== "/login") return stored;
  return "/";
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    const to = getReturnPath();
    onNavigate?.();
    navigate({ to });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center border-b border-border/60 px-6">
        <Logo />
      </div>

      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Shield className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Admin</p>
          <p className="text-xs text-muted-foreground">Painel de controle</p>
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

      <div className="border-t border-border/60 p-3">
        <a
          href="#"
          onClick={handleBack}
          className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à plataforma
        </a>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card lg:block">
      <SidebarContents />
    </aside>
  );
}

export function AdminMobileBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Voltar à plataforma"
        onClick={() => navigate({ to: getReturnPath() })}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <span className="text-sm font-semibold tracking-wide text-foreground">Admin</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-l border-border/60 bg-card p-0">
          <SidebarContents onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
