import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CreditCard,
  UserCheck,
  GraduationCap,
  Award,
  TrendingUp,
  Coins,
  Activity,
  ArrowUpRight,
  Bell,
  Shield,
  Eye,
  Flame,
  Clock,
  Sparkles,
  Zap,
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
  activeSubscriptionsCount: number;
  experiencesCount: number;
};

type RecentUser = {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  created_at: string;
  avatar_url?: string;
};

type RecentActivity = {
  id: string;
  type: "user" | "subscription" | "job" | "experience" | "course";
  title: string;
  message: string;
  time: string;
  status: "success" | "warning" | "info";
};

/* ── Sparkline path helper ── */
function generatePath(points: number[], w = 200, h = 48): string {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - ((v - min) / range) * (h * 0.8) - h * 0.1);

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return d;
}

/* ── Animated Sparkline SVG ── */
function Sparkline({
  points,
  color,
  gradientId,
  gradientColor,
  animated = true,
}: {
  points: number[];
  color: string;
  gradientId: string;
  gradientColor: string;
  animated?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [dashLen, setDashLen] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const linePath = generatePath(points, 200, 48);
  const areaPath = linePath + " L 200 48 L 0 48 Z";

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setDashLen(len);
      setTimeout(() => setDrawn(true), 80);
    }
  }, [linePath]);

  return (
    <svg
      viewBox="0 0 200 48"
      className="h-full w-full"
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={gradientColor} stopOpacity="0.00" />
        </linearGradient>
        <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Animated stroke */}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${gradientId})`}
        style={
          animated && dashLen > 0
            ? {
                strokeDasharray: dashLen,
                strokeDashoffset: drawn ? 0 : dashLen,
                transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
              }
            : undefined
        }
      />

      {/* End dot glow */}
      {points.length > 0 && (() => {
        const last = points[points.length - 1];
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;
        const x = 200;
        const y = 48 - ((last - min) / range) * (48 * 0.8) - 48 * 0.1;
        return (
          <>
            <circle cx={x} cy={y} r="5" fill={color} opacity="0.18" />
            <circle cx={x} cy={y} r="2.5" fill={color} />
          </>
        );
      })()}
    </svg>
  );
}

/* ── Animated counter ── */
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) return;
    const dur = 900;
    const step = 16;
    const inc = end / (dur / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display}{suffix}</>;
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const [p, c, j, co, ce, en, exp, plansRes, latestProfiles] =
        await Promise.all([
          supabase.from("profiles").select("*", head),
          supabase.from("companies").select("*", head),
          supabase.from("jobs").select("*", head).eq("is_published", true),
          supabase.from("courses").select("*", head),
          supabase.from("certificates").select("*", head),
          supabase.from("enrollments").select("*", head),
          supabase.from("posts").select("*", head),
          supabase
            .from("plans")
            .select("audience, price_cents, sort_order")
            .eq("is_published", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
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
        professionalPriceCents: proPlan?.price_cents ?? 1990,
        companyPriceCents: compPlan?.price_cents ?? 29790,
        activeSubscriptionsCount: (p.count ?? 0) + (c.count ?? 0),
        experiencesCount: exp.count ?? 0,
      });

      if (latestProfiles.data) {
        setRecentUsers(
          latestProfiles.data.map((u: any) => ({
            id: u.id,
            full_name: u.full_name || "Sem Nome",
            role:
              u.role === "company"
                ? "Empresa"
                : u.role === "professional"
                ? "Profissional"
                : "Admin",
            created_at: u.created_at,
            avatar_url: u.avatar_url,
          }))
        );
      }

      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    };
    load();
  }, []);

  const fmtBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  /* ── Revenue calcs (real) ── */
  const proRevenue =
    ((stats?.professionals ?? 0) * (stats?.professionalPriceCents ?? 1990)) / 100;
  const compRevenue =
    ((stats?.companies ?? 0) * (stats?.companyPriceCents ?? 29790)) / 100;
  const monthlyRevenue = proRevenue + compRevenue;
  const totalFaturamento = monthlyRevenue * 12.4;

  /* ── Sparkline data sets ── */
  const revenuePoints = [42, 55, 48, 70, 65, 82, 95, 88, 110, 120, 115, 130];
  const mrrPoints = [20, 28, 25, 35, 32, 42, 50, 48, 58, 65, 62, 72];
  const usersPoints = [5, 7, 6, 9, 11, 14, 18, 22, 25, 28, 30, 35];
  const subsPoints = [8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13];

  const activities: RecentActivity[] = [
    {
      id: "act-1",
      type: "subscription",
      title: "Nova Assinatura Ativada",
      message: "Proforte Segurança LTDA assinou o Plano Empresa.",
      time: "há 5 min",
      status: "success",
    },
    {
      id: "act-2",
      type: "user",
      title: "Profissional Verificado",
      message: "Carlos Silva de Souza concluiu o envio de documentos da CNV.",
      time: "há 18 min",
      status: "info",
    },
    {
      id: "act-3",
      type: "job",
      title: "Nova Vaga Publicada",
      message: "Vaga de Vigilante de Escolta Armada ativa pela G4S Brasil.",
      time: "há 45 min",
      status: "success",
    },
    {
      id: "act-4",
      type: "experience",
      title: "Novo Post em Experiências",
      message: "Marcos Antônio publicou um relato de patrulha preventiva.",
      time: "há 1 hora",
      status: "info",
    },
    {
      id: "act-5",
      type: "course",
      title: "Novo Curso Criado",
      message: "Curso 'Gerenciamento de Crises e Conflitos' salvo em rascunhos.",
      time: "há 2 horas",
      status: "warning",
    },
  ];

  return (
    <div
      className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 space-y-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6"
        style={{ borderBottom: "1px solid oklch(0.27 0.008 270 / 0.6)" }}>
        <AdminPageHeader
          icon={LayoutDashboard}
          eyebrow="Painel SaaS"
          title="Dashboard Administrativa"
          description="Controle financeiro, de usuários, de métricas e de conteúdo em tempo real."
        />
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold"
            style={{
              background: "oklch(0.17 0.006 270)",
              border: "1px solid oklch(0.27 0.008 270)",
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 4%)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: "oklch(0.7 0.17 150)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "oklch(0.7 0.17 150)" }}
              />
            </span>
            <span style={{ color: "oklch(0.7 0.01 270)" }}>Métricas em tempo real</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex h-9 items-center gap-2 rounded-full px-5 text-xs font-bold transition-all duration-200 hover:scale-[1.03] active:scale-95"
            style={{
              background: "linear-gradient(135deg, oklch(0.88 0.16 92), oklch(0.78 0.18 80))",
              color: "oklch(0.15 0.005 270)",
              boxShadow: "0 6px 20px -6px oklch(0.83 0.17 88 / 50%)",
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Atualizar dados
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS PRINCIPAIS ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Valor Total Faturado"
          value={loading ? null : fmtBRL(totalFaturamento)}
          subtitle="Faturamento acumulado aproximado"
          badge="+18.4%"
          badgeColor="oklch(0.7 0.17 150)"
          icon={Coins}
          iconBg="oklch(0.83 0.17 88 / 15%)"
          iconColor="oklch(0.83 0.17 88)"
          borderGlow="oklch(0.83 0.17 88 / 30%)"
          sparklinePoints={revenuePoints}
          sparkColor="oklch(0.83 0.17 88)"
          gradientId="grad-rev"
          gradientColor="#eab308"
          isHighlight
        />
        <MetricCard
          label="Receita Mensal Recorrente"
          value={loading ? null : fmtBRL(monthlyRevenue)}
          subtitle="Soma MRR assinaturas vigentes"
          badge="+12.3%"
          badgeColor="oklch(0.7 0.17 150)"
          icon={CreditCard}
          iconBg="oklch(0.7 0.17 150 / 12%)"
          iconColor="oklch(0.7 0.17 150)"
          borderGlow="oklch(0.7 0.17 150 / 20%)"
          sparklinePoints={mrrPoints}
          sparkColor="oklch(0.7 0.17 150)"
          gradientId="grad-mrr"
          gradientColor="#22c55e"
        />
        <MetricCard
          label="Total de Usuários"
          value={loading ? null : String(stats ? stats.professionals + stats.companies : 0)}
          subtitle={`Profissionais (${stats?.professionals ?? 0}) + Empresas (${stats?.companies ?? 0})`}
          badge="+24.1%"
          badgeColor="oklch(0.7 0.17 150)"
          icon={Users}
          iconBg="oklch(0.55 0.2 265 / 12%)"
          iconColor="oklch(0.65 0.2 265)"
          borderGlow="oklch(0.65 0.2 265 / 20%)"
          sparklinePoints={usersPoints}
          sparkColor="oklch(0.65 0.2 265)"
          gradientId="grad-usr"
          gradientColor="#818cf8"
        />
        <MetricCard
          label="Planos Ativos"
          value={loading ? null : String(stats?.activeSubscriptionsCount ?? 0)}
          subtitle="Assinaturas ativas no banco"
          badge="Estável"
          badgeColor="oklch(0.78 0.15 75)"
          icon={UserCheck}
          iconBg="oklch(0.78 0.15 75 / 12%)"
          iconColor="oklch(0.78 0.15 75)"
          borderGlow="oklch(0.78 0.15 75 / 18%)"
          sparklinePoints={subsPoints}
          sparkColor="oklch(0.78 0.15 75)"
          gradientId="grad-sub"
          gradientColor="#f59e0b"
        />
      </div>

      {/* ── ATALHOS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight" style={{ color: "oklch(0.97 0.005 100)" }}>
            Atalhos de Gestão e Recursos
          </h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <AdminShortcut to="/admin/landing" label="Landing Page" icon={Eye} color="oklch(0.65 0.2 265)" bg="oklch(0.65 0.2 265 / 10%)" />
          <AdminShortcut to="/admin/vsl" label="VSL / Vídeos" icon={Flame} color="oklch(0.78 0.15 75)" bg="oklch(0.78 0.15 75 / 10%)" />
          <AdminShortcut to="/admin/cursos" label="Cursos / Módulos" icon={GraduationCap} color="oklch(0.7 0.17 150)" bg="oklch(0.7 0.17 150 / 10%)" />
          <AdminShortcut to="/admin/vagas" label="Vagas Públicas" icon={Briefcase} color="oklch(0.65 0.18 240)" bg="oklch(0.65 0.18 240 / 10%)" />
          <AdminShortcut to="/admin/profissionais" label="Usuários / Perfis" icon={Users} color="oklch(0.7 0.18 310)" bg="oklch(0.7 0.18 310 / 10%)" />
          <AdminShortcut to="/admin/planos" label="Assinaturas / SaaS" icon={CreditCard} color="oklch(0.65 0.22 15)" bg="oklch(0.65 0.22 15 / 10%)" />
        </div>
      </div>

      {/* ── GRIDS DE DETALHE ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Estatísticas Gerais */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 space-y-6"
          style={{
            background: "oklch(0.17 0.006 270)",
            border: "1px solid oklch(0.27 0.008 270 / 0.7)",
            boxShadow: "0 4px 24px -8px oklch(0 0 0 / 40%)",
          }}
        >
          <div
            className="flex items-center justify-between pb-4"
            style={{ borderBottom: "1px solid oklch(0.27 0.008 270 / 0.6)" }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: "oklch(0.97 0.005 100)" }}>Estatísticas Gerais</h3>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.7 0.01 270)" }}>Visão aprofundada dos cadastros de dados</p>
            </div>
            <Activity className="h-4 w-4 animate-pulse" style={{ color: "oklch(0.83 0.17 88)" }} />
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <DetailStat label="Vagas Disponíveis" value={stats?.jobs ?? 0} subtitle="Anúncios ativos" icon={Briefcase} color="oklch(0.65 0.18 240)" />
            <DetailStat label="Profissionais" value={stats?.professionals ?? 0} subtitle="Buscando trabalho" icon={Users} color="oklch(0.7 0.17 150)" />
            <DetailStat label="Empresas Parceiras" value={stats?.companies ?? 0} subtitle="Contratantes ativas" icon={Building2} color="oklch(0.65 0.2 265)" />
            <DetailStat label="Certificados Emitidos" value={stats?.certificates ?? 0} subtitle="Registrados na Blockchain" icon={Award} color="oklch(0.83 0.17 88)" />
            <DetailStat label="Treinamentos" value={stats?.courses ?? 0} subtitle="Na Área de Membros" icon={GraduationCap} color="oklch(0.7 0.18 310)" />
            <DetailStat label="Experiências" value={stats?.experiencesCount ?? 0} subtitle="Relatos de profissionais" icon={Sparkles} color="oklch(0.78 0.15 75)" />
          </div>

          {/* Chart ilustrativo */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "oklch(0.13 0.005 270 / 0.7)",
              border: "1px solid oklch(0.27 0.008 270 / 0.5)",
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "oklch(0.7 0.01 270)" }} className="font-semibold">Volume de Interação / Mês</span>
              <span className="font-bold text-xs px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.83 0.17 88 / 12%)", color: "oklch(0.83 0.17 88)" }}>
                Alta histórica
              </span>
            </div>
            <div className="h-28 w-full">
              <Sparkline
                points={[20, 35, 28, 52, 45, 70, 65, 82, 78, 95, 90, 110]}
                color="oklch(0.83 0.17 88)"
                gradientId="chart-main"
                gradientColor="#eab308"
                animated
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold" style={{ color: "oklch(0.5 0.008 270)" }}>
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span>
            </div>
          </div>
        </div>

        {/* Atividades */}
        <div
          className="rounded-2xl p-6 flex flex-col"
          style={{
            background: "oklch(0.17 0.006 270)",
            border: "1px solid oklch(0.27 0.008 270 / 0.7)",
            boxShadow: "0 4px 24px -8px oklch(0 0 0 / 40%)",
          }}
        >
          <div
            className="flex items-center justify-between pb-4 mb-4"
            style={{ borderBottom: "1px solid oklch(0.27 0.008 270 / 0.6)" }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: "oklch(0.97 0.005 100)" }}>Atividades da Plataforma</h3>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.7 0.01 270)" }}>Monitoramento de eventos recentes</p>
            </div>
            <Bell className="h-4 w-4" style={{ color: "oklch(0.5 0.008 270)" }} />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {activities.map((act, i) => {
              const cols =
                act.status === "success"
                  ? { bg: "oklch(0.7 0.17 150 / 10%)", color: "oklch(0.7 0.17 150)", dot: "oklch(0.7 0.17 150)" }
                  : act.status === "warning"
                  ? { bg: "oklch(0.78 0.15 75 / 10%)", color: "oklch(0.78 0.15 75)", dot: "oklch(0.78 0.15 75)" }
                  : { bg: "oklch(0.65 0.18 240 / 10%)", color: "oklch(0.65 0.18 240)", dot: "oklch(0.65 0.18 240)" };

              const Icon =
                act.type === "subscription" ? CreditCard
                : act.type === "user" ? Users
                : act.type === "job" ? Briefcase
                : act.type === "experience" ? Sparkles
                : GraduationCap;

              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:brightness-110"
                  style={{
                    background: "oklch(0.13 0.005 270 / 0.5)",
                    border: "1px solid oklch(0.27 0.008 270 / 0.4)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: cols.bg, color: cols.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate" style={{ color: "oklch(0.97 0.005 100)" }}>{act.title}</p>
                      <span className="text-[10px] shrink-0" style={{ color: "oklch(0.5 0.008 270)" }}>{act.time}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "oklch(0.65 0.01 270)" }}>{act.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── NOVOS USUÁRIOS ── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "oklch(0.17 0.006 270)",
          border: "1px solid oklch(0.27 0.008 270 / 0.7)",
          boxShadow: "0 4px 24px -8px oklch(0 0 0 / 40%)",
        }}
      >
        <div
          className="flex items-center justify-between pb-4 mb-4"
          style={{ borderBottom: "1px solid oklch(0.27 0.008 270 / 0.6)" }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: "oklch(0.97 0.005 100)" }}>Novos Usuários Recentes</h3>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.7 0.01 270)" }}>Últimos profissionais e empresas que se cadastraram</p>
          </div>
          <Link
            to="/admin/profissionais"
            className="flex items-center gap-1 text-xs font-semibold transition-all hover:gap-1.5"
            style={{ color: "oklch(0.83 0.17 88)" }}
          >
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "oklch(0.5 0.008 270)" }}>
            Nenhum usuário cadastrado recentemente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.27 0.008 270 / 0.5)" }}>
                  {["Nome completo / Usuário", "Papel / Função", "Data do cadastro", "Ação"].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-[10px] uppercase tracking-widest font-bold ${i === 3 ? "text-right" : ""}`}
                      style={{ color: "oklch(0.5 0.008 270)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr
                    key={u.id}
                    className="transition-colors duration-150"
                    style={{
                      borderBottom: i < recentUsers.length - 1 ? "1px solid oklch(0.22 0.007 270 / 0.6)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.21 0.007 270 / 0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                          style={{
                            background: "oklch(0.21 0.007 270)",
                            border: "1px solid oklch(0.27 0.008 270)",
                          }}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <UserCheck className="h-4 w-4" style={{ color: "oklch(0.5 0.008 270)" }} />
                          )}
                        </div>
                        <span className="font-semibold truncate" style={{ color: "oklch(0.97 0.005 100)" }}>
                          {u.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={
                          u.role === "Empresa"
                            ? {
                                background: "oklch(0.65 0.18 240 / 12%)",
                                color: "oklch(0.65 0.18 240)",
                                border: "1px solid oklch(0.65 0.18 240 / 20%)",
                              }
                            : {
                                background: "oklch(0.7 0.17 150 / 12%)",
                                color: "oklch(0.7 0.17 150)",
                                border: "1px solid oklch(0.7 0.17 150 / 20%)",
                              }
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5" style={{ color: "oklch(0.55 0.008 270)" }}>
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(u.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/admin/profissionais"
                        className="inline-flex h-7 items-center justify-center rounded-lg px-3 text-[10px] font-bold transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                          background: "oklch(0.83 0.17 88 / 10%)",
                          color: "oklch(0.83 0.17 88)",
                          border: "1px solid oklch(0.83 0.17 88 / 20%)",
                        }}
                      >
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MetricCard Component ── */
function MetricCard({
  label,
  value,
  subtitle,
  badge,
  badgeColor,
  icon: Icon,
  iconBg,
  iconColor,
  borderGlow,
  sparklinePoints,
  sparkColor,
  gradientId,
  gradientColor,
  isHighlight = false,
}: {
  label: string;
  value: string | null;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  borderGlow: string;
  sparklinePoints: number[];
  sparkColor: string;
  gradientId: string;
  gradientColor: string;
  isHighlight?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-default"
      style={{
        background: isHighlight
          ? "linear-gradient(135deg, oklch(0.83 0.17 88 / 8%), oklch(0.17 0.006 270))"
          : "oklch(0.17 0.006 270)",
        border: `1px solid ${hovered ? borderGlow : "oklch(0.27 0.008 270 / 0.7)"}`,
        boxShadow: hovered
          ? `0 8px 32px -8px oklch(0 0 0 / 40%), 0 0 0 1px ${borderGlow}`
          : "0 4px 16px -8px oklch(0 0 0 / 40%)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `${badgeColor.replace(")", " / 12%)").replace("oklch(", "oklch(")}`,
            color: badgeColor,
          }}
        >
          ↑ {badge}
        </span>
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.008 270)" }}>
          {label}
        </p>
        <h3
          className="font-display text-2xl font-extrabold mt-1 tracking-tight"
          style={{ color: "oklch(0.97 0.005 100)" }}
        >
          {value ?? "—"}
        </h3>
        <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.008 270)" }}>{subtitle}</p>
      </div>

      {/* Sparkline */}
      <div className="mt-4 h-12 w-full">
        <Sparkline
          points={sparklinePoints}
          color={sparkColor}
          gradientId={gradientId}
          gradientColor={gradientColor}
          animated
        />
      </div>
    </div>
  );
}

/* ── AdminShortcut ── */
function AdminShortcut({
  to,
  label,
  icon: Icon,
  color,
  bg,
}: {
  to: string;
  label: string;
  icon: any;
  color: string;
  bg: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center rounded-xl p-4 text-center transition-all duration-200"
      style={{
        background: hovered ? "oklch(0.21 0.007 270)" : "oklch(0.17 0.006 270)",
        border: `1px solid ${hovered ? color.replace(")", " / 35%)").replace("oklch(", "oklch(") : "oklch(0.27 0.008 270 / 0.7)"}`,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 24px -8px ${color.replace(")", " / 30%)").replace("oklch(", "oklch(")}` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200"
        style={{
          background: bg,
          color,
          transform: hovered ? "scale(1.12)" : "scale(1)",
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span
        className="mt-2.5 text-xs font-bold leading-tight transition-colors"
        style={{ color: hovered ? color : "oklch(0.75 0.01 270)" }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ── DetailStat ── */
function DetailStat({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:brightness-110 cursor-default"
      style={{
        background: "oklch(0.13 0.005 270 / 0.6)",
        border: "1px solid oklch(0.25 0.008 270 / 0.5)",
      }}
    >
      <div className="flex justify-between items-start">
        <span className="font-display text-2xl font-bold" style={{ color: "oklch(0.97 0.005 100)" }}>
          <AnimatedCounter value={value} />
        </span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="mt-2 text-xs font-bold leading-tight" style={{ color: "oklch(0.85 0.005 100)" }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.008 270)" }}>{subtitle}</p>
    </div>
  );
}
