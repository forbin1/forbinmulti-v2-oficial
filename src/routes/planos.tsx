import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Zap, Rocket, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Assinaturas — FORBIN" },
      {
        name: "description",
        content:
          "Escolha o plano ideal: Profissional para quem atua na segurança e planos para empresas que contratam.",
      },
    ],
  }),
  component: PlanosPage,
});

type Plan = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  price_cents: number;
  period: string;
  description: string | null;
  features: string[];
  cta_label: string | null;
  highlight: boolean;
  sort_order: number;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function pickIcon(slug: string, audience: string) {
  if (audience === "professional") return User;
  if (slug.includes("premium")) return Rocket;
  return Zap;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "p1",
    slug: "profissional-mensal",
    name: "Profissional Mensal",
    audience: "professional",
    price_cents: 2790,
    period: "month",
    description: "Ideal para quem está buscando novas oportunidades.",
    features: ["Acesso a todas as vagas", "Candidaturas ilimitadas", "Selo de Profissional Verificado", "Destaque no topo das buscas"],
    cta_label: "Assinar Mensal",
    highlight: false,
    sort_order: 1
  },
  {
    id: "p2",
    slug: "profissional-anual",
    name: "Profissional Anual",
    audience: "professional",
    price_cents: 29790,
    period: "year",
    description: "Economize 10% e garanta sua presença o ano todo.",
    features: ["Todos os benefícios do Mensal", "Suporte prioritário", "Acesso a cursos exclusivos", "Análise de currículo por especialistas"],
    cta_label: "Assinar Anual",
    highlight: true,
    sort_order: 2
  },
  {
    id: "c1",
    slug: "empresa-mensal",
    name: "Empresa Mensal",
    audience: "company",
    price_cents: 29790,
    period: "month",
    description: "Perfeito para recrutamento pontual e ágil.",
    features: ["Publicação de até 10 vagas", "Acesso ao banco de profissionais", "Filtros avançados de busca", "Painel de gestão de candidatos"],
    cta_label: "Começar Agora",
    highlight: false,
    sort_order: 3
  },
  {
    id: "c2",
    slug: "empresa-anual",
    name: "Empresa Anual",
    audience: "company",
    price_cents: 300000,
    period: "year",
    description: "Solução completa para grandes operações.",
    features: ["Publicação de vagas ilimitadas", "Acesso ilimitado ao banco", "API de integração (opcional)", "Gerente de conta dedicado", "Destaque da marca na plataforma"],
    cta_label: "Assinar Anual",
    highlight: true,
    sort_order: 4
  }
];

function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });
        
        if (error || !data || data.length === 0) {
          setPlans(DEFAULT_PLANS);
        } else {
          setPlans(((data as any) ?? []) as Plan[]);
        }
      } catch (err) {
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const professionals = plans.filter((p) => p.audience === "professional");
  const companies = plans.filter((p) => p.audience === "company");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Planos e assinaturas
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Escolha o plano ideal para você
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Profissionais e empresas da segurança privada conectados em uma única plataforma.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {professionals.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 font-display text-2xl font-bold">Para profissionais</h2>
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {professionals.map((p) => (
                  <PlanCard key={p.id} plan={p} ctaTo="/cadastro" />
                ))}
                <div className="flex flex-col justify-center rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 xl:col-span-1 lg:col-span-2">
                  <h3 className="font-display text-xl font-bold">Por que assinar?</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Acesse vagas exclusivas, conteúdo da comunidade e cursos para destacar
                    seu currículo no mercado de segurança privada. Conecte-se com as melhores empresas do Brasil.
                  </p>
                </div>
              </div>
            </section>
          )}

          {companies.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-6 font-display text-2xl font-bold">Para empresas</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {companies.map((p) => (
                  <PlanCard key={p.id} plan={p} ctaTo="/cadastro-empresa" />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-20 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-10 text-center">
        <h3 className="font-display text-2xl font-bold">Dúvidas sobre qual plano escolher?</h3>
        <p className="mt-2 text-muted-foreground">
          Fale com nosso time e receba uma recomendação personalizada para sua operação.
        </p>
        <Button asChild className="mt-6 h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
          <Link to="/cadastro-empresa">Falar com especialista</Link>
        </Button>
      </div>
    </div>
  );
}

function PlanCard({ plan, ctaTo }: { plan: Plan; ctaTo: string }) {
  const Icon = pickIcon(plan.slug, plan.audience);
  const periodLabel = plan.period === "month" ? "/mês" : plan.period === "year" ? "/ano" : "";
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-8 ${
        plan.highlight
          ? "border-primary bg-gradient-to-br from-primary/15 to-transparent shadow-gold"
          : "border-border/60 bg-card"
      }`}
    >
      {plan.highlight && (
        <Badge className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-primary-foreground">
          Mais escolhido
        </Badge>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            plan.highlight ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold">{formatBRL(plan.price_cents)}</span>
        <span className="text-muted-foreground">{periodLabel}</span>
      </div>
      {plan.description && (
        <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
      )}

      <ul className="mt-6 space-y-3">
        {(plan.features ?? []).map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={`mt-8 h-12 rounded-full font-semibold ${
          plan.highlight
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        <Link to={ctaTo}>{plan.cta_label || "Assinar"}</Link>
      </Button>
    </div>
  );
}
