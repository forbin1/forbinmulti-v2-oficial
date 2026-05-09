import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { MapPin, Shield, Heart } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES } from "@/data/profiles";
import { useFavorites } from "@/hooks/use-favorites";
import { toast } from "sonner";

export const Route = createFileRoute("/profissionais-ativos")({
  head: () => ({
    meta: [
      { title: "Profissionais Ativos — FORBIN" },
      { name: "description", content: "Profissionais de segurança privada disponíveis." },
    ],
  }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: ProfissionaisAtivos,
});

function ProfissionaisAtivos() {
  const { isFavorite, toggle } = useFavorites();
  const profissionais = PROFILES.filter((p) => p.kind === "professional");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Talentos verificados</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Profissionais Ativos</h1>
        <p className="mt-2 text-muted-foreground">Conecte-se com profissionais de segurança privada disponíveis.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {profissionais.map((p) => {
          const fav = isFavorite(p.id, "professional");
          return (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-6">
              <Link to="/u/$handle" params={{ handle: p.handle }} className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {p.initials}
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <p className="text-xs text-primary">@{p.handle}</p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                </div>
              </Link>
              {p.location && (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.location}
                </div>
              )}
              {p.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                  <Link to="/u/$handle" params={{ handle: p.handle }}>
                    <Shield className="mr-1.5 h-4 w-4" /> Perfil
                  </Link>
                </Button>
                {p.whatsapp && (
                  <Button asChild size="sm" className="flex-1 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                    <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer">
                      <WhatsAppIcon className="mr-1.5 h-4 w-4 text-white" /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className={`rounded-full ${fav ? "border-primary/40 text-primary" : ""}`}
                  onClick={() => {
                    toggle(p.id, "professional");
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
    </div>
  );
}
