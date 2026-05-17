import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, Calendar, Loader2, CheckCircle2, XCircle, Phone, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/empresa/candidatos")({
  component: EmpresaCandidatos,
});

function EmpresaCandidatos() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Feedback / Message States
  const [selectedAppFeedback, setSelectedAppFeedback] = useState<any | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const loadApplications = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // 1. Fetch applications
      const { data: apps, error: appsErr } = await supabase
        .from("applications")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (appsErr) throw appsErr;

      if (!apps || apps.length === 0) {
        setApplications([]);
        return;
      }

      // 2. Fetch related jobs
      const jobIds = [...new Set(apps.map(a => a.job_id))];
      const { data: jobs, error: jobsErr } = await supabase
        .from("jobs")
        .select("id, title")
        .in("id", jobIds);

      if (jobsErr) throw jobsErr;

      // 3. Fetch professional profiles
      const profIds = [...new Set(apps.map(a => a.professional_id))];
      const { data: profiles, error: profsErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone, experience_years")
        .in("user_id", profIds);

      if (profsErr) throw profsErr;

      // Map everything together
      const mappedApps = apps.map(app => {
        const job = jobs?.find(j => j.id === app.job_id);
        const profile = profiles?.find(p => p.user_id === app.professional_id);
        return {
          ...app,
          job_title: job?.title || "Vaga Removida",
          prof_name: profile?.full_name || "Candidato",
          prof_avatar: profile?.avatar_url,
          prof_phone: profile?.phone || "Não informado",
          prof_exp: profile?.experience_years || 0,
        };
      });

      setApplications(mappedApps);
    } catch (err: any) {
      toast.error("Erro ao buscar candidaturas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user]);

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;
      toast.success(`Candidatura marcada como: ${newStatus.toUpperCase()}`);
      loadApplications();
    } catch (err: any) {
      toast.error("Erro ao atualizar candidatura: " + err.message);
    }
  };

  const openFeedbackDialog = (app: any) => {
    setSelectedAppFeedback(app);
    setFeedbackText(app.feedback || "");
  };

  const handleSaveFeedback = async () => {
    if (!selectedAppFeedback) return;
    try {
      const { error } = await supabase
        .from("applications")
        .update({ feedback: feedbackText })
        .eq("id", selectedAppFeedback.id);

      if (error) throw error;
      toast.success("Mensagem enviada ao candidato!");
      setSelectedAppFeedback(null);
      loadApplications();
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    }
  };

  const filteredApps = applications.filter(a => 
    a.prof_name.toLowerCase().includes(search.toLowerCase()) ||
    a.job_title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Candidatos</h1>
        <p className="text-muted-foreground mt-1">Gerencie quem se candidatou e defina os processos seletivos.</p>
      </div>

      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por candidato ou vaga..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-surface" 
          />
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Nenhum candidato encontrado</p>
          <p className="text-muted-foreground text-sm">Candidaturas reais de profissionais inscritos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <ul className="divide-y divide-border/40">
            {filteredApps.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 p-5 hover:bg-surface/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-bold text-primary-foreground">
                  {c.prof_avatar ? (
                    <img src={c.prof_avatar} alt={c.prof_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    c.prof_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-lg">{c.prof_name}</p>
                  <p className="text-sm text-primary font-medium">{c.job_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exp: {c.prof_exp} anos · Contato: {c.prof_phone}
                  </p>
                </div>
                 <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`rounded-full px-3 py-1 ${
                    c.status === "novo" ? "bg-primary/20 text-primary border-primary/30" :
                    c.status === "analise" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                    c.status === "entrevista" ? "bg-blue-500/20 text-blue-500 border-blue-500/30" :
                    c.status === "contratado" ? "bg-success/20 text-success border-success/30" :
                    "bg-destructive/20 text-destructive border-destructive/30"
                  }`}>
                    {c.status.toUpperCase()}
                  </Badge>
                  
                  <div className="flex flex-wrap gap-1.5 ml-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openFeedbackDialog(c)}
                      className="rounded-full text-xs text-primary border-primary/30"
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> Mensagem
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateStatus(c.id, "analise")}
                      className="rounded-full text-xs"
                    >
                      Análise
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateStatus(c.id, "entrevista")}
                      className="rounded-full text-xs text-blue-500 border-blue-500/30"
                    >
                      <Calendar className="mr-1 h-3.5 w-3.5" /> Entrevista
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(c.id, "contratado")}
                      className="rounded-full text-xs bg-success text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Contratar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => updateStatus(c.id, "recusado")}
                      className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Write message / feedback dialog */}
      <Dialog open={!!selectedAppFeedback} onOpenChange={(o) => !o && setSelectedAppFeedback(null)}>
        {selectedAppFeedback && (
          <DialogContent className="w-[95%] max-w-md rounded-3xl bg-card border-border/60">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Enviar Mensagem ao Candidato</DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground/90">{selectedAppFeedback.prof_name}</p>
                <p className="text-xs text-primary mt-0.5">{selectedAppFeedback.job_title}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mensagem / Observações</label>
                <Textarea
                  placeholder="Escreva uma mensagem sobre o processo seletivo, data da entrevista, feedback ou próximos passos..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[120px] bg-surface rounded-2xl border-border/60 resize-none"
                />
              </div>

              <DialogFooter className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAppFeedback(null)}
                  className="rounded-xl border border-border/60"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveFeedback}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Salvar Mensagem
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Users(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
