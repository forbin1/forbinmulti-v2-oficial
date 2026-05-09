import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { MapPin, ArrowLeft, Award } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profissionais-ativos/$id")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: PerfilProfissional,
});

const DB: Record<string, { name: string; role: string; location: string; initials: string; whatsapp: string; bio: string; experiences: { title: string; company: string; period: string; description: string }[] }> = {
  "1": { name: "Carlos Silva", role: "Vigilante CLT", location: "São Paulo, SP", initials: "CS", whatsapp: "5511999999999", bio: "Vigilante com 8 anos de experiência em condomínios premium e empresas multinacionais.", experiences: [
    { title: "Vigilante Sênior", company: "Vigilância Total LTDA", period: "2020 — Atual", description: "Responsável pela segurança noturna de condomínio premium com 200 unidades." },
    { title: "Vigilante", company: "Águia Negra Segurança", period: "2017 — 2020", description: "Atuação em rondas e monitoramento em empresa multinacional." },
  ]},
  "2": { name: "Renata Oliveira", role: "Operadora de CFTV", location: "Curitiba, PR", initials: "RO", whatsapp: "5541988887777", bio: "Especialista em monitoramento inteligente.", experiences: [] },
  "3": { name: "Marcos Tavares", role: "Supervisor de Segurança", location: "Belo Horizonte, MG", initials: "MT", whatsapp: "5531977776666", bio: "Supervisor com formação em defesa pessoal.", experiences: [] },
  "4": { name: "Júlia Santos", role: "Escolta Armada", location: "Rio de Janeiro, RJ", initials: "JS", whatsapp: "5521966665555", bio: "Escolta armada experiente.", experiences: [] },
  "5": { name: "Pedro Almeida", role: "Bombeiro Civil", location: "Salvador, BA", initials: "PA", whatsapp: "5571955554444", bio: "Bombeiro civil em eventos e empresas.", experiences: [] },
  "6": { name: "Ana Costa", role: "Vigilante Líder", location: "Brasília, DF", initials: "AC", whatsapp: "5561944443333", bio: "Líder de equipe.", experiences: [] },
};

function PerfilProfissional() {
  const { id } = Route.useParams();
  const p = DB[id];
  if (!p) return <div className="p-12 text-center">Profissional não encontrado.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/profissionais-ativos" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="rounded-3xl border border-border/60 bg-card p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {p.initials}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{p.name}</h1>
            <p className="text-muted-foreground">{p.role}</p>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.location}
            </div>
          </div>
          <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon className="mr-2 h-4 w-4 text-white" /> WhatsApp
            </a>
          </Button>
        </div>

        <p className="mt-6 text-foreground/80">{p.bio}</p>

        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">Experiências</h2>
          <div className="mt-4 space-y-4">
            {p.experiences.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma experiência cadastrada.</p>}
            {p.experiences.map((exp, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-surface p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{exp.period}</Badge>
                    <p className="mt-2 text-sm text-foreground/80">{exp.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
