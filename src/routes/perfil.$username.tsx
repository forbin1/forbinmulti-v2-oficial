import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ProfileHeader } from "@/components/ProfileHeader";

export const Route = createFileRoute("/perfil/$username")({
  head: ({ params }) => ({
    meta: [{ title: `${params.username} — FORBIN` }],
  }),
  component: EmpresaPublicProfile,
});

function EmpresaPublicProfile() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [posts] = useState<any[]>([
    { id: 1, content: "Estamos expandindo nossas operações em segurança premium! Novas vagas disponíveis em breve.", date: "Hoje" },
    { id: 2, content: "Valorizamos o treinamento constante da nossa equipe de vigilância patrimonial.", date: "Ontem" }
  ]);
  const [activeTab, setActiveTab] = useState<"about" | "jobs" | "posts">("about");
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Busca a empresa pelo username no client (com a sessão do usuário). Evita o erro de
  // RLS no SSR — a tabela companies só libera SELECT para usuários autenticados.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCompany(true);
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (active) {
        setCompany(data ?? null);
        setLoadingCompany(false);
      }
    })();
    return () => { active = false; };
  }, [username]);

  const isOwner = !!user && !!company && user.id === company.user_id;

  useEffect(() => {
    if (!company?.id) return;
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
  }, [company?.id]);

  // Realtime subscription if this is the owner
  useEffect(() => {
    if (!company?.id) return;
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
  }, [company?.id]);

  const handleShare = () => {
    const profileUrl = window.location.href;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link do perfil copiado!", {
      description: "O link público da empresa foi copiado."
    });
  };

  function resizeImageBase64(base64Str: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  }

  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);

  const handlePick = async (file: File, kind: "cover" | "avatar") => {
    try {
      setUploading(kind);
      toast.info("Processando e otimizando imagem...");
      const reader = new FileReader();
      reader.onload = async () => {
        let base64 = reader.result as string;
        try {
          base64 = kind === "avatar"
            ? await resizeImageBase64(base64, 256, 256)
            : await resizeImageBase64(base64, 1200, 600);
        } catch (resizeErr) {
          console.warn("Error resizing image, using original:", resizeErr);
        }

        const column = kind === "avatar" ? "logo_url" : "cover_url";
        const { error } = await supabase
          .from("companies")
          .update({ [column]: base64 })
          .eq("user_id", company.user_id);

        setUploading(null);
        if (error) {
          toast.error("Erro ao atualizar imagem: " + error.message);
          return;
        }
        setCompany((prev: any) => ({ ...prev, [column]: base64 }));
        toast.success(kind === "avatar" ? "Foto de perfil atualizada!" : "Foto de capa atualizada!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploading(null);
      toast.error("Erro ao atualizar imagem: " + err.message);
    }
  };

  if (loadingCompany) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Empresa não encontrada</h1>
        <p className="mt-2 text-muted-foreground">A empresa @{username} não existe ou não foi encontrada.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/feed">Voltar</Link></Button>
      </div>
    );
  }

  const name = company.company_name || "Empresa";
  const avatar = company.logo_url;
  const cnpj = company.cnpj || "Não cadastrado";
  const website = company.website || "Não cadastrado";
  const phone = company.phone || "Não cadastrado";
  const city = company.city || "Brasil";
  const state = company.state || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 bg-background text-foreground">
      {/* Cabeçalho da empresa */}
      <ProfileHeader
        name={name}
        initials={name.charAt(0).toUpperCase()}
        eyebrow="Empresa"
        avatarUrl={avatar}
        coverUrl={company.cover_url}
        verified
        verifiedLabel="Verificada FORBIN"
        whatsapp={phone !== "Não cadastrado" ? phone : null}
        isOwner={isOwner}
        uploading={uploading}
        onPickAvatar={(f) => handlePick(f, "avatar")}
        onPickCover={(f) => handlePick(f, "cover")}
        meta={[
          { icon: MapPin, text: `${city}${state ? `, ${state}` : ""}` },
          { icon: Building2, text: `CNPJ ${cnpj}` },
          ...(website !== "Não cadastrado" ? [{ icon: Globe, text: website }] : []),
          ...(phone !== "Não cadastrado" ? [{ icon: Phone, text: phone }] : []),
        ]}
        stats={[
          { label: "Vagas", value: String(jobs.length) },
          { label: "Colaboradores", value: company.employee_count ? String(company.employee_count) : "—" },
        ]}
        actions={
          <>
            {isOwner && (
              <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
                <Link to="/empresa">Painel da Empresa</Link>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleShare} className="h-11 w-11 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

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
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition hover:border-primary/50 hover:shadow-elevated"
                  >
                    {/* Banner */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={j.banner_url || "https://images.unsplash.com/photo-1541888086925-0c13d80b623b?q=80&w=600&auto=format&fit=crop"}
                        alt={j.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        {j.contract_type || "CLT"}
                      </span>
                      <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                        {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{j.modality || "Presencial"}</span>
                      <h3 className="font-display text-lg font-bold mt-1 text-foreground leading-snug line-clamp-2 group-hover:text-primary transition">{j.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
                      <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground mt-4">
                        <span>📍 {j.city}, {j.state}</span>
                        <span className="font-semibold text-primary">{(() => {
                          const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
                          if (j.salary_min && j.salary_max) return `${fmt(j.salary_min)} – ${fmt(j.salary_max)}`;
                          if (j.salary_min) return fmt(j.salary_min);
                          if (j.salary_max) return fmt(j.salary_max);
                          return "A combinar";
                        })()}</span>
                      </div>
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
