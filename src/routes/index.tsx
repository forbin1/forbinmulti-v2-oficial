import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { VslPlayer } from "@/components/VslPlayer";
import {
  Shield,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  GraduationCap,
  MapPin,
  Clock,
  BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import heroImg from "@/assets/hero-security.jpg";
import { JOBS, COURSES } from "@/data/mock";
import { useLandingContent } from "@/hooks/use-landing-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORBIN MultiEmpresas — Vagas em segurança privada" },
      {
        name: "description",
        content:
          "Encontre vagas, candidate-se e construa seu currículo profissional na maior plataforma de segurança privada do Brasil.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { content: c } = useLandingContent();
  useEffect(() => {
    if (!loading && user) {
      const target = role === "admin" ? "/admin" : role === "company" ? "/profissionais-ativos" : "/vagas";
      navigate({ to: target, replace: true });
    }
  }, [loading, user, role, navigate]);
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="absolute inset-0 -z-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge className="mb-6 w-fit gap-2 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {c.hero_eyebrow}
            </Badge>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {c.hero_title_1}{" "}
              <span className="text-gradient-gold">{c.hero_title_highlight}</span>{" "}
              {c.hero_title_2}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
              {c.hero_subtitle}
            </p>

            <div className="mt-8 lg:hidden">
              <VslPlayer />
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
                <Link to="/cadastro">
                  {c.hero_cta_pro} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-border bg-surface px-8 text-base font-semibold hover:bg-accent">
                <Link to="/cadastro-empresa">
                  {c.hero_cta_company}
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
              <Stat value={c.stat1_value} label={c.stat1_label} />
              <Stat value={c.stat2_value} label={c.stat2_label} />
              <Stat value={c.stat3_value} label={c.stat3_label} />
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-gold opacity-20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 shadow-elevated">
              <VslPlayer />
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {c.how_eyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {c.how_title}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: c.how_step1_title, desc: c.how_step1_desc },
              { icon: Briefcase, title: c.how_step2_title, desc: c.how_step2_desc },
              { icon: Shield, title: c.how_step3_title, desc: c.how_step3_desc },
            ].map((s, i) => (
              <Card key={s.title} className="group relative overflow-hidden border-border/60 bg-card transition hover:border-primary/40">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="font-display text-5xl font-extrabold text-primary/15">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE DE VAGAS */}
      <section id="vagas" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {c.jobs_eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {c.jobs_title}
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                {c.jobs_subtitle}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/vagas">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {JOBS.slice(0, 6).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>

      {/* CURSOS / FORMAÇÕES */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Formações reconhecidas
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Cursos que validamos
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {COURSES.map((course) => (
              <div
                key={course}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-5 transition hover:border-primary/40"
              >
                <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-medium">{course}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA EMPRESAS */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {c.company_eyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {c.company_title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {c.company_subtitle}
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Painel admin com candidatos em tempo real",
                "Filtros por curso, região e experiência",
                "Agenda integrada para reuniões e entrevistas",
                "Selo de empresa verificada FORBIN",
              ].map((it) => (
                <li key={it} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-10 h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              <Link to="/cadastro-empresa">
                Cadastrar empresa <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-elevated">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Painel Empresa</p>
                    <p className="font-semibold">Vigilância Total LTDA</p>
                  </div>
                </div>
                <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                  Verificada
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Vagas" value="12" />
                <MetricCard label="Candidatos" value="248" />
                <MetricCard label="Reuniões" value="9" />
              </div>

              <div className="mt-6 space-y-3">
                {JOBS.slice(0, 3).map((j) => (
                  <div key={j.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface p-4">
                    <div>
                      <p className="text-sm font-semibold">{j.title}</p>
                      <p className="text-xs text-muted-foreground">{j.location}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-primary/15 text-primary">
                      {j.applicants} candidatos
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold opacity-60" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            {c.cta_title}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {c.cta_subtitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-14 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              <Link to="/cadastro">{c.cta_btn_primary}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-border bg-surface px-10 text-base font-semibold">
              <Link to="/vagas">{c.cta_btn_secondary}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4 text-center">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function JobCard({ job }: { job: typeof JOBS[number] }) {
  return (
    <Link
      to="/vagas/$jobId"
      params={{ jobId: job.id }}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition hover:border-primary/50 hover:shadow-gold"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-lg font-bold">
          {job.companyInitials}
        </div>
        <Badge variant="secondary" className="rounded-full bg-surface-elevated text-xs text-muted-foreground">
          {job.type}
        </Badge>
      </div>
      <h3 className="text-lg font-semibold leading-tight transition group-hover:text-primary">
        {job.title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" /> {job.shift}
        </span>
        <span className="flex items-center gap-1.5">
          <BadgeDollarSign className="h-3.5 w-3.5 text-primary" /> {job.salary}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-xs text-muted-foreground">{job.posted}</span>
        <span className="text-xs font-semibold text-primary">{job.applicants} candidatos</span>
      </div>
    </Link>
  );
}
