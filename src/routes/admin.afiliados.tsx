import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Search, Clock, ShieldCheck,
  Copy, ExternalLink, Loader2, RefreshCw, Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/afiliados")({
  component: AdminAfiliados,
});

type AffiliationRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  company_id: string;
  course_id: string;
  affiliate_code: string | null;
  company?: { company_name: string; email: string } | null;
  course?: { title: string; commission_percentage: number | null; price: number | null } | null;
};

type Filter = "all" | "pending" | "approved" | "rejected";

function AdminAfiliados() {
  const [items, setItems] = useState<AffiliationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("affiliations")
      .select(`
        id, status, created_at, company_id, course_id, affiliate_code,
        company:company_id (company_name, email),
        course:course_id (title, commission_percentage, price)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar afiliações: " + error.message);
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Realtime subscription
    const channel = supabase
      .channel("affiliations-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "affiliations" },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const approve = async (item: AffiliationRow) => {
    setProcessing(item.id);
    // Generate a unique affiliate code
    const code = `${item.company_id.slice(0, 8)}-${item.course_id.slice(0, 8)}`;
    const { error } = await supabase
      .from("affiliations")
      .update({ status: "approved", affiliate_code: code })
      .eq("id", item.id);

    if (error) toast.error("Erro ao aprovar: " + error.message);
    else toast.success("Afiliação aprovada! Link gerado para a empresa.");
    setProcessing(null);
    load();
  };

  const reject = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase
      .from("affiliations")
      .update({ status: "rejected", affiliate_code: null })
      .eq("id", id);

    if (error) toast.error("Erro ao rejeitar: " + error.message);
    else toast.success("Afiliação rejeitada.");
    setProcessing(null);
    load();
  };

  const copyLink = (item: AffiliationRow) => {
    const link = `${window.location.origin}/checkout/${item.course_id}?ref=${item.affiliate_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de afiliado copiado!");
  };

  const filtered = items
    .filter((i) => filter === "all" || i.status === filter)
    .filter((i) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        (i.company as any)?.company_name?.toLowerCase().includes(s) ||
        (i.course as any)?.title?.toLowerCase().includes(s)
      );
    });

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Marketplace</p>
          <h1 className="font-display text-3xl font-black tracking-tight">Afiliações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie e aprove solicitações de afiliação em tempo real.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-full self-start sm:self-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por empresa ou curso..." className="pl-10 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {{ all: "Todos", pending: "Pendentes", approved: "Aprovados", rejected: "Rejeitados" }[f]}
              <span className="ml-1.5 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-sm text-muted-foreground">
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          filtered.map((item) => {
            const company = item.company as any;
            const course = item.course as any;
            const commPct = course?.commission_percentage || 0;
            const price = course?.price || 0;
            const earnValue = price > 0 ? ((price * commPct) / 100).toFixed(2) : null;
            const affiliateLink = item.affiliate_code
              ? `${window.location.origin}/checkout/${item.course_id}?ref=${item.affiliate_code}`
              : null;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-card p-5 transition-all ${
                  item.status === "approved"
                    ? "border-success/30 bg-success/5"
                    : item.status === "rejected"
                    ? "border-destructive/20"
                    : "border-border/60 hover:border-primary/30"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Info */}
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-gold font-display text-lg font-black text-primary-foreground shadow-md">
                      {company?.company_name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base">{company?.company_name || "Empresa"}</p>
                      <p className="text-xs text-muted-foreground">{company?.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Quer vender: <span className="font-semibold text-foreground">{course?.title || "Curso removido"}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
                          Comissão {commPct}%
                        </Badge>
                        {earnValue && (
                          <Badge className="bg-success/15 text-success border-success/20 text-xs">
                            +R$ {earnValue} por venda
                          </Badge>
                        )}
                        <span className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {item.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
                          disabled={processing === item.id}
                          onClick={() => reject(item.id)}
                        >
                          {processing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                          Recusar
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full bg-success text-success-foreground hover:bg-success/90 shadow-sm"
                          disabled={processing === item.id}
                          onClick={() => approve(item)}
                        >
                          {processing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                          Aprovar
                        </Button>
                      </div>
                    ) : item.status === "approved" ? (
                      <Badge className="bg-success/20 text-success py-1.5 px-4 text-xs font-bold">
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive py-1.5 px-4 text-xs font-bold">
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Rejeitado
                      </Badge>
                    )}

                    {/* Affiliate link (when approved) */}
                    {item.status === "approved" && affiliateLink && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 rounded-xl bg-muted/50 border border-border/60 px-3 py-2 text-[10px] font-mono text-muted-foreground max-w-xs overflow-hidden">
                          <LinkIcon className="h-3 w-3 shrink-0 text-primary" />
                          <span className="truncate">{affiliateLink}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-full text-xs border-primary/40 text-primary hover:bg-primary/10"
                            onClick={() => copyLink(item)}
                          >
                            <Copy className="mr-1.5 h-3 w-3" /> Copiar Link
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-xs"
                            asChild
                          >
                            <a href={affiliateLink} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
