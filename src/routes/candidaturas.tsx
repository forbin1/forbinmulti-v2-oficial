import { createFileRoute, redirect } from "@tanstack/react-router";
import { Building2, MessageCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/candidaturas")({
  head: () => ({ meta: [{ title: "Minhas Candidaturas — FORBIN" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: Candidaturas,
});

const APPS = [
  { id: "a1", company: "Vigilância Total LTDA", job: "Vigilante Noturno — Condomínio Premium", status: "Em análise", date: "Há 2 dias", message: "Recebemos sua candidatura. Em breve entraremos em contato." },
  { id: "a2", company: "Águia Negra Segurança", job: "Escolta Armada", status: "Entrevista agendada", date: "Há 5 dias", message: "Olá! Gostaríamos de agendar uma entrevista para quinta-feira às 14h." },
];

function Candidaturas() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Minhas Candidaturas</h1>
      <p className="mt-2 text-muted-foreground">Acompanhe as empresas que você se candidatou e mensagens recebidas.</p>

      <div className="mt-8 space-y-4">
        {APPS.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.job}</h3>
                  <Badge variant="outline" className="text-xs">{a.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.company}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {a.date}</p>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface p-3 text-sm">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-foreground/80">{a.message}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
