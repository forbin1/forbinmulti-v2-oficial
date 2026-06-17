import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { MapPin, Shield, Heart, Loader2, Search, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { computeLevel, type LevelExperienceInput } from "@/lib/professional-level";
import { LevelBadge } from "@/components/LevelBadge";

export const Route = createFileRoute("/profissionais-ativos")({
  head: () => ({
    meta: [
      { title: "Profissionais Ativos — FORBIN" },
      { name: "description", content: "Profissionais de segurança privada disponíveis." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    let { data: { session } } = await supabase.auth.getSession();

    const storageKeys = Object.keys(localStorage);
    const hasAuthToken = storageKeys.some(key => key.startsWith("sb-") && key.endsWith("-auth-token"));

    if (!session && hasAuthToken) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 40));
        const res = await supabase.auth.getSession();
        if (res.data.session) { session = res.data.session; break; }
      }
    }

    if (!session?.user) throw redirect({ to: "/login" });
  },
  component: ProfissionaisAtivos,
});

type Professional = {
  id: string;
  user_id: string;
  full_name: string;
  role: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  is_verified: boolean;
  specializations: string[] | null;
  courses: string[] | null;
  experience_years: number | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
};

function ProfissionaisAtivos() {
  const { isFavorite, toggle } = useFavorites();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [expByUser, setExpByUser] = useState<Record<string, LevelExperienceInput[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { isActive, loading: subLoading, role: userRole } = useSubscription();

  // Redirect expired / inactive users immediately
  useEffect(() => {
    if (!subLoading) {
      if (userRole !== "admin" && !isActive) {
        toast.error("Seu plano expirou ou está inativo. Renove sua assinatura para acessar esta página.");
        navigate({ to: "/minha-assinatura" });
      }
    }
  }, [isActive, subLoading, userRole, navigate]);

  const fetchProfessionals = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, role, city, state, bio, avatar_url, whatsapp, is_verified, specializations, courses, experience_years, subscription_status, subscription_plan, subscription_expires_at")
      .eq("subscription_status", "active")
      .ilike("subscription_plan", "%profissional%")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const now = new Date();
      const activeProfessionals = data.filter((p) => {
        if (!p.subscription_expires_at) return true;
        return new Date(p.subscription_expires_at) > now;
      });
      setProfessionals(activeProfessionals as Professional[]);

      // Busca experiências de todos os profissionais listados em uma única query
      const ids = activeProfessionals.map((p) => p.user_id);
      if (ids.length > 0) {
        const { data: exps } = await supabase
          .from("professional_experiences")
          .select("user_id, category, position")
          .in("user_id", ids);
        const map: Record<string, LevelExperienceInput[]> = {};
        exps?.forEach((e) => {
          (map[e.user_id] ??= []).push({ category: e.category, position: e.position });
        });
        setExpByUser(map);
      }
    } else if (error) {
      console.error("Erro ao carregar profissionais:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfessionals();

    // Realtime subscription — atualiza automaticamente quando perfis mudam
    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchProfessionals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = professionals.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q)
    );
  });

  // Only show professionals with status "Disponível" or no status set (exclude "Contratado", "Indisponível")
  const available = filtered.filter((p) => {
    const status = p.specializations?.[0] || "";
    return !status || status === "Disponível para propostas" || status === "Em treinamento";
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Talentos verificados</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Profissionais Ativos</h1>
            <p className="mt-2 text-muted-foreground">
              Conecte-se com profissionais de segurança privada disponíveis.
              {!loading && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  {available.length} online
                </span>
              )}
            </p>
          </div>

          {/* Busca */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, cargo, cidade..."
              className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {(loading || subLoading) && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !subLoading && available.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <Users className="h-12 w-12 opacity-30" />
          <p className="font-semibold">Nenhum profissional encontrado</p>
          <p className="text-sm">Tente outros termos de busca</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !subLoading && available.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((p) => {
            const initials = p.full_name
              ?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
            const fav = isFavorite(p.user_id, "professional");
            const locationStr = [p.city, p.state].filter(Boolean).join(", ");
            const status = p.specializations?.[0] || "Disponível para propostas";
            const level = computeLevel({
              courses: p.courses,
              experienceYears: p.experience_years,
              experiences: expByUser[p.user_id] || [],
            });

            return (
              <div
                key={p.id}
                className="group rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <Link to="/u/$handle" params={{ handle: p.user_id }} className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-amber-500 text-lg font-bold text-primary-foreground shadow-md">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.full_name} className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    {p.is_verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[8px] text-white shadow">✓</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold leading-tight group-hover:text-primary transition-colors">{p.full_name}</h3>
                      {level.tier !== "none" && <LevelBadge tier={level.tier} size="sm" showLabel={false} />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{p.role && !["professional", "company", "admin"].includes(p.role) ? p.role : "Profissional de Segurança"}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      status === "Disponível para propostas"
                        ? "bg-success/10 text-success"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {status}
                    </span>
                  </div>
                </Link>

                {locationStr && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {locationStr}
                  </div>
                )}

                {p.bio && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                    <Link to="/u/$handle" params={{ handle: p.user_id }}>
                      <Shield className="mr-1.5 h-4 w-4" /> Perfil
                    </Link>
                  </Button>
                  {p.whatsapp && (
                    <Button asChild size="sm" className="flex-1 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                      <a href={`https://wa.me/55${p.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        <WhatsAppIcon className="mr-1.5 h-4 w-4 text-white" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={`rounded-full ${fav ? "border-primary/40 text-primary" : ""}`}
                    onClick={() => {
                      toggle(p.user_id, "professional");
                      toast.success(fav ? "Removido dos favoritos" : "Salvo nos favoritos");
                    }}
                    aria-label="Favoritar"
                  >
                    <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
