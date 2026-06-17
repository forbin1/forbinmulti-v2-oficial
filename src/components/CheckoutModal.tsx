import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, QrCode, Check, Loader2, Copy,
  CheckCircle2, ArrowLeft, Smartphone, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { activateSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type CheckoutPlan = {
  name: string;
  installmentLabel: string;
  pixLabel: string;
  period: string;
  audience: "professional" | "company";
  periodRaw: "month" | "year";
  slug: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: CheckoutPlan;
  onSuccess?: () => void; // callback after activation (e.g. refresh subscription)
};

type Step = "method" | "pix" | "card" | "processing" | "success";

const FAKE_PIX_KEY = "00020126580014BR.GOV.BCB.PIX013636f14b5e-9f7b-4c13-88d9-3e7a6d2f01995204000053039865802BR5914FORBIN PLATAFOR6009SAO PAULO62070503***63047B2D";
const FAKE_QR = "https://api.qrserver.com/v1/create-qr-code/?data=FORBIN_PAGAMENTO_SIMULADO&size=180x180&bgcolor=0a0a0a&color=F5C518&margin=8";

export function CheckoutModal({ open, onOpenChange, plan, onSuccess }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("method");
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const role = plan.audience === "professional" ? "professional" : "company";

  const reset = () => {
    setStep("method"); setCopied(false);
    setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv("");
  };
  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const processPayment = () => {
    setStep("processing");
    setTimeout(async () => {
      if (!user) {
        toast.error("Faça login antes de prosseguir.");
        setStep("method");
        return;
      }
      
      const isCourse = plan.slug.startsWith("course-");
      
      if (isCourse) {
        const courseId = plan.slug.replace("course-", "");
        const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
        if (error) {
          toast.error("Erro ao adquirir curso: " + error.message);
          setStep("method");
        } else {
          // Criar notificação de sucesso
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Curso desbloqueado! 🎓",
            message: `Você adquiriu o curso "${plan.name}" com sucesso. Bons estudos!`,
            type: "success",
          });
          setStep("success");
          onSuccess?.();
        }
      } else {
        const err = await activateSubscription(user.id, role, plan.periodRaw, plan.slug);
        if (err) {
          toast.error("Erro ao ativar plano: " + err.message);
          setStep("method");
        } else {
          setStep("success");
          onSuccess?.();
        }
      }
    }, 2200);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(FAKE_PIX_KEY).catch(() => {});
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => processPayment(), 1500);
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) =>
    v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");
  const cardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardName.trim().length > 2 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;

  const dashboardPath = role === "professional" ? "/profissional" : "/empresa";
  const isCourse = plan.slug.startsWith("course-");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border border-border/60 text-foreground p-0 overflow-hidden rounded-3xl">

        {/* Header */}
        {step !== "success" && (
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
            {(step === "pix" || step === "card") ? (
              <button onClick={() => setStep("method")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            ) : <span />}
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Checkout Forbin</p>
            <span />
          </div>
        )}

        {/* Not logged in guard */}
        {!user && step === "method" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <LogIn className="h-10 w-10 text-primary" />
            <div>
              <p className="font-display text-lg font-bold">Entre na sua conta primeiro</p>
              <p className="text-sm text-muted-foreground mt-1">Você precisa estar logado para prosseguir.</p>
            </div>
            <Button asChild className="w-full h-12 rounded-full bg-primary font-bold shadow-gold hover:bg-primary/90">
              <Link to="/login">Entrar na conta</Link>
            </Button>
            <p className="text-xs text-muted-foreground">Não tem conta? <Link to="/cadastro" className="text-primary underline">Criar conta grátis</Link></p>
          </div>
        )}

        {/* Plan Summary */}
        {user && step !== "success" && (
          <div className="mx-6 mt-5 rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
              {isCourse ? "Você está desbloqueando" : "Você está assinando"}
            </p>
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold truncate max-w-[220px]">{plan.name}</p>
              <Badge className="rounded-full bg-primary/20 text-primary border-primary/30 text-xs">{plan.period}</Badge>
            </div>
            <p className="text-sm font-semibold text-foreground mt-1">{plan.installmentLabel}</p>
          </div>
        )}

        {/* METHOD */}
        {user && step === "method" && (
          <div className="p-6 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground mb-4">Escolha a forma de pagamento</p>
            <button onClick={() => setStep("pix")} className="w-full flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/50 hover:bg-primary/5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition"><QrCode className="h-6 w-6" /></div>
              <div className="flex-1"><p className="font-semibold">PIX</p><p className="text-sm text-muted-foreground">Pagamento instantâneo · <span className="text-primary font-semibold">{plan.pixLabel}</span></p></div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground group-hover:text-primary transition" />
            </button>
            <button onClick={() => setStep("card")} className="w-full flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/50 hover:bg-primary/5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition"><CreditCard className="h-6 w-6" /></div>
              <div className="flex-1"><p className="font-semibold">Cartão de Crédito</p><p className="text-sm text-muted-foreground">{plan.installmentLabel} no cartão</p></div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground group-hover:text-primary transition" />
            </button>
            <p className="text-center text-xs text-muted-foreground pt-2">🔒 Ambiente seguro · Dados protegidos</p>
          </div>
        )}

        {/* PIX */}
        {user && step === "pix" && (
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-[180px] w-[180px] rounded-2xl overflow-hidden border-2 border-primary/40 bg-[#0a0a0a] flex items-center justify-center">
                <img src={FAKE_QR} alt="QR Code PIX" className="h-full w-full object-cover" />
              </div>
              <Smartphone className="absolute -bottom-3 -right-3 h-8 w-8 text-primary bg-[#0a0a0a] rounded-full p-1 border border-primary/30" />
            </div>
            <div className="w-full text-center">
              <p className="text-sm font-semibold">Escaneie o QR Code ou copie o código</p>
              <p className="text-xs text-muted-foreground mt-1">Abra o app do seu banco e pague via PIX</p>
            </div>
            <button onClick={handleCopyPix} className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3 text-xs text-muted-foreground hover:border-primary/40 transition">
              <span className="truncate font-mono">{FAKE_PIX_KEY.slice(0, 48)}...</span>
              {copied ? <Check className="h-4 w-4 text-success shrink-0" /> : <Copy className="h-4 w-4 shrink-0 text-primary" />}
            </button>
            <Button onClick={handleCopyPix} className="w-full h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-gold">
              {copied ? <><Check className="mr-2 h-4 w-4" /> Código copiado!</> : <><Copy className="mr-2 h-4 w-4" /> Copiar código PIX</>}
            </Button>
          </div>
        )}

        {/* CARD */}
        {user && step === "card" && (
          <div className="p-6 space-y-4">
            <div className="relative h-36 w-full rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent border border-primary/30 p-5 overflow-hidden">
              <div className="absolute right-4 top-4 flex gap-1">
                <div className="h-5 w-5 rounded-full bg-primary/60" /><div className="h-5 w-5 -ml-2 rounded-full bg-primary/40" />
              </div>
              <p className="font-mono text-lg font-bold tracking-widest text-primary mt-6">{cardNumber || "•••• •••• •••• ••••"}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-semibold uppercase">{cardName || "NOME NO CARTÃO"}</p>
                <p className="text-xs text-muted-foreground font-mono">{cardExpiry || "MM/AA"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs">Número do cartão</Label><Input value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" className="bg-surface font-mono" maxLength={19} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Nome no cartão</Label><Input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="COMO ESCRITO NO CARTÃO" className="bg-surface uppercase" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Validade</Label><Input value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" className="bg-surface font-mono" maxLength={5} /></div>
                <div className="space-y-1.5"><Label className="text-xs">CVV</Label><Input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" type="password" className="bg-surface font-mono" maxLength={4} /></div>
              </div>
            </div>
            <Button disabled={!cardValid} onClick={processPayment} className="w-full h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-gold disabled:opacity-40">
              <CreditCard className="mr-2 h-4 w-4" /> Pagar {plan.installmentLabel}
            </Button>
            <p className="text-center text-xs text-muted-foreground">🔒 Seus dados estão protegidos</p>
          </div>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-14 px-6">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="font-display text-xl font-bold">Processando pagamento...</p>
            <p className="text-sm text-muted-foreground text-center">Aguarde enquanto confirmamos sua transação.</p>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-5 py-10 px-8 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success/15 border-2 border-success/40">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <div className="absolute inset-0 animate-ping rounded-full bg-success/10" style={{ animationDuration: "2s" }} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{isCourse ? "Curso desbloqueado! 🎓" : "Plano ativado! 🎉"}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {isCourse ? (
                  <>Você adquiriu o curso <strong>{plan.name}</strong> com sucesso!</>
                ) : (
                  <><strong>{plan.name}</strong> está ativo. Acesso liberado por <strong>{plan.periodRaw === "year" ? "1 ano" : "1 mês"}</strong>.</>
                )}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-success/30 bg-success/8 px-5 py-4 text-left space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-success mb-2">Resumo</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isCourse ? "Curso" : "Plano"}</span><span className="font-semibold truncate max-w-[180px]">{plan.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Acesso</span><span className="font-semibold">{isCourse ? "Vitalício" : (plan.periodRaw === "year" ? "1 ano" : "1 mês")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><span className="text-success font-semibold">✓ Pago</span></div>
            </div>
            <div className="flex gap-3 w-full">
              {isCourse ? (
                <Button onClick={() => { handleClose(false); navigate({ to: "/cursos" }); }} className="flex-1 h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-gold">
                  Ir para meus cursos
                </Button>
              ) : (
                <>
                  <Button onClick={() => { handleClose(false); navigate({ to: dashboardPath as any }); }} className="flex-1 h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 shadow-gold">
                    Acessar painel
                  </Button>
                  <Button variant="outline" onClick={() => { handleClose(false); navigate({ to: "/minha-assinatura" as any }); }} className="flex-1 h-12 rounded-full">
                    Minha assinatura
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
