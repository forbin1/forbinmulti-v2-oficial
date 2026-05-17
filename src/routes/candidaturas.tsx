import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Building2, MessageCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  useEffect(() => {
    if (user) {
      const loadApps = async () => {
        const { data, error } = await supabase
          .from("applications")
          .select("id, status, created_at, jobs(id, title), companies(company_name)")
          .eq("professional_id", user.id)
          .order("created_at", { ascending: false });
        
        if (data) setApps(data);
        setLoading(false);
      };
      loadApps();
    }
  }, [user]);

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
          <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/vagas/$jobId" params={{ jobId: a.jobs?.id || "" }} className="font-semibold hover:underline">
                    {a.jobs?.title || "Vaga Removida"}
                  </Link>
                  <Badge variant="outline" className="text-xs uppercase bg-surface text-muted-foreground">{a.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.companies?.company_name || "Empresa Desconhecida"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }) : "Agora"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
