import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, LogOut, User, BookOpen, MapPin, Briefcase, Building2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { JOBS, COURSES } from "@/data/mock";

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
  { to: "/favoritos", label: "Favoritos" },
];

const NAV_COMPANY: NavItem[] = [
  { to: "/empresa", label: "Painel Empresa" },
  { to: "/profissionais-ativos", label: "Profissionais" },
  { to: "/vagas", label: "Vagas" },
  { to: "/feed", label: "Experiências" },
  { to: "/favoritos", label: "Favoritos" },
];

const NAV_ADMIN: NavItem[] = [
  { to: "/admin", label: "Painel Admin" },
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
  const [profile, setProfile] = useState<any>(null);
  const [companyUsername, setCompanyUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const load = async () => {
        const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle();
        if (data) setProfile(data);

        if (role === "company") {
          const { data: comp } = await supabase.from("companies").select("username").eq("user_id", user.id).maybeSingle();
          if (comp?.username) {
            setCompanyUsername(comp.username);
          }
        }
      };
      load();

      const channel = supabase.channel(`profile-${user.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new);
        })
        .subscribe();

      let companyChannel: any = null;
      if (role === "company") {
        companyChannel = supabase.channel(`company-hdr-${user.id}`)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "companies", filter: `user_id=eq.${user.id}` }, (payload) => {
            setCompanyUsername(payload.new.username || null);
          })
          .subscribe();
      }

      return () => { 
        supabase.removeChannel(channel); 
        if (companyChannel) supabase.removeChannel(companyChannel);
      };
    }
  }, [user, role]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const filteredJobs = searchQuery.trim() ? JOBS.filter(job => job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.company.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3) : [];
  const filteredCourses = searchQuery.trim() ? COURSES.filter(course => course.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3) : [];

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
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="relative" onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setShowSearch(false);
            }
          }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar vagas, empresas, profissionais…"
              className="h-11 w-72 rounded-full border-border/70 bg-surface pl-10 text-sm focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
            />
            
            {/* Dropdown de Resultados */}
            {showSearch && searchQuery.trim() && (filteredJobs.length > 0 || filteredCourses.length > 0) && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-[400px] rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl z-50">
                {filteredJobs.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Vagas</h3>
                    <ul className="space-y-2">
                      {filteredJobs.map(job => (
                        <li key={job.id}>
                          <Link to="/vagas/$jobId" params={{ jobId: job.id }} className="block rounded-lg p-2 hover:bg-accent transition" onClick={() => setShowSearch(false)}>
                            <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-2">
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3"/> {job.companyInitials}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {job.location}</span>
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {filteredCourses.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Cursos</h3>
                    <ul className="space-y-2">
                      {filteredCourses.map((course, i) => (
                        <li key={i}>
                          <Link to="/cursos" className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition" onClick={() => setShowSearch(false)}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                               <BookOpen className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{course}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {!loading && user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full overflow-hidden p-0 h-10 w-10">
                    <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (profile?.full_name?.[0] || user.user_metadata?.full_name?.[0] || "U").toUpperCase()
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-gradient-gold">
                      {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.company_name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardLink} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {dashboardLabel}
                    </Link>
                  </DropdownMenuItem>
                  {role === "company" && (
                    <DropdownMenuItem asChild>
                      <Link 
                        to={companyUsername ? "/empresa/$username" : "/perfil-empresa"} 
                        params={companyUsername ? { username: companyUsername } : undefined} 
                        className="cursor-pointer"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                {user && role === "company" && (
                  <Link
                    to={companyUsername ? "/empresa/$username" : "/perfil-empresa"}
                    params={companyUsername ? { username: companyUsername } : undefined}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Meu Perfil
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
