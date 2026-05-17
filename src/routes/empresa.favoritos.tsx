import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/empresa/favoritos")({
  component: EmpresaFavoritos,
});

function EmpresaFavoritos() {
  return (
    <div className="p-6 sm:p-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Favoritos</h1>
      <p className="text-muted-foreground mt-1">Seus profissionais e currículos salvos.</p>
      
      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">Em desenvolvimento.</p>
      </div>
    </div>
  );
}
