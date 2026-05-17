import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, History, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/empresa/vendas")({
  component: EmpresaVendas,
});

function EmpresaVendas() {
  const requestSaque = () => {
    toast.success("Solicitação de saque via PIX enviada! O valor cairá em até 24 horas úteis.");
  };

  return (
    <div className="p-6 sm:p-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas comissões de afiliação e solicite saques.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <Badge className="bg-success/20 text-success border-success/30">Disponível</Badge>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-primary">R$ 1.450,00</p>
          <p className="text-sm text-muted-foreground">Saldo liberado para saque</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-muted-foreground">
              <History className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold">R$ 312,50</p>
          <p className="text-sm text-muted-foreground">Aguardando liberação (30 dias)</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 font-display text-3xl font-bold">R$ 4.200,00</p>
          <p className="text-sm text-muted-foreground">Total sacado até hoje</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-xl font-bold mb-4">Extrato de Vendas</h2>
          <div className="space-y-4">
            {[
              { id: "v1", date: "Hoje, 14:30", course: "Formação de Vigilante 2025", value: "R$ 160,00", status: "liberado" },
              { id: "v2", date: "Ontem, 09:15", course: "Operador de CFTV", value: "R$ 112,50", status: "liberado" },
              { id: "v3", date: "12/05/2026", course: "Reciclagem de Vigilantes", value: "R$ 52,50", status: "pendente" },
              { id: "v4", date: "10/05/2026", course: "Formação de Vigilante 2025", value: "R$ 160,00", status: "liberado" },
            ].map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.status === 'liberado' ? 'bg-success/15 text-success' : 'bg-surface-elevated text-muted-foreground'}`}>
                    {s.status === 'liberado' ? <ArrowUpRight className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{s.course}</p>
                    <p className="text-xs text-muted-foreground">{s.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.status === 'liberado' ? 'Liberado' : 'Aguardando'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Solicitar Saque</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input placeholder="CNPJ, Email, Telefone ou Aleatória" className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Valor do saque</Label>
                <Input type="number" placeholder="Ex: 500,00" max={1450} className="bg-surface" />
                <p className="text-xs text-muted-foreground text-right">Mínimo: R$ 50,00</p>
              </div>
              <Button onClick={requestSaque} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Transferir via PIX
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
