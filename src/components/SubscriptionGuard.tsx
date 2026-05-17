import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, RefreshCcw, AlertTriangle, Building2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  children: ReactNode;
  requiredRole?: "professional" | "company";
  feature?: string;
  /** If true, shows a blurred preview instead of full wall */
  preview?: boolean;
}

export function SubscriptionGuard({ children, requiredRole, feature, preview }: Props) {
  const { user } = useAuth();
  const { isActive, isExpired, isFree, role, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.email === "admin@gmail.com") return <>{children}</>;

  if (!user) return <FreeWall feature={feature} />;

  if (requiredRole && role !== requiredRole) return <WrongRoleWall requiredRole={requiredRole} />;

  if (isExpired) return <ExpiredWall feature={feature} />;

  if (!isActive) return preview
    ? <BlurredPreview feature={feature}>{children}</BlurredPreview>
    : <FreeWall feature={feature} />;

  return <>{children}</>;
}

/* ── Slim inline paywall (for buttons/actions) ── */
export function FeatureGate({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user } = useAuth();
  const { isActive, loading } = useSubscription();
  if (loading) return null;
  if (isActive || user?.email === "admin@gmail.com") return <>{children}</>;
  return (
    <Link to="/planos" title={`Assine para ${feature ?? "acessar"}`}>
      <div className="relative cursor-pointer group">
        <div className="pointer-events-none opacity-40 blur-[1px] select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-gold">
            <Lock className="h-3.5 w-3.5" /> Assinar plano
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Blurred preview overlay ── */
function BlurredPreview({ children, feature }: { children: ReactNode; feature?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none blur-md opacity-40">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-sm">
        <Lock className="h-8 w-8 text-primary" />
        <p className="font-semibold text-center px-4">
          {feature ? `Assine um plano para ${feature}` : "Assine para desbloquear"}
        </p>
        <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground shadow-gold hover:bg-primary/90">
          <Link to="/planos">Ver planos</Link>
        </Button>
      </div>
    </div>
  );
}

/* ── Free tier full wall ── */
function FreeWall({ feature }: { feature?: string }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
        <Zap className="h-9 w-9 text-primary" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Conta gratuita</p>
        <h2 className="font-display text-2xl font-bold">
          {feature ? `Assine para ${feature}` : "Assine para desbloquear"}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-sm">
          Sua conta está no plano gratuito. Escolha um plano para ter acesso completo à plataforma.
        </p>
      </div>
      <Button asChild className="h-12 rounded-full bg-primary px-8 font-semibold shadow-gold hover:bg-primary/90">
        <Link to="/planos">Ver planos e preços</Link>
      </Button>
      <p className="text-xs text-muted-foreground">
        Já assinou? <button onClick={() => window.location.reload()} className="text-primary underline">Recarregar</button>
      </p>
    </div>
  );
}

/* ── Expired subscription wall ── */
function ExpiredWall({ feature }: { feature?: string }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 border border-destructive/30">
        <AlertTriangle className="h-9 w-9 text-destructive" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-destructive mb-2">Plano vencido</p>
        <h2 className="font-display text-2xl font-bold">Seu plano expirou</h2>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-sm">
          {feature
            ? `Para ${feature} você precisa de um plano ativo.`
            : "Renove sua assinatura para recuperar acesso completo à plataforma."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild className="h-12 rounded-full bg-primary px-8 font-semibold shadow-gold hover:bg-primary/90">
          <Link to="/planos"><RefreshCcw className="mr-2 h-4 w-4" /> Renovar plano</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-full px-6">
          <Link to="/minha-assinatura">Minha assinatura</Link>
        </Button>
      </div>
    </div>
  );
}

/* ── Wrong role ── */
function WrongRoleWall({ requiredRole }: { requiredRole: string }) {
  const label = requiredRole === "company" ? "empresas" : "profissionais";
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
        <Building2 className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Área exclusiva para {label}</h2>
        <p className="mt-2 text-muted-foreground text-sm">Seu plano atual não dá acesso a este recurso.</p>
      </div>
    </div>
  );
}

/* ── Global slim expired banner (in root layout) ── */
export function ExpiredBanner() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  if (!isExpired || user?.email === "admin@gmail.com") return null;
  return (
    <div className="flex items-center justify-between gap-4 bg-destructive/15 border-b border-destructive/30 px-4 py-2.5 text-sm z-50">
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
