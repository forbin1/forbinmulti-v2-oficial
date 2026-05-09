import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOBS } from "@/data/mock";
import { usePosts } from "@/hooks/use-posts";
import { ComposeBox, PostCard } from "./profissional";
import { ADS, AdBanner } from "@/components/AdBanner";
import { Fragment } from "react";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Experiências — FORBIN MultiEmpresas" },
      { name: "description", content: "Acompanhe experiências de profissionais e empresas do setor de segurança privada." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <RequireAuth
      title="Experiências exclusivas para membros"
      description="Aqui profissionais e empresas compartilham experiências do dia a dia. Cadastre-se grátis para participar."
    >
      <FeedContent />
    </RequireAuth>
  );
}

function FeedContent() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Esquerda */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold font-bold text-primary-foreground text-2xl">
              CM
            </div>
            <p className="mt-3 font-semibold">Carlos Mendes</p>
            <p className="text-xs text-muted-foreground">Vigilante Líder</p>
            <Button asChild variant="outline" className="mt-4 w-full rounded-full">
              <Link to="/profissional">Ver meu perfil</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Atalhos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/candidaturas" className="block rounded-lg px-3 py-2 hover:bg-accent">📋 Minhas candidaturas</Link></li>
              <li><Link to="/favoritos" className="block rounded-lg px-3 py-2 hover:bg-accent">⭐ Favoritos</Link></li>
              <li><Link to="/cursos" className="block rounded-lg px-3 py-2 hover:bg-accent">🏆 Cursos</Link></li>
            </ul>
          </div>
        </aside>

        {/* Centro — feed */}
        <div className="min-w-0 space-y-6">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Experiências</h1>
          <ComposeBox />
          {usePosts().map((p, idx) => (
            <Fragment key={p.id}>
              <PostCard post={p} owned={idx === 0} />
              {(idx + 1) % 2 === 0 && (
                <AdBanner ad={ADS[Math.floor(idx / 2) % ADS.length]} />
              )}
            </Fragment>
          ))}
        </div>

        {/* Direita — escondida no mobile/tablet */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Vagas em alta</h3>
            </div>
            <ul className="space-y-3">
              {JOBS.slice(0, 4).map((j) => (
                <li key={j.id}>
                  <Link
                    to="/vagas/$jobId"
                    params={{ jobId: j.id }}
                    className="block rounded-xl border border-border/60 bg-surface p-3 transition hover:border-primary/40"
                  >
                    <p className="text-sm font-semibold">{j.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{j.location} · {j.salary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </aside>
      </div>
    </div>
  );
}
