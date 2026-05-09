import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MapPin, Building2, Shield } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { PROFILES } from "@/data/profiles";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — FORBIN" },
      { name: "description", content: "Profissionais e empresas salvos." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { items, toggle } = useFavorites();

  const saved = items
    .map((i) => PROFILES.find((p) => p.id === i.id && p.kind === i.kind))
    .filter(Boolean) as typeof PROFILES;

  const profissionais = saved.filter((p) => p.kind === "professional");
  const empresas = saved.filter((p) => p.kind === "company");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sua coleção</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Favoritos</h1>
        <p className="mt-2 text-muted-foreground">Profissionais e empresas que você salvou.</p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nenhum favorito ainda</p>
          <p className="text-sm text-muted-foreground">Toque no botão Salvar nos perfis para adicioná-los aqui.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {profissionais.length > 0 && (
            <Section title="Profissionais" icon={<Shield className="h-4 w-4" />}>
              <Grid items={profissionais} onRemove={toggle} />
            </Section>
          )}
          {empresas.length > 0 && (
            <Section title="Empresas" icon={<Building2 className="h-4 w-4" />}>
              <Grid items={empresas} onRemove={toggle} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-primary">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid({ items, onRemove }: { items: typeof PROFILES; onRemove: (id: string, k: "professional" | "company") => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div key={`${p.kind}-${p.id}`} className="rounded-2xl border border-border/60 bg-card p-6">
          <Link to="/u/$handle" params={{ handle: p.handle }} className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{p.initials}</div>
            <div>
              <h3 className="font-semibold leading-tight">{p.name}</h3>
              <p className="text-xs text-primary">@{p.handle}</p>
              <p className="text-xs text-muted-foreground">{p.role}</p>
            </div>
          </Link>
          {p.location && <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {p.location}</div>}
          <div className="mt-4 flex gap-2">
            {p.whatsapp && (
              <Button asChild size="sm" className="flex-1 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5a]">
                <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer"><WhatsAppIcon className="mr-1.5 h-4 w-4 text-white" /> WhatsApp</a>
              </Button>
            )}
            <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => onRemove(p.id, p.kind)}>
              <Heart className="mr-1.5 h-4 w-4 fill-primary text-primary" /> Remover
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
