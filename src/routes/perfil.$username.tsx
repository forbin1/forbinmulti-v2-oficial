import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Globe,
  Phone,
  ShieldCheck,
  Share2,
  Camera,
  Loader2,
  Calendar,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/perfil/$username")({
  loader: async ({ params }) => {
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("username", params.username)
      .maybeSingle();

    if (error || !company) {
      throw notFound();
    }
    return { company };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.company.company_name} — FORBIN` },
          { name: "description", content: loaderData.company.description || "" },
        ]
      : [],
  }),
  component: EmpresaPublicProfile,
});

function EmpresaPublicProfile() {
  const { company: initialCompany } = Route.useLoaderData();
  const { user, role } = useAuth();
  const [company, setCompany] = useState(initialCompany);
  const [jobs, setJobs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([
    { id: 1, content: "Estamos expandindo nossas operações em segurança premium! Novas vagas disponíveis em breve.", date: "Hoje" },
    { id: 2, content: "Valorizamos o treinamento constante da nossa equipe de vigilância patrimonial.", date: "Ontem" }
  ]);
  const [activeTab, setActiveTab] = useState<"about" | "jobs" | "posts">("about");
  const [loadingJobs, setLoadingJobs] = useState(true);

  const isOwner = user?.id === company.user_id;

  useEffect(() => {
    (async () => {
      try {
        setLoadingJobs(true);
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setJobs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingJobs(false);
      }
    })();
  }, [company.id]);

  // Realtime subscription if this is the owner
  useEffect(() => {
    const channel = supabase
      .channel(`company-public-${company.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "companies",
          filter: `id=eq.${company.id}`,
        },
        (payload) => {
          setCompany(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company.id]);

  const handleShare = () => {
    const profileUrl = window.location.href;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link do perfil copiado!", {
      description: "O link público da empresa foi copiado."
    });
  };

  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, kind: "cover" | "avatar") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      toast.info("Processando imagem...");
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        if (kind === "avatar") {
          const { error } = await supabase
            .from("companies")
            .update({ logo_url: base64 })
            .eq("user_id", company.user_id);

          if (error) throw error;
          setCompany((prev: any) => ({ ...prev, logo_url: base64 }));
          toast.success("Foto de perfil atualizada!");
        } else {
          const { error } = await supabase
            .from("companies")
            .update({ cover_url: base64 })
            .eq("user_id", company.user_id);

          if (error) throw error;
          setCompany((prev: any) => ({ ...prev, cover_url: base64 }));
          toast.success("Foto de capa updated!");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Erro ao atualizar imagem: " + err.message);
    }
  };

  const name = company.company_name || "Empresa";
  const avatar = company.logo_url;
  const cnpj = company.cnpj || "Não cadastrado";
  const website = company.website || "Não cadastrado";
  const phone = company.phone || "Não cadastrado";
  const city = company.city || "Brasil";
  const state = company.state || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 bg-background text-foreground">
      {/* Capa */}
      <div className="relative mb-[-72px] h-44 overflow-hidden rounded-3xl border border-border/60 sm:h-56 bg-surface">
        {company.cover_url ? (
          <img src={company.cover_url} alt="Capa" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-gold opacity-25" />
            <div className="absolute inset-0 bg-radial-gold" />
          </>
        )}
        {isOwner && (
          <>
            <button onClick={() => coverInput.current?.click()} className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/80">
              <Camera className="h-4 w-4" /> Alterar Capa
            </button>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "cover")} />
          </>
        )}
      </div>

      {/* Header card da empresa */}
      <div className="relative rounded-3xl border border-border/60 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-gold font-display text-3xl font-extrabold text-primary-foreground shadow-gold sm:h-32 sm:w-32">
              {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover rounded-full" /> : name.charAt(0).toUpperCase()}
            </div>
            {isOwner && (
              <>
                <button onClick={() => avatarInput.current?.click()} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "avatar")} />
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Empresa</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
              <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verificada FORBIN
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {company.description || "Nenhuma descrição informada."}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {city}{state ? `, ${state}` : ""}</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> CNPJ {cnpj}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> {website}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> {phone}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
                <Link to="/empresa">
                  Painel da Empresa
                </Link>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleShare} className="h-11 w-11 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="mt-10 flex gap-2 border-b border-border/60 pb-px">
        <button
          onClick={() => setActiveTab("about")}
          className={`border-b-2 px-6 py-3 font-display text-sm font-semibold transition ${
            activeTab === "about" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Sobre
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`border-b-2 px-6 py-3 font-display text-sm font-semibold transition ${
            activeTab === "jobs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Vagas ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`border-b-2 px-6 py-3 font-display text-sm font-semibold transition ${
            activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Publicações ({posts.length})
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {activeTab === "about" && (
          <>
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold mb-4">Sobre a empresa</h2>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {company.description || "Esta empresa ainda não preencheu a seção de biografia corporativa."}
                </p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6">
                <h3 className="font-display text-lg font-bold mb-4">Informações corporativas</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tamanho</p>
                    <p className="text-sm font-medium mt-0.5">{company.employee_count ? `${company.employee_count} colaboradores` : "Não especificado"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="text-sm font-medium mt-0.5">{city}{state ? `, ${state}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Canais</p>
                    <p className="text-sm font-medium mt-0.5">
                      {website !== "Não cadastrado" ? (
                        <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {website}
                        </a>
                      ) : "Nenhum link configurado"}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {activeTab === "jobs" && (
          <div className="lg:col-span-3">
            {loadingJobs ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-dashed border-border/60 bg-card/40">
                <Briefcase className="mx-auto h-10 w-10 text-muted-foreground opacity-60 mb-3" />
                <p className="text-muted-foreground">Nenhuma vaga ativa publicada no momento.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((j) => (
                  <Link
                    key={j.id}
                    to="/vagas/$jobId"
                    params={{ jobId: j.id }}
                    className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 transition hover:border-primary/40 hover:shadow-elevated"
                  >
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{j.modality || "Presencial"}</span>
                      <h3 className="font-display text-lg font-bold mt-1 text-foreground leading-snug line-clamp-2">{j.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{j.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
                      <span>{j.city}, {j.state}</span>
                      <span className="font-semibold text-foreground">{j.salary_min ? `R$ ${j.salary_min.toLocaleString("pt-BR")}` : "A combinar"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="lg:col-span-2 space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-primary-foreground overflow-hidden">
                    {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover rounded-full" /> : name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{name}</h4>
                    <p className="text-[10px] text-muted-foreground">{p.date}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{p.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
