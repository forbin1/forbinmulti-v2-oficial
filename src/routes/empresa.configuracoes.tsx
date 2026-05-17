import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/empresa/configuracoes")({
  component: EmpresaConfiguracoes,
});

function EmpresaConfiguracoes() {
  return (
    <div className="p-6 sm:p-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="text-muted-foreground mt-1">Preferências de conta e senha.</p>
      
      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">Em desenvolvimento.</p>
      </div>
    </div>
  );
}
