import { Bell, Menu, Search, LogOut, User, BookOpen, MapPin, Briefcase, Building2, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNotifications } from "@/hooks/use-notifications";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "@tanstack/react-router";
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
  { to: "/empresa", label: "Painel Empresa" },
  { to: "/vagas", label: "Vagas" },
  { to: "/profissionais-ativos", label: "Profissionais" },
  { to: "/feed", label: "Experiências" },
  { to: "/cursos", label: "Cursos" },
  { to: "/favoritos", label: "Favoritos" },
];

function NotificationsContent({ notifications, unreadCount, markRead, markAllRead }: any) {
  const notifIcons: Record<string, string> = { success: "✅", warning: "⚠️", error: "❌", info: "ℹ️" };
  
  return (
    <div className="flex flex-col h-full max-h-[450px]">
      <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3 shrink-0">
        <h4 className="font-display text-sm font-bold flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-primary" /> Notificações
          {unreadCount > 0 && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </h4>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold transition-all">
            Marcar todas como lido
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex items-start gap-2.5 rounded-xl p-2.5 cursor-pointer transition hover:bg-accent/40 border border-transparent ${!n.read ? "bg-primary/5 border-primary/10" : ""}`}
            >
              <span className="text-base shrink-0 mt-0.5">{notifIcons[n.type] ?? "ℹ️"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-snug ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                </p>
              </div>
              {!n.read && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
            </div>
          ))
        )}
      </div>
      
      <div className="border-t border-border/40 pt-2.5 mt-2.5 text-center shrink-0">
        <Link to="/minha-assinatura" className="text-xs text-primary hover:underline font-semibold block py-1">
          Ver todas em Minha Assinatura
        </Link>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [companyUsername, setCompanyUsername] = useState<string | null>(null);
  
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

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
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);

  useEffect(() => {
    async function loadSearchData() {
      const [{ data: jobsData }, { data: coursesData }] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, city, state, companies(company_name)")
          .eq("is_published", true),
        supabase
          .from("courses")
          .select("id, title")
          .eq("is_published", true)
      ]);
      if (jobsData) setDbJobs(jobsData);
      if (coursesData) setDbCourses(coursesData);
    }
    loadSearchData();
  }, []);
  
  const filteredJobs = searchQuery.trim() 
    ? dbJobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        job.companies?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3) 
    : [];

  const filteredCourses = searchQuery.trim() 
    ? dbCourses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3) 
    : [];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const isAdminUser = user?.email === "admin@gmail.com";

  const nav: NavItem[] = !user
    ? NAV_LOGGED_OUT
    : (role === "admin" || isAdminUser)
    ? NAV_ADMIN
    : role === "company"
    ? NAV_COMPANY
    : NAV_PROFESSIONAL;

  const dashboardLink =
    (role === "admin" || isAdminUser) ? "/admin" : role === "company" ? "/empresa" : "/profissional";
  const dashboardLabel =
    (role === "admin" || isAdminUser) ? "Painel Admin" : role === "company" ? "Painel Empresa" : "Meu Perfil";

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
                      {filteredJobs.map(job => {
                        const companyName = job.companies?.company_name || "Confidencial";
                        const initials = companyName.substring(0, 2).toUpperCase();
                        const location = job.city && job.state ? `${job.city}, ${job.state}` : "Remoto";
                        return (
                          <li key={job.id}>
                            <Link to="/vagas/$jobId" params={{ jobId: job.id }} className="block rounded-lg p-2 hover:bg-accent transition" onClick={() => setShowSearch(false)}>
                              <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-2">
                                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3"/> {initials}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {location}</span>
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {filteredCourses.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Cursos</h3>
                    <ul className="space-y-2">
                      {filteredCourses.map((course) => (
                        <li key={course.id}>
                          <Link to="/cursos/$courseId" params={{ courseId: course.id }} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition" onClick={() => setShowSearch(false)}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                               <BookOpen className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse shadow-gold">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-3xl border border-border/60 bg-card p-4 shadow-2xl backdrop-blur-xl z-50">
                  <NotificationsContent 
                    notifications={notifications} 
                    unreadCount={unreadCount} 
                    markRead={markRead} 
                    markAllRead={markAllRead} 
                  />
                </PopoverContent>
              </Popover>
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
                  {role === "admin" || isAdminUser ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4 text-primary" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/empresa" className="cursor-pointer">
                          <Building2 className="mr-2 h-4 w-4" />
                          Painel Empresa
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link 
                          to={companyUsername ? "/perfil/$username" : "/perfil-empresa"} 
                          params={companyUsername ? { username: companyUsername } : undefined} 
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to={dashboardLink} className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          {dashboardLabel}
                        </Link>
                      </DropdownMenuItem>
                      {role === "company" && (
                        <DropdownMenuItem asChild>
                          <Link 
                            to={companyUsername ? "/perfil/$username" : "/perfil-empresa"} 
                            params={companyUsername ? { username: companyUsername } : undefined} 
                            className="cursor-pointer"
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            Meu Perfil
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/minha-assinatura" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Minha Assinatura
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

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          {/* Mobile Notifications Button & Drawer */}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Abrir notificações"
                  className="rounded-full border border-border p-2 relative text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pulse shadow-gold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto p-4 bg-card border-l border-border/60">
                <div className="pt-6 h-full">
                  <NotificationsContent 
                    notifications={notifications} 
                    unreadCount={unreadCount} 
                    markRead={markRead} 
                    markAllRead={markAllRead} 
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Mobile Menu Button & Drawer */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
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
                  {user && (role === "admin" || isAdminUser) ? (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Painel Admin
                      </Link>
                      <Link
                        to="/empresa"
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Painel Empresa
                      </Link>
                      <Link
                        to={companyUsername ? "/perfil/$username" : "/perfil-empresa"}
                        params={companyUsername ? { username: companyUsername } : undefined}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        Meu Perfil
                      </Link>
                    </>
                  ) : (
                    <>
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
                          to={companyUsername ? "/perfil/$username" : "/perfil-empresa"}
                          params={companyUsername ? { username: companyUsername } : undefined}
                          onClick={() => setOpen(false)}
                          className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          Meu Perfil
                        </Link>
                      )}
                    </>
                  )}
                  {user && (
                    <Link
                      to="/minha-assinatura"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-3 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Minha Assinatura
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
      </div>
    </header>
  );
}
