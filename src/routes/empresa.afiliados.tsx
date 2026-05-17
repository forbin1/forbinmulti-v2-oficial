import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Link as LinkIcon, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/empresa/afiliados")({
  component: EmpresaAfiliados,
});

function EmpresaAfiliados() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [affiliations, setAffiliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // 1. Fetch courses available for affiliate
      const { data: courseList, error: courseErr } = await supabase
        .from("courses")
        .select("*")
        .eq("affiliate_available", true)
        .eq("is_published", true);

      if (courseErr) throw courseErr;
      setCourses(courseList || []);

      // 2. Fetch company's affiliations
      const { data: affList, error: affErr } = await supabase
        .from("affiliations")
        .select("*")
        .eq("company_id", user.id);

      if (affErr) throw affErr;
      setAffiliations(affList || []);
    } catch (err: any) {
      toast.error("Erro ao carregar marketplace: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const requestAffiliation = async (courseId: string) => {
    if (!user) return;
    try {
      setRequestingId(courseId);
      const { error } = await supabase
        .from("affiliations")
        .insert({
          company_id: user.id,
          course_id: courseId,
          status: "pending"
        });

      if (error) throw error;
      toast.success("Solicitação de afiliação enviada! O Admin Geral analisará em breve.");
      loadData();
    } catch (err: any) {
      toast.error("Erro ao solicitar afiliação: " + err.message);
    } finally {
      setRequestingId(null);
    }
  };

  const getAffStatus = (courseId: string) => {
    const aff = affiliations.find(a => a.course_id === courseId);
    return aff ? aff.status : "none";
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace de Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Indique cursos oficiais da Forbin para seus candidatos e ganhe comissões automáticas por venda.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Nenhum curso disponível para afiliação</p>
          <p className="text-muted-foreground text-sm">O administrador liberará cursos para afiliação em breve.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const status = getAffStatus(c.id);
            const commissionVal = c.price ? ((c.price * (c.commission_percentage || 0)) / 100).toFixed(2) : "0.00";
            
            return (
              <div key={c.id} className="relative overflow-hidden rounded-2xl border border-border/60 bg-card flex flex-col hover:border-primary/40 transition-all">
                <div 
                  className="h-32 bg-primary/20 bg-cover bg-center" 
                  style={{ backgroundImage: c.thumbnail_url ? `url(${c.thumbnail_url})` : 'url(https://images.unsplash.com/photo-1541888086925-0c13d80b623b?q=80&w=600&auto=format&fit=crop)' }}
                ></div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs text-primary font-semibold uppercase tracking-wider">{c.category}</span>
                  <h3 className="font-bold text-lg mt-1">{c.title}</h3>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Preço: <span className="font-bold text-foreground">R$ {c.price || "0,00"}</span></span>
                    <Badge className="bg-success/20 text-success border-success/30 font-semibold">
                      Comissão {c.commission_percentage || 0}%
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground border-b border-border/40 pb-4">
                    Você ganha <strong className="text-primary font-bold">R$ {commissionVal}</strong> por venda.
                  </p>
                  
                  <div className="mt-auto pt-4">
                    {status === "approved" ? (
                      <div className="space-y-2">
                        <Badge className="bg-primary/20 text-primary w-full justify-center py-1 font-semibold border-primary/30">
                          Afiliado Aprovado
                        </Badge>
                        <Button 
                          variant="outline" 
                          className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-full" 
                          onClick={() => {
                            const refLink = `${window.location.origin}/curso/${c.id}?ref=${user?.id}`;
                            navigator.clipboard.writeText(refLink);
                            toast.success("Link de venda copiado! Envie para seus candidatos.");
                          }}
                        >
                          <LinkIcon className="mr-2 h-3.5 w-3.5" /> Copiar Link de Indicação
                        </Button>
                      </div>
                    ) : status === "pending" ? (
                      <Button disabled variant="outline" className="w-full rounded-full">
                        <Clock className="mr-2 h-4 w-4" /> Em análise pelo Admin
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full shadow-gold" 
                        onClick={() => requestAffiliation(c.id)}
                        disabled={requestingId === c.id}
                      >
                        {requestingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar Afiliação"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
