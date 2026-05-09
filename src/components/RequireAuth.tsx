import { Link, useLocation } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/** Bloqueia visualmente um conteúdo até o usuário logar. */
export function RequireAuth({
  children,
  title = "Conteúdo exclusivo para membros",
  description = "Crie sua conta gratuita ou faça login para continuar.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (user) return <>{children}</>;

  const redirect = encodeURIComponent(location.pathname);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-full bg-primary px-6 text-primary-foreground shadow-gold hover:bg-primary/90">
          <Link to="/cadastro" search={{ redirect } as never}>Criar conta</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link to="/login" search={{ redirect } as never}>Entrar</Link>
        </Button>
      </div>
    </div>
  );
}

/** Helper: chame antes de uma ação que exige login (curtir, candidatar, comentar...). */
export function useAuthGate() {
  const { user } = useAuth();
  return (action: () => void, message = "Faça login para continuar") => {
    if (!user) {
      toast.error(message, {
        action: { label: "Entrar", onClick: () => (window.location.href = "/login") },
      });
      return false;
    }
    action();
    return true;
  };
}
