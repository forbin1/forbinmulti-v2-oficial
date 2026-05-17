import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, RefreshCcw,
  Zap, Crown, Bell, ChevronRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { useNotifications } from "@/hooks/use-notifications";
import { CheckoutModal, type CheckoutPlan } from "@/components/CheckoutModal";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/minha-assinatura")({
  head: () => ({
    meta: [{ title: "Minha Assinatura — FORBIN" }],
  }),
  component: MinhaAssinaturaPage,
});

function MinhaAssinaturaPage() {
  const { user } = useAuth();
  const { status, role, plan, expiresAt, isActive, isExpired, isFree, daysRemaining, loading, refresh } = useSubscription();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);

  const openRenew = () => {
    const isCompany = role === "company";
    setCheckoutPlan({
      name: isCompany ? "Empresa Anual" : "Profissional Anual",
      installmentLabel: isCompany ? "R$250,00 12x" : "R$27,90 12x",
      pixLabel: isCompany ? "R$3.000,00 à vista" : "R$247,90 à vista",
      period: "Anual",
      audience: isCompany ? "company" : "professional",
      periodRaw: "year",
      slug: isCompany ? "empresa-anual" : "profissional-anual",
    });
    setCheckoutOpen(true);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-display text-xl font-bold">Faça login para ver sua assinatura</p>
          <Button asChild className="mt-4 rounded-full bg-primary"><Link to="/login">Entrar</Link></Button>
        </div>
      </div>
    );
  }

  // Status config
  const statusConfig = {
    active: { label: "Ativo", color: "text-success", bg: "bg-success/15 border-success/30", icon: CheckCircle2 },
    expired: { label: "Expirado", color: "text-destructive", bg: "bg-destructive/15 border-destructive/30", icon: AlertTriangle },
    free: { label: "Gratuito", color: "text-muted-foreground", bg: "bg-muted/20 border-border", icon: Zap },
    none: { label: "Sem plano", color: "text-muted-foreground", bg: "bg-muted/20 border-border", icon: Zap },
  }[status] ?? { label: "Desconhecido", color: "text-muted-foreground", bg: "bg-muted/20 border-border", icon: Zap };

  const StatusIcon = statusConfig.icon;

  // Progress bar: % of time remaining
  const progressPercent = (() => {
    if (!isActive || !expiresAt) return 0;
    const totalDays = plan?.includes("anual") || plan?.includes("year") ? 365 : 30;
    const pct = Math.min(100, Math.max(0, (daysRemaining! / totalDays) * 100));
    return Math.round(pct);
  })();

  const notifIcons: Record<string, string> = { success: "✅", warning: "⚠️", error: "❌", info: "ℹ️" };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/40 bg-card/30 px-4 py-10 text-center">
        <Crown className="mx-auto h-10 w-10 text-primary mb-3" />
        <h1 className="font-display text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gerencie seu plano e acompanhe o acesso à plataforma</p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

        {/* ── Status Card ── */}
        <div className={`rounded-3xl border p-6 ${statusConfig.bg}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${statusConfig.bg}`}>
                <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status do plano</p>
                <p className={`font-display text-2xl font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
              </div>
            </div>
            <Badge className={`rounded-full border ${statusConfig.bg} ${statusConfig.color} text-xs font-semibold px-3`}>
              {role === "company" ? "Empresa" : role === "professional" ? "Profissional" : "Sem papel"}
            </Badge>
          </div>

          {/* Plan name */}
          {plan && (
            <p className="mt-4 text-sm font-semibold">
              Plano: <span className="text-foreground capitalize">{plan.replace(/-/g, " ")}</span>
            </p>
          )}

          {/* Expiry info */}
          {isActive && expiresAt && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Expira em
                </span>
                <span className="font-semibold">{format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Tempo restante
                </span>
                <span className={`font-bold ${daysRemaining! <= 7 ? "text-destructive" : "text-success"}`}>
                  {daysRemaining} dias
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${daysRemaining! <= 7 ? "bg-destructive" : "bg-success"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercent}% do período restante</p>
              </div>
            </div>
          )}

          {isExpired && expiresAt && (
            <p className="mt-3 text-sm text-destructive font-medium">
              Expirou {formatDistanceToNow(expiresAt, { locale: ptBR, addSuffix: true })}
            </p>
          )}

          {/* CTA */}
          <div className="mt-5 flex gap-3">
            {(isFree || isExpired) && (
              <Button onClick={openRenew} className="flex-1 h-11 rounded-full bg-primary font-bold shadow-gold hover:bg-primary/90">
                <Zap className="mr-2 h-4 w-4" /> {isFree ? "Assinar agora" : "Renovar plano"}
              </Button>
            )}
            {isActive && daysRemaining !== null && daysRemaining <= 30 && (
              <Button onClick={openRenew} variant="outline" className="flex-1 h-11 rounded-full border-primary/50 text-primary hover:bg-primary/10">
                <RefreshCcw className="mr-2 h-4 w-4" /> Renovar antecipado
              </Button>
            )}
            {isActive && (
              <Button asChild variant="ghost" className="h-11 rounded-full">
                <Link to="/planos">Ver todos os planos</Link>
              </Button>
            )}
          </div>
        </div>

        {/* ── What's Included ── */}
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> O que está {isActive ? "incluso" : "disponível"}
          </h2>
          {isActive ? (
            <ul className="space-y-3">
              {(role === "professional"
                ? ["Acesso a todas as vagas", "Candidatar-se ilimitado", "Cursos e certificações", "Perfil verificado", "Suporte prioritário"]
                : ["Publicar vagas ilimitadas", "Ver perfis de profissionais", "Acesso ao banco de talentos", "Painel empresa completo", "Suporte dedicado"]
              ).map(f => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Conta gratuita — acesso limitado</p>
              <ul className="space-y-2">
                {["❌ Vagas bloqueadas", "❌ Cursos bloqueados", "❌ Candidaturas bloqueadas", "❌ Perfis de profissionais bloqueados"].map(f => (
                  <li key={f} className="text-sm text-muted-foreground">{f}</li>
                ))}
              </ul>
              <Button onClick={openRenew} className="w-full h-11 rounded-full bg-primary font-semibold shadow-gold hover:bg-primary/90 mt-2">
                Desbloquear tudo por {role === "company" ? "R$250,00/mês" : "R$27,90/mês"}
              </Button>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notificações
              {unreadCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition hover:bg-muted/20 ${!n.read ? "bg-primary/5 border border-primary/20" : ""}`}
                >
                  <span className="text-lg shrink-0">{notifIcons[n.type] ?? "ℹ️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">Atalhos</h2>
          <ul className="divide-y divide-border/40">
            {[
              { label: "Ver todos os planos", to: "/planos" },
              { label: role === "company" ? "Painel da empresa" : "Meu perfil", to: role === "company" ? "/empresa" : "/perfil" },
              { label: "Vagas disponíveis", to: "/vagas" },
              { label: "Cursos", to: "/cursos" },
            ].map(({ label, to }) => (
              <li key={to}>
                <Link to={to as any} className="flex items-center justify-between py-3 text-sm font-medium hover:text-primary transition">
                  {label}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutPlan && (
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plan={checkoutPlan}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
