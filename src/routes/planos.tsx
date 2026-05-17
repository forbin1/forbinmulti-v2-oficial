import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Zap, Rocket, User, Loader2, ShieldCheck, Star, Building2, ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Assinaturas — FORBIN" },
      {
        name: "description",
        content: "Escolha o plano ideal: Profissional para quem atua na segurança e planos para empresas que contratam.",
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
    price_cents: 33480,
    period: "year",
    description: "Garanta sua presença o ano todo com o mesmo valor mensal.",
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
      } catch {
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const professionals = plans.filter((p) => p.audience === "professional");
  const companies = plans.filter((p) => p.audience === "company");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-20 pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Planos e Assinaturas
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Invista no seu <span className="text-gradient-gold">futuro profissional</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Profissionais e empresas da segurança privada conectados na maior plataforma do Brasil.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ─── PROFISSIONAIS ─── */}
            {professionals.length > 0 && (
              <section className="mt-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Para profissionais</h2>
                    <p className="text-sm text-muted-foreground">Agentes e vigilantes da segurança privada</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Monthly */}
                  {professionals.filter(p => p.period === "month").map(p => (
                    <MonthlyCard key={p.id} plan={p} ctaTo="/cadastro" />
                  ))}
                  {/* Annual — uses monthly price as installment display */}
                  {professionals.filter(p => p.period === "year").map(p => {
                    const monthly = professionals.find(m => m.period === "month");
                    return (
                      <AnnualProfCard
                        key={p.id}
                        plan={p}
                        ctaTo="/cadastro"
                        installmentCents={monthly?.price_cents ?? p.price_cents / 12}
                      />
                    );
                  })}
                  {/* Why subscribe */}
                  <div className="flex flex-col justify-center rounded-3xl border border-dashed border-border/50 bg-card/30 p-8">
                    <Star className="h-8 w-8 text-primary mb-4" />
                    <h3 className="font-display text-xl font-bold">Por que assinar?</h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Acesse vagas exclusivas, cursos e conteúdo para destacar seu currículo. Conecte-se com as melhores empresas de segurança do Brasil.
                    </p>
                    <ul className="mt-5 space-y-2">
                      {["Perfil verificado", "Candidaturas prioritárias", "Suporte especializado"].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ─── EMPRESAS ─── */}
            {companies.length > 0 && (
              <section className="mt-20">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">Para empresas</h2>
                    <p className="text-sm text-muted-foreground">Empresas de segurança privada e contratantes</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {companies.filter(p => p.period === "month").map(p => (
                    <MonthlyCard key={p.id} plan={p} ctaTo="/cadastro-empresa" />
                  ))}
                  {companies.filter(p => p.period === "year").map(p => {
                    const monthly = companies.find(m => m.period === "month");
                    return (
                      <AnnualEmpresaCard
                        key={p.id}
                        plan={p}
                        ctaTo="/cadastro-empresa"
                        installmentCents={p.price_cents / 12}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA Banner */}
        <div className="mt-20 relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-radial-gold opacity-10" />
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
          <h3 className="font-display text-2xl font-bold sm:text-3xl">Dúvidas sobre qual plano escolher?</h3>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Fale com nosso time e receba uma recomendação personalizada para sua operação.
          </p>
          <Button asChild className="mt-6 h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90">
            <Link to="/cadastro-empresa">
              Falar com especialista <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Monthly card (simple) ── */
function MonthlyCard({ plan, ctaTo }: { plan: Plan; ctaTo: string }) {
  const monthly = plan.price_cents / 100;
  return (
    <div className="relative flex flex-col rounded-3xl border border-border/60 bg-card p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{plan.period === "month" ? "Mensal" : "Anual"}</p>
      <h3 className="mt-2 font-display text-2xl font-bold">{plan.name}</h3>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-black">
          R$ {monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
      <ul className="mt-6 space-y-3 flex-1">
        {(plan.features ?? []).map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8 h-12 w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90">
        <Link to={ctaTo}>{plan.cta_label || "Assinar"}</Link>
      </Button>
    </div>
  );
}

/* ── Annual Professional card (highlighted) ── */
function AnnualProfCard({ plan, ctaTo, installmentCents }: { plan: Plan; ctaTo: string; installmentCents: number }) {
  const installment = installmentCents / 100;
  const totalBRL = plan.price_cents / 100;
  return (
    <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/20 via-primary/8 to-transparent p-8 shadow-gold">
      <Badge className="absolute -top-3.5 left-8 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-gold">
        ⭐ Mais escolhido
      </Badge>

      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Anual — Melhor custo-benefício</p>
      <h3 className="mt-2 font-display text-2xl font-bold">{plan.name}</h3>

      {/* Installment inline: R$27,90 12x */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">No cartão</p>
        <div className="flex items-end gap-2">
          <span className="font-display text-5xl font-black text-primary leading-none">
            R$ {installment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-2xl font-bold text-foreground pb-0.5">12x</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          ou no PIX <span className="font-bold text-foreground">R$ {totalBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> à vista
        </p>
      </div>

      {plan.description && <p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>}

      <ul className="mt-6 space-y-3 flex-1">
        {(plan.features ?? []).map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm font-medium">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-8 h-14 w-full rounded-full bg-primary text-base font-bold text-primary-foreground shadow-gold hover:bg-primary/90">
        <Link to={ctaTo}>{plan.cta_label || "Assinar Anual"}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Sem fidelidade. Cancele quando quiser.</p>
    </div>
  );
}

/* ── Annual Empresa card (highlighted) ── */
function AnnualEmpresaCard({ plan, ctaTo, installmentCents }: { plan: Plan; ctaTo: string; installmentCents: number }) {
  const installment = installmentCents / 100;
  const totalBRL = plan.price_cents / 100;
  return (
    <div className="relative flex flex-col rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/20 via-primary/8 to-transparent p-8 shadow-gold">
      <Badge className="absolute -top-3.5 left-8 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-gold">
        ⭐ Mais escolhido
      </Badge>

      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Anual — Máxima performance</p>
      <h3 className="mt-2 font-display text-2xl font-bold">{plan.name}</h3>

      {/* Installment inline: R$250,00 12x */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">No cartão</p>
        <div className="flex items-end gap-2">
          <span className="font-display text-5xl font-black text-primary leading-none">
            R$ {installment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-2xl font-bold text-foreground pb-0.5">12x</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          ou no PIX <span className="font-bold text-foreground">R$ {totalBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> à vista
        </p>
      </div>

      {plan.description && <p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>}

      <ul className="mt-6 space-y-3 flex-1">
        {(plan.features ?? []).map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm font-medium">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-8 h-14 w-full rounded-full bg-primary text-base font-bold text-primary-foreground shadow-gold hover:bg-primary/90">
        <Link to={ctaTo}>{plan.cta_label || "Assinar Anual"}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Contrato anual. Suporte dedicado incluso.</p>
    </div>
  );
}
