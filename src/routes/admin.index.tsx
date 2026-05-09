import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CreditCard,
  UserCheck,
  GraduationCap,
  Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stats = {
  professionals: number;
  companies: number;
  jobs: number;
  courses: number;
  certificates: number;
  enrollments: number;
  professionalPriceCents: number;
  companyPriceCents: number;
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const [p, c, j, co, ce, en, plansRes] = await Promise.all([
        supabase.from("profiles").select("*", head),
        supabase.from("companies").select("*", head),
        supabase.from("jobs").select("*", head).eq("is_published", true),
        supabase.from("courses").select("*", head),
        supabase.from("certificates").select("*", head),
        supabase.from("enrollments").select("*", head),
        supabase
          .from("plans")
          .select("audience, price_cents, sort_order")
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
      ]);

      const plans = plansRes.data ?? [];
      const proPlan = plans.find((pl) => pl.audience === "professional");
      const compPlan = plans.find((pl) => pl.audience === "company");

      setStats({
        professionals: p.count ?? 0,
        companies: c.count ?? 0,
        jobs: j.count ?? 0,
        courses: co.count ?? 0,
        certificates: ce.count ?? 0,
        enrollments: en.count ?? 0,
        professionalPriceCents: proPlan?.price_cents ?? 0,
        companyPriceCents: compPlan?.price_cents ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const fmtBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const proRevenue = ((stats?.professionals ?? 0) * (stats?.professionalPriceCents ?? 0)) / 100;
  const compRevenue = ((stats?.companies ?? 0) * (stats?.companyPriceCents ?? 0)) / 100;
  const monthly = proRevenue + compRevenue;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={LayoutDashboard}
        eyebrow="Visão geral"
        title="Dashboard"
        description="Métricas em tempo real da plataforma."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          icon={CreditCard}
          label="Receita mensal estimada"
          value={loading ? "—" : fmtBRL(monthly)}
          hint="Profissionais + Empresas"
          highlight
        />
        <Card
          icon={Users}
          label="Receita — Profissionais"
          value={loading ? "—" : fmtBRL(proRevenue)}
          hint={`${stats?.professionals ?? 0} × ${fmtBRL((stats?.professionalPriceCents ?? 0) / 100)}`}
        />
        <Card
          icon={Building2}
          label="Receita — Empresas"
          value={loading ? "—" : fmtBRL(compRevenue)}
          hint={`${stats?.companies ?? 0} × ${fmtBRL((stats?.companyPriceCents ?? 0) / 100)}`}
        />
        <Card
          icon={Users}
          label="Assinantes ativos"
          value={loading ? "—" : String((stats?.professionals ?? 0) + (stats?.companies ?? 0))}
        />
        <Card
          icon={Building2}
          label="Empresas ativas"
          value={loading ? "—" : String(stats?.companies ?? 0)}
        />
        <Card
          icon={Users}
          label="Profissionais ativos"
          value={loading ? "—" : String(stats?.professionals ?? 0)}
        />
        <Card
          icon={UserCheck}
          label="Profissionais empregados"
          value="—"
          hint="Em breve"
        />
        <Card
          icon={Briefcase}
          label="Vagas ativas"
          value={loading ? "—" : String(stats?.jobs ?? 0)}
        />
        <Card
          icon={GraduationCap}
          label="Cursos publicados"
          value={loading ? "—" : String(stats?.courses ?? 0)}
        />
        <Card
          icon={Award}
          label="Certificados emitidos"
          value={loading ? "—" : String(stats?.certificates ?? 0)}
        />
        <Card
          icon={GraduationCap}
          label="Matrículas"
          value={loading ? "—" : String(stats?.enrollments ?? 0)}
        />
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-border/60 p-6 " +
        (highlight ? "bg-gradient-to-br from-primary/15 to-primary/5" : "bg-card")
      }
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
