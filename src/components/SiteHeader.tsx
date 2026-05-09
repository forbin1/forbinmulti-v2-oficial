import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

type NavItem = { to: string; label: string };

const NAV_LOGGED_OUT: NavItem[] = [
  { to: "/", label: "Início" },
  { to: "/vagas", label: "Vagas" },
  { to: "/planos", label: "Planos" },
];

const NAV_PROFESSIONAL: NavItem[] = [
  { to: "/vagas", label: "Vagas" },
  { to: "/cursos", label: "Cursos" },
  { to: "/feed", label: "Experiências" },
  { to: "/certificados", label: "Certificados" },
  { to: "/candidaturas", label: "Candidaturas" },
  { to: "/revisor-curriculo", label: "Revisor CV" },
  { to: "/favoritos", label: "Favoritos" },
];

const NAV_COMPANY: NavItem[] = [
  { to: "/profissionais-ativos", label: "Profissionais" },
  { to: "/vagas", label: "Vagas" },
  { to: "/feed", label: "Experiências" },
  { to: "/revisor-curriculo", label: "Revisor CV" },
  { to: "/favoritos", label: "Favoritos" },
];

const NAV_ADMIN: NavItem[] = [
  { to: "/vagas", label: "Vagas" },
  { to: "/profissionais-ativos", label: "Profissionais" },
  { to: "/feed", label: "Experiências" },
  { to: "/cursos", label: "Cursos" },
  { to: "/favoritos", label: "Favoritos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const nav: NavItem[] = !user
    ? NAV_LOGGED_OUT
    : role === "admin"
    ? NAV_ADMIN
    : role === "company"
    ? NAV_COMPANY
    : NAV_PROFESSIONAL;

  const dashboardLink =
    role === "admin" ? "/admin" : role === "company" ? "/empresa" : "/profissional";
  const dashboardLabel =
    role === "admin" ? "Painel Admin" : role === "company" ? "Painel Empresa" : "Meu Perfil";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary bg-accent/60" }}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to={dashboardLink}
              activeProps={{ className: "text-primary bg-accent/60" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {dashboardLabel}
            </Link>
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar vagas, empresas, profissionais…"
              className="h-11 w-72 rounded-full border-border/70 bg-surface pl-10 text-sm"
            />
          </div>

          {!loading && user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                       user.user_metadata?.company_name?.[0]?.toUpperCase() ||
                       user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || user.user_metadata?.company_name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardLink} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {dashboardLabel}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !loading ? (
            <>
              <Button asChild variant="ghost" className="rounded-full text-sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-gold hover:bg-primary/90">
                <Link to="/planos">Cadastrar</Link>
              </Button>
            </>
          ) : null}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Abrir menu"
              className="ml-auto rounded-full border border-border p-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-border/60 px-6 py-5">
                <Logo />
              </div>
              <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
                {nav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                    activeProps={{ className: "text-primary bg-accent" }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <Link
                    to={dashboardLink}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {dashboardLabel}
                  </Link>
                )}
              </nav>
              <div className="border-t border-border/60 p-4">
                {user ? (
                  <Button onClick={handleSignOut} variant="outline" className="w-full rounded-full">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                      <Link to="/login">Entrar</Link>
                    </Button>
                    <Button asChild className="rounded-full bg-primary text-primary-foreground" onClick={() => setOpen(false)}>
                      <Link to="/planos">Cadastrar</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
