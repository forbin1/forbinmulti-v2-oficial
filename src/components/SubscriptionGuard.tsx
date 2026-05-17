import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, RefreshCcw, AlertTriangle, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  children: ReactNode;
  /** If set, only that role can access */
  requiredRole?: "professional" | "company";
  /** Feature name shown in the wall copy */
  feature?: string;
}

export function SubscriptionGuard({ children, requiredRole, feature }: Props) {
  const { user } = useAuth();
  const { isActive, isExpired, role, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <NoPlanWall />;

  if (isExpired) return <ExpiredWall feature={feature} />;

  if (!isActive) return <NoPlanWall />;

  if (requiredRole && role !== requiredRole)
    return <WrongRoleWall requiredRole={requiredRole} />;

  return <>{children}</>;
}

/* ── No subscription wall ── */
function NoPlanWall() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
        <Lock className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Escolha um plano para continuar</h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          Para acessar esta funcionalidade você precisa assinar um plano Forbin.
          É rápido e leva menos de 2 minutos.
        </p>
      </div>
      <Button asChild className="h-12 rounded-full bg-primary px-8 font-semibold shadow-gold hover:bg-primary/90">
        <Link to="/planos">Ver planos e assinar</Link>
      </Button>
    </div>
  );
}

/* ── Expired subscription wall ── */
function ExpiredWall({ feature }: { feature?: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 border border-destructive/30">
        <AlertTriangle className="h-9 w-9 text-destructive" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Seu plano venceu</h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          {feature
            ? `Para ${feature} você precisa de um plano ativo.`
            : "Renove sua assinatura para voltar a ter acesso completo à plataforma."}
        </p>
      </div>
      <Button asChild className="h-12 rounded-full bg-primary px-8 font-semibold shadow-gold hover:bg-primary/90">
        <Link to="/planos">
          <RefreshCcw className="mr-2 h-4 w-4" /> Renovar assinatura
        </Link>
      </Button>
    </div>
  );
}

/* ── Wrong role wall ── */
function WrongRoleWall({ requiredRole }: { requiredRole: string }) {
  const Icon = requiredRole === "company" ? Building2 : User;
  const label = requiredRole === "company" ? "empresas" : "profissionais";
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
        <Icon className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Acesso restrito</h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          Esta área é exclusiva para {label}. Seu plano atual não dá acesso a este recurso.
        </p>
      </div>
    </div>
  );
}

/* ── Slim expired banner (top of pages) ── */
export function ExpiredBanner() {
  const { isExpired } = useSubscription();
  if (!isExpired) return null;
  return (
    <div className="flex items-center justify-between gap-4 bg-destructive/15 border-b border-destructive/30 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Seu plano venceu — acesso restrito.
      </span>
      <Link to="/planos" className="rounded-full bg-destructive px-4 py-1 text-xs font-bold text-white hover:bg-destructive/80 whitespace-nowrap">
        Renovar agora
      </Link>
    </div>
  );
}
