import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/data/mock";
import { usePosts } from "@/hooks/use-posts";
import { ComposeBox, PostCard } from "./profissional";
import { ADS, AdBanner } from "@/components/AdBanner";
import { Fragment, useState, useEffect } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { computeLevel, type LevelTier, type LevelExperienceInput } from "@/lib/professional-level";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Experiências — FORBIN MultiEmpresas" },
      { name: "description", content: "Acompanhe experiências de profissionais e empresas do setor de segurança privada." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  return <FeedContent />;
}

function FeedContent() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "Membro FORBIN";
  const userRole = user?.user_metadata?.role || "Profissional";
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, city, state, salary_min, salary_max, banner_url, companies(company_name)")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(4);
        
        if (data && data.length > 0) {
          setTrendingJobs(data);
        } else {
          // Fallback to mock JOBS
          setTrendingJobs(JOBS.slice(0, 4).map((j, i) => ({
            id: j.id,
            title: j.title,
            city: j.location.split(",")[0],
            state: j.location.split(",")[1]?.trim() || "",
            salary_min: parseFloat(j.salary.replace(/[^0-9]/g, "")) || null,
            banner_url: [
              "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop",
              "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop",
              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
              "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop"
            ][i],
            companies: { company_name: j.company }
          })));
        }
      } catch (err) {
        console.error("Error fetching trending jobs:", err);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Esquerda */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Atalhos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/candidaturas" className="block rounded-lg px-3 py-2 hover:bg-accent">📋 Minhas candidaturas</Link></li>
              <li><Link to="/favoritos" className="block rounded-lg px-3 py-2 hover:bg-accent">⭐ Favoritos</Link></li>
              <li><Link to="/cursos" className="block rounded-lg px-3 py-2 hover:bg-accent">🏆 Cursos</Link></li>
            </ul>
          </div>
        </aside>

        {/* Centro — feed */}
        <div className="min-w-0 space-y-6 relative">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Experiências</h1>
          
          {user ? (
            <ComposeBox />
          ) : (
            <div className="rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm">
              <h3 className="font-display text-xl font-bold">Faça login para compartilhar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Junte-se à comunidade FORBIN para publicar suas experiências e interagir.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button asChild className="rounded-full bg-primary text-primary-foreground shadow-gold hover:bg-primary/90">
                  <Link to="/planos">Criar conta</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>
            </div>
          )}
          
          <FeedList />
        </div>

        {/* Direita — escondida no mobile/tablet */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Vagas em alta</h3>
            </div>
            <ul className="space-y-3">
              {trendingJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    to="/vagas/$jobId"
                    params={{ jobId: j.id }}
                    className="group block overflow-hidden rounded-xl border border-border/60 bg-surface transition hover:border-primary/50 hover:scale-[1.01] hover:shadow-lg"
                  >
                    <div className="relative h-20 w-full overflow-hidden">
                      {j.banner_url ? (
                        <img
                          src={j.banner_url}
                          alt={j.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-gold flex items-center justify-center text-xs text-primary-foreground font-bold tracking-widest uppercase">
                          FORBIN
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold leading-tight group-hover:text-primary transition line-clamp-1">{j.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{j.companies?.company_name || "Empresa"}</p>
                      <p className="mt-1 text-[10px] text-primary/95 font-medium">
                        {j.city}{j.state ? `, ${j.state}` : ""}
                        {j.salary_min ? ` · R$ ${j.salary_min.toLocaleString('pt-BR')}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </aside>
      </div>
    </div>
  );
}
function FeedList() {
  const { posts, loading, newPostsCount, refresh } = usePosts();
  const { user } = useAuth();
  const [levels, setLevels] = useState<Record<string, LevelTier>>({});

  useEffect(() => {
    const ids = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    if (ids.length === 0) return;
    (async () => {
      const [{ data: profs }, { data: exps }] = await Promise.all([
        supabase.from("profiles").select("user_id, courses, experience_years").in("user_id", ids),
        supabase.from("professional_experiences").select("user_id, category, position").in("user_id", ids),
      ]);
      const expByUser: Record<string, LevelExperienceInput[]> = {};
      exps?.forEach((e: any) => {
        (expByUser[e.user_id] ??= []).push({ category: e.category, position: e.position });
      });
      const map: Record<string, LevelTier> = {};
      profs?.forEach((pr: any) => {
        map[pr.user_id] = computeLevel({
          courses: pr.courses,
          experienceYears: pr.experience_years,
          experiences: expByUser[pr.user_id] || [],
        }).tier;
      });
      setLevels(map);
    })();
  }, [posts]);

  return (
    <div className="space-y-6">
      {newPostsCount > 0 && (
        <div className="sticky top-24 z-20 flex justify-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              refresh();
            }}
            className="h-10 rounded-full border border-primary/20 bg-card/80 px-6 py-2 text-sm font-bold shadow-2xl backdrop-blur-md hover:bg-primary hover:text-primary-foreground transition-all group"
          >
            <ArrowUp className="mr-2 h-4 w-4 group-hover:-translate-y-1 transition-transform" />
            {newPostsCount === 1 ? "Nova publicação" : `${newPostsCount} novas publicações`}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted/20" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-12 text-center">
          <p className="text-muted-foreground">Nenhuma experiência compartilhada ainda.</p>
        </div>
      ) : (
        posts.map((p, idx) => (
          <Fragment key={p.id}>
            <PostCard post={p} owned={user?.id === p.user_id} authorTier={levels[p.user_id]} />
            {(idx + 1) % 2 === 0 && (
              <AdBanner ad={ADS[Math.floor(idx / 2) % ADS.length]} />
            )}
          </Fragment>
        ))
      )}
    </div>
  );
}
