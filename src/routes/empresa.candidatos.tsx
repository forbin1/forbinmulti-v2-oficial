import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/empresa/candidatos")({
  component: EmpresaCandidatos,
});

const CANDIDATES = [
  { name: "Carlos Mendes", role: "Vigilante Líder", years: 8, courses: 5, status: "Novo", initials: "CM" },
  { name: "André Lima", role: "Escolta Armada", years: 6, courses: 4, status: "Em análise", initials: "AL" },
  { name: "Renata Oliveira", role: "Operadora CFTV", years: 4, courses: 3, status: "Reunião", initials: "RO" },
];

function EmpresaCandidatos() {
  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Candidatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie quem se aplicou às suas vagas.</p>
        </div>
      </div>

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar candidato..." className="pl-10 rounded-full" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
        <ul>
          {CANDIDATES.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center gap-4 border-b border-border/40 p-5 last:border-0 hover:bg-surface/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-bold text-primary-foreground">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.role} · {c.years} anos · {c.courses} cursos</p>
              </div>
              <Badge className="rounded-full bg-surface-elevated text-muted-foreground">{c.status}</Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Eye className="mr-1 h-4 w-4" /> Ver Perfil
                </Button>
                <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Calendar className="mr-1 h-4 w-4" /> Entrevista
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
