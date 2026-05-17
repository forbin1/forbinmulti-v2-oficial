import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, ArrowUpRight, Wallet, History, Send, Loader2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/empresa/vendas")({
  component: EmpresaVendas,
});

function EmpresaVendas() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // Form states
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");

  const loadFinanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // 1. Fetch sales
      const { data: salesList, error: salesErr } = await supabase
        .from("sales")
        .select(`
          id,
          amount,
          commission_earned,
          status,
          created_at,
          courses (title)
        `)
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (salesErr) throw salesErr;
      setSales(salesList || []);

      // 2. Fetch withdrawals
      const { data: withdrawList, error: withdrawErr } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (withdrawErr) throw withdrawErr;
      setWithdrawals(withdrawList || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados financeiros: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [user]);

  // MATH FOR WALLET
  // Saldo Liberado: sum of all sales where status is 'liberado'
  const totalLiberadoSales = sales
    .filter(s => s.status === "liberado")
    .reduce((sum, s) => sum + parseFloat(s.commission_earned), 0);

  // Total Sacado: sum of withdrawals with status 'completed'
  const totalWithdrawn = withdrawals
    .filter(w => w.status === "completed")
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  // Saldo Disponível na Carteira (apenas desconta quando aprovado/completed)
  const walletBalance = totalLiberadoSales - totalWithdrawn;

  // Saldo Pendente (Vendas ainda bloqueadas de 30 dias)
  const pendingSales = sales
    .filter(s => s.status === "pendente")
    .reduce((sum, s) => sum + parseFloat(s.commission_earned), 0);

  // Solicitações pendentes (saques solicitados mas não aprovados ainda)
  const pendingWithdrawalsAmount = withdrawals
    .filter(w => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const value = parseFloat(amount);
    
    if (!pixKey.trim()) {
      toast.error("Por favor, informe a Chave PIX.");
      return;
    }
    if (isNaN(value) || value <= 0) {
      toast.error("Informe um valor de saque válido.");
      return;
    }
    if (value < 50) {
      toast.error("O valor mínimo para saque é de R$ 50,00.");
      return;
    }
    if (value > walletBalance) {
      toast.error("Saldo insuficiente na carteira para este saque.");
      return;
    }

    try {
      setRequesting(true);
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          company_id: user.id,
          amount: value,
          pix_key: pixKey,
          status: "pending"
        });

      if (error) throw error;
      toast.success("Solicitação de saque via PIX enviada! Ela será analisada pelo Admin Master.");
      setAmount("");
      loadFinanceData();
    } catch (err: any) {
      toast.error("Erro ao solicitar saque: " + err.message);
    } finally {
      setRequesting(false);
    }
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
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e controle suas comissões de afiliação e faça retiradas via PIX.
        </p>
      </div>

      {/* Cards de Saldo */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-6 shadow-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <Badge className="bg-success/20 text-success border-success/30 font-semibold">Carteira</Badge>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-primary">
            R$ {walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Disponível para saque imediato</p>
          {pendingWithdrawalsAmount > 0 && (
            <p className="text-[11px] text-yellow-500 font-medium mt-1">
              * R$ {pendingWithdrawalsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em análise (pendente)
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-muted-foreground">
              <History className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="border-border">Aguardando</Badge>
          </div>
          <p className="mt-4 font-display text-3xl font-bold">
            R$ {pendingSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">A liberar em até 30 dias</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
              <Landmark className="h-5 w-5" />
            </div>
            <Badge className="bg-success/15 text-success border-success/20">Pago</Badge>
          </div>
          <p className="mt-4 font-display text-3xl font-bold text-success">
            R$ {totalWithdrawn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total já sacado até hoje</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Extrato de Comissões */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-xl font-bold mb-4 font-semibold">Extrato de Comissões</h2>
          {sales.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Nenhuma indicação vendida ainda. Divulgue seu link de afiliado!
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.status === 'liberado' ? 'bg-success/15 text-success' : 'bg-surface-elevated text-muted-foreground'}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.courses?.title || "Curso Indefinido"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")} · Valor total: R$ {parseFloat(s.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">+ R$ {parseFloat(s.commission_earned).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {s.status === 'liberado' ? 'Liberado' : 'Aguardando'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solicitar Retirada e Histórico de Saques */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4 font-semibold">Solicitar Saque PIX</h2>
            <form onSubmit={handleWithdrawalRequest} className="space-y-4">
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input 
                  placeholder="CNPJ, E-mail ou Telefone" 
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  required
                  className="bg-surface" 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor do Saque (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 150,00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="bg-surface" 
                />
                <p className="text-xs text-muted-foreground text-right">
                  Mínimo: R$ 50,00
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={requesting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full shadow-gold"
              >
                {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Transferir via PIX
              </Button>
            </form>
          </div>

          {/* Histórico de Saques */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-lg font-bold mb-4 font-semibold">Histórico de Retiradas</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                Nenhum saque solicitado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold">R$ {parseFloat(w.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={`rounded-full text-[10px] ${
                      w.status === "completed" ? "bg-success/15 text-success border-success/20" :
                      w.status === "pending" ? "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" :
                      "bg-destructive/15 text-destructive border-destructive/20"
                    }`}>
                      {w.status === "completed" ? "Pago" : w.status === "pending" ? "Análise" : "Recusado"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
