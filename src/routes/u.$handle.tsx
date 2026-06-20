import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Heart,
  ArrowLeft,
  Award,
  Camera,
  ShieldCheck,
  Building2,
  Loader2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { findProfileByHandle } from "@/data/profiles";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeLevel } from "@/lib/professional-level";
import { LevelBadge } from "@/components/LevelBadge";
import { ExperienceList, toMonthInput, type ExperienceDraft } from "@/components/ProfessionalExperiences";
import { ProfessionalInfo } from "@/components/ProfessionalInfo";
import { ProfileHeader } from "@/components/ProfileHeader";
import { LockedInfo } from "@/components/LockedInfo";
import { useSubscription } from "@/hooks/use-subscription";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.handle} — FORBIN` },
      { name: "description", content: `Perfil @${params.handle} na FORBIN.` },
    ],
  }),
  component: PerfilUsuario,
});

const COVER_KEY = (h: string) => `forbin:cover:${h}`;
const AVATAR_KEY = (h: string) => `forbin:avatar:${h}`;

/** Gera um @ amigável a partir do nome quando não há username escolhido. */
function slugifyHandle(name?: string | null): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
}

function PerfilUsuario() {
  const { handle } = Route.useParams();
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const { isActive } = useSubscription();

  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [cover, setCover] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mock = findProfileByHandle(handle);
    if (mock) {
      setProfile(mock);
      setCover(localStorage.getItem(COVER_KEY(mock.handle)) || null);
      setAvatar(localStorage.getItem(AVATAR_KEY(mock.handle)) || null);
      setLoading(false);
    } else {
      setLoading(true);
      (async () => {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);

          let data: any = null;
          if (isUuid) {
            ({ data } = await supabase.from("profiles").select("*").eq("user_id", handle).maybeSingle());
          } else {
            // tenta pelo @username escolhido, depois pelo nome
            ({ data } = await supabase.from("profiles").select("*").eq("username", handle).maybeSingle());
            if (!data) {
              ({ data } = await supabase.from("profiles").select("*").ilike("full_name", `%${handle}%`).maybeSingle());
            }
          }
          if (data) {
            const initials = data.full_name.split(" ").map((n: any) => n[0]).join("").slice(0, 2).toUpperCase();
            const sysRole = ["professional", "company", "admin"].includes(data.role);
            setProfile({
              id: data.user_id,
              handle: handle,
              username: data.username || null,
              name: data.full_name,
              role: data.role && !sysRole ? data.role : "Profissional de Segurança",
              kind: "professional",
              initials,
              location: data.city ? `${data.city}, ${data.state}` : undefined,
              whatsapp: data.phone || undefined,
              bio: data.bio || undefined,
              coursesCount: data.courses?.length || 0,
              courses: data.courses || [],
              experience_years: data.experience_years || 0,
              escolaridade: (data as any).escolaridade || null,
              has_cnv: (data as any).has_cnv ?? null,
              specializations: data.specializations || [],
              city: data.city || null,
              state: data.state || null,
              phone: data.phone || null,
              cnv_number: (data as any).cnv_number || null,
              has_cnh: (data as any).has_cnh ?? null,
              altura: (data as any).altura || null,
              peso: (data as any).peso || null,
              data_nascimento: (data as any).data_nascimento || null,
              estado_civil: (data as any).estado_civil || null,
              served_military: (data as any).served_military ?? null,
              disponibilidade_viagem: (data as any).disponibilidade_viagem ?? null,
            });
            setCover(data.cover_url || null);
            setAvatar(data.avatar_url || null);

            const { data: expData } = await supabase
              .from("professional_experiences")
              .select("*")
              .eq("user_id", data.user_id)
              .order("is_current", { ascending: false })
              .order("start_date", { ascending: false });
            if (expData) {
              setExperiences(
                expData.map((e) => ({
                  id: e.id,
                  company: e.company,
                  position: e.position,
                  category: e.category,
                  start_date: toMonthInput(e.start_date),
                  end_date: toMonthInput(e.end_date),
                  is_current: e.is_current,
                  description: e.description,
                })),
              );
            }
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Error loading db profile:", err);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [handle]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Perfil não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O usuário @{handle} não existe ou não foi encontrado.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/feed">Voltar ao feed</Link></Button>
      </div>
    );
  }

  // No mock ou banco, consideramos "dono" se o user logado for o mesmo do id/handle.
  const isOwner = !!user && (user.id === profile.id || user.user_metadata?.handle === profile.handle || user.email?.split("@")[0] === profile.handle);
  const isAdmin = user?.email === "admin@gmail.com";
  // Só vê informações e contato quem é o dono, admin, ou tem plano ativo (mensal/anual).
  const canView = isOwner || isAdmin || isActive;

  const fav = isFavorite(profile.id, profile.kind);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>, kind: "cover" | "avatar") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const key = kind === "cover" ? COVER_KEY(profile.handle) : AVATAR_KEY(profile.handle);
      localStorage.setItem(key, dataUrl);
      if (kind === "cover") setCover(dataUrl);
      else setAvatar(dataUrl);
      toast.success(kind === "cover" ? "Capa atualizada" : "Foto de perfil updated!");
    };
    reader.readAsDataURL(file);
  };

  // Stats dinâmicos do banco de dados
  const POSTOS_BY_HANDLE: Record<string, number> = {
    "carlos.silva": 23, "renata.oliveira": 11, "marcos.tavares": 34,
    "julia.santos": 17, "pedro.almeida": 8, "ana.costa": 41, "carlos.mendes": 30,
  };
  const postos = profile.specializations?.[1] || POSTOS_BY_HANDLE[profile.handle] || 0;
  const cursos = profile.coursesCount !== undefined ? profile.coursesCount : 5;
  const anos = profile.experience_years !== undefined ? profile.experience_years : 8;

  const level = computeLevel({
    courses: profile.courses,
    experienceYears: profile.experience_years,
    experiences,
  });

  return (
    <div className="pb-12">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
        <ProfileHeader
          name={profile.name}
          initials={profile.initials}
          eyebrow={profile.kind === "company" ? "Empresa" : "Profissional"}
          subtitle={profile.role}
          username={profile.username || (profile.kind === "professional" ? slugifyHandle(profile.name) : undefined)}
          avatarUrl={avatar}
          coverUrl={cover}
          levelTier={profile.kind === "professional" ? level.tier : undefined}
          whatsapp={profile.whatsapp}
          contactLocked={!canView}
          meta={profile.location ? [{ icon: MapPin, text: profile.location }] : []}
          stats={profile.kind === "professional" ? [
            { label: "Cursos", value: String(cursos) },
            { label: "Anos de exp.", value: String(anos) },
            { label: "Postos", value: String(postos) },
          ] : []}
          actions={
            <Button
              variant="outline"
              className={`h-11 rounded-full ${fav ? "border-primary/40 text-primary" : ""}`}
              onClick={() => {
                toggle(profile.id, profile.kind);
                toast.success(fav ? "Removido dos favoritos" : "Adicionado aos favoritos");
              }}
            >
              <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
              {fav ? "Favorito" : "Salvar"}
            </Button>
          }
        />

        {profile.bio && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h3 className="mb-2 font-display text-lg font-bold">Sobre</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {profile.kind === "professional" && (
          <div className="mt-6">
            <Card title="Informações do Profissional">
              {canView ? (
                <ProfessionalInfo
                  profile={{
                    full_name: profile.name,
                    city: profile.city,
                    state: profile.state,
                    role: profile.role,
                    experience_years: profile.experience_years,
                    escolaridade: profile.escolaridade,
                    estado_civil: profile.estado_civil,
                    altura: profile.altura,
                    peso: profile.peso,
                    data_nascimento: profile.data_nascimento,
                    has_cnv: profile.has_cnv,
                    cnv_number: profile.cnv_number,
                    has_cnh: profile.has_cnh,
                    served_military: profile.served_military,
                    disponibilidade_viagem: profile.disponibilidade_viagem,
                    phone: profile.phone,
                    whatsapp: profile.whatsapp,
                    specializations: profile.specializations,
                  }}
                />
              ) : (
                <LockedInfo message="Ative um plano (mensal ou anual) para ver os dados completos e o contato deste profissional." />
              )}
            </Card>
          </div>
        )}

        {profile.kind === "professional" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Cursos & certificações">
              {profile.courses && profile.courses.length > 0 ? (
                <ul className="space-y-3">
                  {profile.courses.map((c: string) => (
                    <li key={c} className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum curso cadastrado.</p>
              )}
            </Card>
            <Card title="Experiências profissionais">
              <ExperienceList items={experiences} emptyText="Nenhuma experiência cadastrada." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h3 className="mb-4 font-display text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}
