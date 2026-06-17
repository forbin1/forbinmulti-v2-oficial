import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LockedInfo({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="h-6 w-6" />
      </div>
      <p className="font-display text-base font-bold">Conteúdo exclusivo para assinantes</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message || "Ative um plano (mensal ou anual) para ver as informações completas e o contato."}
      </p>
      <Button asChild className="mt-1 rounded-full">
        <Link to="/minha-assinatura">Ativar plano</Link>
      </Button>
    </div>
  );
}
