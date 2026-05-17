import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle, Search, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/afiliados")({
  component: AdminAfiliados,
});

function AdminAfiliados() {
  const [requests, setRequests] = useState([
    { id: 1, company: "Vigilância Total LTDA", course: "Formação de Vigilante 2025", com: "20%", date: "Há 2 horas", status: "pending" },
    { id: 2, company: "Segurança Águia", course: "Operador de CFTV", com: "25%", date: "Ontem", status: "pending" },
    { id: 3, company: "Protege SP", course: "Reciclagem de Vigilantes", com: "15%", date: "Semana passada", status: "approved" },
  ]);

  const handleApprove = (id: number) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "approved" } : r));
    toast.success("Afiliação aprovada com sucesso. Link liberado para a empresa!");
  };

  const handleReject = (id: number) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    toast.success("Afiliação rejeitada.");
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Afiliações e Marketplace</h1>
          <p className="text-muted-foreground mt-1">Gerencie as empresas que querem vender cursos e receber comissões.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por empresa ou curso..." className="pl-10 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1.5 cursor-pointer bg-primary/10 text-primary">Todos</Badge>
          <Badge variant="outline" className="px-3 py-1.5 cursor-pointer">Pendentes</Badge>
          <Badge variant="outline" className="px-3 py-1.5 cursor-pointer">Aprovados</Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {requests.map((r) => (
          <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-primary-foreground font-bold">
                {r.company.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{r.company}</h3>
                <p className="text-sm text-muted-foreground">Quer vender: <span className="font-semibold text-foreground">{r.course}</span></p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-primary/15 text-primary border-primary/20">Comissão de {r.com}</Badge>
                  <span className="flex items-center text-muted-foreground"><Clock className="mr-1 h-3 w-3" /> {r.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {r.status === "pending" ? (
                <>
                  <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleReject(r.id)}>
                    <XCircle className="mr-2 h-4 w-4" /> Recusar
                  </Button>
                  <Button className="bg-success text-success-foreground hover:bg-success/90 shadow-sm" onClick={() => handleApprove(r.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar
                  </Button>
                </>
              ) : r.status === "approved" ? (
                <Badge className="bg-success/20 text-success py-1.5 px-4"><ShieldAlert className="mr-2 h-4 w-4" /> Ativo / Aprovado</Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive py-1.5 px-4"><XCircle className="mr-2 h-4 w-4" /> Rejeitado</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
