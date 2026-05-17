import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Building2, MessageCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/candidaturas")({
  head: () => ({ meta: [{ title: "Minhas Candidaturas — FORBIN" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
  },
  component: Candidaturas,
});

function Candidaturas() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    let channel: any;
    
    if (user) {
      const loadApps = async () => {
        const { data, error } = await supabase
          .from("applications")
          .select("id, status, feedback, created_at, jobs(id, title, companies(company_name))")
          .eq("professional_id", user.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching applications:", error);
        }
        
        if (data) {
          setApps(data);
          // Auto update the currently selected app in the modal if it updates in background
          if (selectedApp) {
            const updated = data.find(x => x.id === selectedApp.id);
            if (updated) setSelectedApp(updated);
          }
        }
        setLoading(false);
      };
      loadApps();

      channel = supabase
        .channel(`candidaturas-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `professional_id=eq.${user.id}`
          },
          () => {
            loadApps();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, selectedApp?.id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Minhas Candidaturas</h1>
      <p className="mt-2 text-muted-foreground">Acompanhe as empresas que você se candidatou.</p>

      <div className="mt-8 space-y-4">
        {loading && <div className="py-10 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>}
        {!loading && apps.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <h3 className="font-display text-xl font-bold">Nenhuma candidatura encontrada</h3>
            <p className="mt-2 text-muted-foreground">Você ainda não se candidatou a nenhuma vaga.</p>
            <Link to="/vagas" className="mt-4 inline-block font-semibold text-primary hover:underline">
              Explorar vagas
            </Link>
          </div>
        )}
        {!loading && apps.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelectedApp(a)}
            className="group rounded-2xl border border-border/60 bg-card p-6 cursor-pointer transition hover:border-primary/50 hover:bg-surface/30 hover:scale-[1.005]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold group-hover:text-primary transition">
                    {a.jobs?.title || "Vaga Removida"}
                  </h3>
                  <Badge className={`text-xs uppercase px-2.5 py-0.5 rounded-full ${
                    a.status === "novo" ? "bg-primary/20 text-primary border-primary/30" :
                    a.status === "analise" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                    a.status === "entrevista" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                    a.status === "contratado" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    "bg-destructive/20 text-destructive border-destructive/30"
                  }`}>
                    {a.status === "novo" ? "Novo" :
                     a.status === "analise" ? "Em Análise" :
                     a.status === "entrevista" ? "Entrevista" :
                     a.status === "contratado" ? "Contratado" : "Recusado"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.jobs?.companies?.company_name || "Empresa Desconhecida"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }) : "Agora"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        {selectedApp && (
          <DialogContent className="w-[95%] max-w-lg rounded-3xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold">Acompanhar Candidatura</DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-primary leading-tight">{selectedApp.jobs?.title || "Vaga Removida"}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedApp.jobs?.companies?.company_name || "Empresa Desconhecida"}</p>
              </div>

              {/* Status Stepper */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Progresso do Processo</p>
                
                <div className="relative flex flex-col gap-6 pl-6 border-l-2 border-border/40">
                  {/* Stepper Node 1: Novo */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "novo" ? "bg-primary border-primary animate-ping-slow" :
                      ["analise", "entrevista", "contratado"].includes(selectedApp.status) ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "novo" ? "bg-primary border-primary" :
                      ["analise", "entrevista", "contratado"].includes(selectedApp.status) ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <div className="ml-2">
                      <p className={`text-sm font-semibold ${selectedApp.status === "novo" ? "text-primary" : "text-muted-foreground"}`}>Recebido</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">Sua candidatura foi registrada e está aguardando triagem.</p>
                    </div>
                  </div>

                  {/* Stepper Node 2: Em Análise */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "analise" ? "bg-yellow-500 border-yellow-500 animate-ping-slow" :
                      ["entrevista", "contratado"].includes(selectedApp.status) ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "analise" ? "bg-yellow-500 border-yellow-500" :
                      ["entrevista", "contratado"].includes(selectedApp.status) ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <div className="ml-2">
                      <p className={`text-sm font-semibold ${selectedApp.status === "analise" ? "text-yellow-500" : "text-muted-foreground"}`}>Em Análise</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">A equipe de recrutamento está avaliando seu perfil.</p>
                    </div>
                  </div>

                  {/* Stepper Node 3: Entrevista */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "entrevista" ? "bg-blue-500 border-blue-500 animate-ping-slow" :
                      selectedApp.status === "contratado" ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "entrevista" ? "bg-blue-500 border-blue-500" :
                      selectedApp.status === "contratado" ? "bg-emerald-500 border-emerald-500" :
                      "bg-muted border-muted"
                    }`} />
                    <div className="ml-2">
                      <p className={`text-sm font-semibold ${selectedApp.status === "entrevista" ? "text-blue-500" : "text-muted-foreground"}`}>Entrevista</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">Prepare-se! Um recrutador agendou uma conversa com você.</p>
                    </div>
                  </div>

                  {/* Stepper Node 4: Finalizado */}
                  <div className="relative">
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "contratado" ? "bg-emerald-500 border-emerald-500 animate-ping-slow" :
                      selectedApp.status === "recusado" ? "bg-destructive border-destructive" :
                      "bg-muted border-muted"
                    }`} />
                    <span className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      selectedApp.status === "contratado" ? "bg-emerald-500 border-emerald-500" :
                      selectedApp.status === "recusado" ? "bg-destructive border-destructive" :
                      "bg-muted border-muted"
                    }`} />
                    <div className="ml-2">
                      <p className={`text-sm font-semibold ${
                        selectedApp.status === "contratado" ? "text-emerald-400" :
                        selectedApp.status === "recusado" ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {selectedApp.status === "contratado" ? "Contratado! 🎉" :
                         selectedApp.status === "recusado" ? "Processo Encerrado" :
                         "Finalizado"}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">
                        {selectedApp.status === "contratado" ? "Seja muito bem-vindo! Você foi selecionado para a vaga." :
                         selectedApp.status === "recusado" ? "Infelizmente o processo foi encerrado desta vez. Continue tentando!" :
                         "Resultado final do processo seletivo."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company feedback message */}
              <div className="rounded-2xl border border-border/60 bg-surface/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mensagem da Empresa</p>
                {selectedApp.feedback ? (
                  <p className="text-sm font-medium text-foreground/90 italic">
                    "{selectedApp.feedback}"
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma mensagem enviada pela empresa até o momento.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Link
                  to="/vagas/$jobId"
                  params={{ jobId: selectedApp.jobs?.id || "" }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border/60 px-5 text-sm font-semibold hover:bg-surface/50"
                  onClick={() => setSelectedApp(null)}
                >
                  Ver Detalhes da Vaga
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
