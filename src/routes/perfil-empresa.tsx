import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  MoreVertical,
  CheckCircle2,
  Eye,
  MessageSquare,
  XCircle,
  ShieldCheck,
  MapPin,
  Globe,
  Phone,
  Mail,
  Building2,
  Award,
  Star,
  Linkedin,
  Instagram,
  Share2,
  Camera,
  ShoppingCart,
  Link as LinkIcon,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JOBS } from "@/data/mock";
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
  const [profile, setProfile] = useState<any>(null);
  
  // States for Affiliate System Mock
  const [affiliations, setAffiliations] = useState<Record<string, 'none' | 'pending' | 'approved'>>({
    "c1": "none", "c2": "approved", "c3": "pending"
  });

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, kind: "cover" | "avatar") => {
    // Simulated upload for now, ideally uploads to storage and updates profile
    toast.success(kind === "cover" ? "Capa atualizada!" : "Foto atualizada!");
  };

  const requestAffiliation = (id: string) => {
    setAffiliations(prev => ({ ...prev, [id]: 'pending' }));
    toast.success("Solicitação enviada para o Admin Master!");
  };

  const name = profile?.full_name || profile?.company_name || user?.user_metadata?.company_name || "Sua Empresa";
  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const handle = profile?.handle || "empresa";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Capa */}
      <div className="relative mb-[-72px] h-44 overflow-hidden rounded-3xl border border-border/60 sm:h-56">
        <div className="absolute inset-0 bg-gradient-gold opacity-25" />
        <div className="absolute inset-0 bg-radial-gold" />
      </div>

      {/* Header card da empresa */}
      <div className="relative rounded-3xl border border-border/60 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-gradient-gold font-display text-3xl font-extrabold text-primary-foreground shadow-gold sm:h-32 sm:w-32">
              {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
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
              <Badge className="rounded-full border-primary/40 bg-primary/10 text-primary">
                <Star className="mr-1 h-3.5 w-3.5" /> 4.8 · 142 avaliações
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Empresa de segurança patrimonial com 18 anos de mercado, atuando em São Paulo e Grande SP.
              Especializada em condomínios premium, eventos corporativos e escolta de valores.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> São Paulo, SP</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> CNPJ 12.345.678/0001-90</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> vigilanciatotal.com.br</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> (11) 4002-8922</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> rh@vigilanciatotal.com.br</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nova vaga
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Condomínios", "Eventos", "Escolta", "CFTV", "Portaria 24h"].map((s) => (
            <Badge key={s} variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Profile Details */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Sobre a empresa</h2>
              <Button variant="ghost" size="sm" className="rounded-full">Editar</Button>
            </div>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {profile?.bio || "Nenhuma descrição informada."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Fundação", profile?.founded || "Não informado"],
                ["Funcionários", profile?.employees || "Não informado"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border/60 bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                  <p className="mt-1 font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl font-bold">Endereço & redes</h2>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{profile?.city || "Localização não informada"}</span>
              </div>
              {profile?.website_url && (
                <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline" href={profile.website_url}>
                  <Globe className="h-5 w-5" /> {profile.website_url}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
