import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { GraduationCap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/certificados")({
  head: () => ({ meta: [{ title: "Meus Certificados — FORBIN" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: Certificados,
});

const CERTS = [
  { id: "c1", course: "Formação de Vigilante", date: "12/03/2025", hours: "200h" },
  { id: "c2", course: "Reciclagem de Vigilante", date: "08/01/2026", hours: "50h" },
];

function Certificados() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Meus Certificados</h1>
      <p className="mt-2 text-muted-foreground">Certificados dos cursos online concluídos na plataforma.</p>

      <div className="mt-8 space-y-4">
        {CERTS.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{c.course}</h3>
              <p className="text-xs text-muted-foreground">Concluído em {c.date} · {c.hours}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              <Download className="mr-1.5 h-4 w-4" /> Baixar
            </Button>
          </div>
        ))}
        {CERTS.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <p className="text-muted-foreground">Você ainda não concluiu nenhum curso.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/cursos">Ver cursos</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
