import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Eye,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Globe,
  Phone,
  Mail,
  Building2,
  Star,
  Share2,
  Camera,
  Plus,
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil-empresa")({
  head: () => ({
    meta: [
      { title: "Meu Perfil Empresa — FORBIN" },
      { name: "description", content: "Gerencie o perfil público da sua empresa." },
    ],
  }),
  component: PerfilEmpresa,
});

function PerfilEmpresa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if company has username!
  useEffect(() => {
    if (company?.username) {
      navigate({
        to: "/perfil/$username",
        params: { username: company.username },
        replace: true
      });
    }
  }, [company, navigate]);

  // Simulated posts for "Publicações" tab
  const [posts, setPosts] = useState<any[]>([
    { id: 1, content: "Estamos expandindo nossas operações em segurança premium! Novas vagas disponíveis em breve.", date: "Hoje" },
    { id: 2, content: "Treinamento tático concluído com sucesso por nossa equipe corporativa.", date: "Há 3 dias" }
  ]);
  const [newPostContent, setNewPostContent] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch company details
      let { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (compErr) {
        console.warn("Erro RLS ao buscar perfil de empresa:", compErr);
      }

      if (!comp) {
        comp = {
          id: user.id,
          user_id: user.id,
          company_name: user.user_metadata?.company_name || "Minha Empresa",
          city: "Rio de Janeiro",
          state: "RJ",
          username: "empresa-" + user.id.slice(0, 6)
        };
      }
      
      setCompany(comp);

      if (comp) {
        // Fetch jobs for this company
        const { data: jobList, error: jobsErr } = await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", comp.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (jobsErr) throw jobsErr;
        setJobs(jobList || []);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar dados do perfil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!user) return;

    // Supabase Realtime Subscription for instant profile updates!
    const channel = supabase
      .channel("company-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "companies",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCompany(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, kind: "cover" | "avatar") => {
    if (!e.target.files || e.target.files.length === 0 || !company || !user) return;
    const file = e.target.files[0];
    
    try {
      toast.info(`Fazendo upload da ${kind === 'cover' ? 'capa' : 'foto de perfil'}...`);
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        if (kind === "avatar") {
          const { error } = await supabase
            .from("companies")
            .update({ logo_url: base64 })
            .eq("user_id", user.id);

          if (error) throw error;
          setCompany((prev: any) => ({ ...prev, logo_url: base64 }));
          toast.success("Foto de perfil atualizada com sucesso!");
        } else {
          const { error } = await supabase
            .from("companies")
            .update({ cover_url: base64 })
            .eq("user_id", user.id);

          if (error) throw error;
          setCompany((prev: any) => ({ ...prev, cover_url: base64 }));
          toast.success("Foto de capa atualizada com sucesso!");
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Erro ao atualizar foto: " + err.message);
    }
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    const newPost = {
      id: Date.now(),
      content: newPostContent,
      date: "Agora mesmo"
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    toast.success("Publicação enviada com sucesso!");
  };

  const handleShare = () => {
    const link = company?.username 
      ? `${window.location.origin}/perfil/${company.username}`
      : `${window.location.origin}/perfil-empresa`;
    navigator.clipboard.writeText(link);
    toast.success("Link do perfil copiado!", {
      description: `O link público de divulgação foi copiado.`
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const name = company?.company_name || user?.user_metadata?.company_name || "Minha Empresa";
  const avatar = company?.logo_url;
  const cnpj = company?.cnpj || "Não cadastrado";
  const website = company?.website || "Não cadastrado";
  const phone = company?.phone || "Não cadastrado";
  const city = company?.city || "Brasil";
  const state = company?.state || "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Capa */}
      <div className="relative mb-[-72px] h-44 overflow-hidden rounded-3xl border border-border/60 sm:h-56 bg-surface">
        {company?.cover_url ? (
          <img src={company.cover_url} alt="Capa" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-gold opacity-25" />
            <div className="absolute inset-0 bg-radial-gold" />
          </>
        )}
        <button onClick={() => coverInput.current?.click()} className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/80">
          <Camera className="h-4 w-4" /> Alterar Capa
        </button>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "cover")} />
      </div>

      {/* Header card da empresa */}
      <div className="relative rounded-3xl border border-border/60 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-gold font-display text-3xl font-extrabold text-primary-foreground shadow-gold sm:h-32 sm:w-32">
              {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover rounded-full" /> : name.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => avatarInput.current?.click()} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow hover:bg-primary/90">
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "avatar")} />
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
              {company?.description || "Nenhuma descrição informada."}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {city}{state ? `, ${state}` : ""}</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> CNPJ {cnpj}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> {website}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> {phone}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              <Link to="/empresa">
                <Plus className="mr-2 h-4 w-4" /> Nova vaga
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare} className="h-11 w-11 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sobre" className="mt-8">
        <TabsList className="w-full justify-start rounded-full bg-accent/40 p-1 max-w-md">
          <TabsTrigger value="sobre" className="flex-1 rounded-full py-2.5">Sobre</TabsTrigger>
          <TabsTrigger value="vagas" className="flex-1 rounded-full py-2.5">Vagas ({jobs.length})</TabsTrigger>
          <TabsTrigger value="posts" className="flex-1 rounded-full py-2.5">Publicações ({posts.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Sobre */}
        <TabsContent value="sobre" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold mb-4 font-semibold">Sobre a empresa</h2>
                <p className="leading-relaxed text-muted-foreground">
                  {company?.description || "Nenhuma descrição informada."}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Colaboradores</p>
                    <p className="mt-1 font-semibold">{company?.employee_count || "Não especificado"}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</p>
                    <p className="mt-1 font-semibold">{phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold mb-4 font-semibold">Endereço & Canais</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">{city}{state ? `, ${state}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">{website}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        {/* Tab 2: Vagas */}
        <TabsContent value="vagas" className="mt-6">
          {jobs.length === 0 ? (
            <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Nenhuma vaga ativa</p>
              <p className="text-muted-foreground text-sm">Esta empresa não tem vagas abertas no momento.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/50 hover:shadow-gold transition-all">
                  <h3 className="font-semibold text-lg">{j.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{name}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>📍 {j.city}, {j.state}</span>
                    <span>⏱ {j.modality}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {j.salary_min ? `R$ ${j.salary_min.toLocaleString("pt-BR")}` : "A combinar"}
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full mt-4 rounded-full">
                    <Link to="/vagas/$jobId" params={{ jobId: j.id }}>Ver detalhes</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Publicações */}
        <TabsContent value="posts" className="mt-6 space-y-6">
          {/* Create new post form */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 max-w-2xl">
            <h3 className="font-semibold mb-3">O que há de novo na sua empresa?</h3>
            <form onSubmit={handleAddPost} className="space-y-3">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Compartilhe novidades, projetos ou atualizações de contratações..."
                className="w-full min-h-[80px] rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground rounded-full px-5">
                  Publicar
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-4 max-w-2xl">
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
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  {p.content}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
