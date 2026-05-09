import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Heart,
  ArrowLeft,
  Award,
  Briefcase,
  Camera,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { findProfileByHandle } from "@/data/profiles";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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

function PerfilUsuario() {
  const { handle } = Route.useParams();
  const navigate = useNavigate();
  const profile = findProfileByHandle(handle);
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();

  const [cover, setCover] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setCover(localStorage.getItem(COVER_KEY(profile.handle)));
    setAvatar(localStorage.getItem(AVATAR_KEY(profile.handle)));
  }, [profile]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Perfil não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O usuário @{handle} não existe.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/feed">Voltar ao feed</Link></Button>
      </div>
    );
  }

  // No mock, consideramos "dono" se o user logado tiver o handle no metadata.
  const isOwner =
    !!user && (user.user_metadata?.handle === profile.handle || user.email?.split("@")[0] === profile.handle);

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
      toast.success(kind === "cover" ? "Capa atualizada" : "Foto de perfil atualizada");
    };
    reader.readAsDataURL(file);
  };

  // Postos atendidos = vagas aprovadas pela empresa (mock por handle)
  const POSTOS_BY_HANDLE: Record<string, number> = {
    "carlos.silva": 23, "renata.oliveira": 11, "marcos.tavares": 34,
    "julia.santos": 17, "pedro.almeida": 8, "ana.costa": 41, "carlos.mendes": 30,
  };
  const postos = POSTOS_BY_HANDLE[profile.handle] ?? 0;
  const cursos = 5;
  const anos = 8;

  return (
    <div className="pb-12">
      {/* COVER */}
      <div className="relative h-40 overflow-hidden border-b border-border/60 sm:h-56">
        {cover ? (
          <img src={cover} alt="Capa" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-gold opacity-30" />
            <div className="absolute inset-0 bg-radial-gold" />
          </>
        )}
        <button
          onClick={() => navigate({ to: "/feed" })}
          className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-background"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {isOwner && (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-4 top-4 rounded-full"
              onClick={() => coverInput.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" /> Trocar capa
            </Button>
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "cover")} />
          </>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 rounded-3xl border border-border/60 bg-card p-6 shadow-elevated sm:p-8">
          <div className="flex flex-wrap items-end gap-6">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-gold font-display text-4xl font-extrabold text-primary-foreground shadow-gold">
                {avatar ? <img src={avatar} alt={profile.name} className="h-full w-full object-cover" /> : profile.initials}
              </div>
              {isOwner && (
                <>
                  <button
                    onClick={() => avatarInput.current?.click()}
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow"
                    aria-label="Trocar foto"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => onPick(e, "avatar")} />
                </>
              )}
            </div>

            <div className="flex-1 min-w-[200px]">
              <div>
                {profile.kind === "company" ? (
                  <Badge className="rounded-full border-primary/40 bg-primary/15 text-primary"><Building2 className="mr-1 h-3.5 w-3.5" /> Empresa</Badge>
                ) : (
                  <Badge className="rounded-full border-success/40 bg-success/15 text-success"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verificado</Badge>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
              <p className="mt-1 text-sm font-medium text-primary">@{profile.handle}</p>
              <p className="mt-1 text-muted-foreground">{profile.role}</p>
              {profile.location && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {profile.location}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {profile.whatsapp && (
                <Button asChild className="h-12 rounded-full bg-[#25D366] px-6 font-semibold text-white hover:bg-[#1ebe5a]">
                  <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="mr-2 h-5 w-5 text-white" /> WhatsApp
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                className={`h-12 rounded-full ${fav ? "border-primary/40 text-primary" : ""}`}
                onClick={() => {
                  toggle(profile.id, profile.kind);
                  toast.success(fav ? "Removido dos favoritos" : "Adicionado aos favoritos");
                }}
              >
                <Heart className={`mr-2 h-5 w-5 ${fav ? "fill-primary text-primary" : ""}`} />
                {fav ? "Favorito" : "Salvar"}
              </Button>
            </div>
          </div>

          {profile.kind === "professional" && (
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border/60 pt-6">
              <Stat label="Cursos" value={String(cursos)} />
              <Stat label="Anos de experiência" value={String(anos)} />
              <Stat label="Postos atendidos" value={String(postos)} />
            </div>
          )}

          {profile.bio && <p className="mt-6 text-foreground/80">{profile.bio}</p>}
        </div>

        {profile.kind === "professional" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Cursos & certificações">
              <ul className="space-y-3">
                {["Formação de Vigilante", "Reciclagem 2024", "Vigilante Líder", "Operador de CFTV", "Defesa Pessoal"].map((c) => (
                  <li key={c} className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Experiências recentes">
              <div className="space-y-3">
                {[
                  { r: "Vigilante Sênior", c: "Vigilância Total", p: "2020 — Atual" },
                  { r: "Vigilante", c: "Águia Negra", p: "2017 — 2020" },
                ].map((e) => (
                  <div key={e.r} className="flex items-start gap-3">
                    <Briefcase className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{e.r}</p>
                      <p className="text-xs text-muted-foreground">{e.c} · {e.p}</p>
                    </div>
                  </div>
                ))}
              </div>
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
