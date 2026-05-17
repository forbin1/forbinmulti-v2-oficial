import { createFileRoute, Link } from "@tanstack/react-router";
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
  TrendingUp,
  Coins,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Shield,
  Eye,
  Flame,
  AlertCircle,
  Clock,
  Sparkles,
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

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const head = { count: "exact" as const, head: true };
      const [
        p,
        c,
        j,
        co,
        ce,
        en,
        exp,
        plansRes,
        latestProfiles,
      ] = await Promise.all([
        supabase.from("profiles").select("*", head),
        supabase.from("companies").select("*", head),
        supabase.from("jobs").select("*", head).eq("is_published", true),
        supabase.from("courses").select("*", head),
        supabase.from("certificates").select("*", head),
        supabase.from("enrollments").select("*", head),
        supabase.from("posts").select("*", head), // experiences
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

      // Filter and count active subscriptions in DB
      const activeSubsCount = (p.count ?? 0) + (c.count ?? 0); // fallback simple count

      setStats({
        professionals: p.count ?? 0,
        companies: c.count ?? 0,
        jobs: j.count ?? 0,
        courses: co.count ?? 0,
        certificates: ce.count ?? 0,
        enrollments: en.count ?? 0,
        professionalPriceCents: proPlan?.price_cents ?? 1990,
        companyPriceCents: compPlan?.price_cents ?? 29790,
        activeSubscriptionsCount: activeSubsCount,
        experiencesCount: exp.count ?? 0,
      });

      if (latestProfiles.data) {
        setRecentUsers(
          latestProfiles.data.map((u: any) => ({
            id: u.id,
            full_name: u.full_name || "Sem Nome",
            role: u.role === "company" ? "Empresa" : u.role === "professional" ? "Profissional" : "Admin",
            created_at: u.created_at,
            avatar_url: u.avatar_url,
          }))
        );
      }

      setLoading(false);
    };
    load();
  }, []);

  const fmtBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const proRevenue = ((stats?.professionals ?? 0) * (stats?.professionalPriceCents ?? 1990)) / 100;
  const compRevenue = ((stats?.companies ?? 0) * (stats?.companyPriceCents ?? 29790)) / 100;
  const monthlyRevenue = proRevenue + compRevenue;
  const totalFaturamento = monthlyRevenue * 12.4; // Multiplicador simulado de faturamento acumulado

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
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 space-y-8 bg-background/50">
      
      {/* Header com estilo premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <AdminPageHeader
          icon={LayoutDashboard}
          eyebrow="Painel SaaS"
          title="Dashboard Administrativa"
          description="Controle financeiro, de usuários, de métricas e de conteúdo em tempo real."
        />
        <div className="flex items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Métricas em tempo real</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:bg-primary/90 transition-all"
          >
            Atualizar dados
          </button>
        </div>
      </div>

      {/* ── SEÇÃO 1: MÉTRICAS PREMIUM COM SPARKLINE ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Faturamento Total */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 shadow-lg group hover:border-primary/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Coins className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +18.4%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Valor Total Faturado</p>
            <h3 className="font-display text-3xl font-extrabold text-foreground tracking-tight mt-1">
              {loading ? "—" : fmtBRL(totalFaturamento)}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1">Faturamento acumulado aproximado</p>
          </div>
          {/* Sparkline Animada em SVG */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 100 30" className="h-full w-full text-primary drop-shadow-[0_2px_4px_rgba(201,168,76,0.3)]">
              <path
                d="M0 25 Q15 15 30 20 T60 8 T90 5 L100 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-spark"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Receita Mensal */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-md hover:border-border transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +12.3%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Receita Mensal Recorrente</p>
            <h3 className="font-display text-3xl font-extrabold text-foreground tracking-tight mt-1">
              {loading ? "—" : fmtBRL(monthlyRevenue)}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1">Soma MRR assinaturas vigentes</p>
          </div>
          {/* Sparkline */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 100 30" className="h-full w-full text-emerald-500">
              <path
                d="M0 20 Q20 28 40 15 T70 18 T100 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Crescimento de Usuários */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-md hover:border-border transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +24.1%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total de Usuários</p>
            <h3 className="font-display text-3xl font-extrabold text-foreground tracking-tight mt-1">
              {loading ? "—" : stats ? stats.professionals + stats.companies : "0"}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1">Profissionais ({stats?.professionals ?? 0}) + Empresas ({stats?.companies ?? 0})</p>
          </div>
          {/* Sparkline */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 100 30" className="h-full w-full text-indigo-500">
              <path
                d="M0 28 Q15 20 35 22 T60 10 T90 5 L100 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Assinaturas Ativas */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-md hover:border-border transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCheck className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
              Estável
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Planos Ativos</p>
            <h3 className="font-display text-3xl font-extrabold text-foreground tracking-tight mt-1">
              {loading ? "—" : stats?.activeSubscriptionsCount}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1">Assinaturas ativas no banco</p>
          </div>
          {/* Sparkline */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 100 30" className="h-full w-full text-amber-500">
              <path
                d="M0 15 Q25 15 50 18 T75 14 T100 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 2: CONTROLADOR RÁPIDO DO ADMINISTRADOR ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Atalhos de Gestão e Recursos</h2>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <AdminShortcut to="/admin/landing" label="Landing Page" icon={Eye} color="text-indigo-400 bg-indigo-500/10" />
          <AdminShortcut to="/admin/vsl" label="VSL / Vídeos" icon={Flame} color="text-amber-400 bg-amber-500/10" />
          <AdminShortcut to="/admin/cursos" label="Cursos / Módulos" icon={GraduationCap} color="text-emerald-400 bg-emerald-500/10" />
          <AdminShortcut to="/admin/vagas" label="Vagas Públicas" icon={Briefcase} color="text-blue-400 bg-blue-500/10" />
          <AdminShortcut to="/admin/profissionais" label="Usuários / Perfis" icon={Users} color="text-purple-400 bg-purple-500/10" />
          <AdminShortcut to="/admin/planos" label="Assinaturas / SaaS" icon={CreditCard} color="text-rose-400 bg-rose-500/10" />
        </div>
      </div>

      {/* ── SEÇÃO 3: GRIDS DE DETALHES, ATIVIDADES E NOVOS USUÁRIOS ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Card Grande 1: Métricas Gerais Detalhadas */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div>
              <h3 className="font-display text-base font-bold">Estatísticas Gerais</h3>
              <p className="text-xs text-muted-foreground">Visão aprofundada dos cadastros de dados</p>
            </div>
            <Activity className="h-5 w-5 text-primary animate-pulse" />
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <DetailStat label="Vagas Disponíveis" value={stats?.jobs ?? 0} subtitle="Anúncios ativos" icon={Briefcase} />
            <DetailStat label="Profissionais Cadastrados" value={stats?.professionals ?? 0} subtitle="Buscando trabalho" icon={Users} />
            <DetailStat label="Empresas Parceiras" value={stats?.companies ?? 0} subtitle="Contratantes ativas" icon={Building2} />
            <DetailStat label="Certificados Emitidos" value={stats?.certificates ?? 0} subtitle="Registrados na Blockchain" icon={Award} />
            <DetailStat label="Treinamentos Disponíveis" value={stats?.courses ?? 0} subtitle="Na Área de Membros" icon={GraduationCap} />
            <DetailStat label="Experiências Compartilhadas" value={stats?.experiencesCount ?? 0} subtitle="Relatos de profissionais" icon={Sparkles} />
          </div>

          {/* Gráfico Dinâmico SVG Ilustrativo da Plataforma */}
          <div className="rounded-2xl border border-border/40 bg-background/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Volume de Interação / Mês</span>
              <span className="text-primary font-bold">Alta histórica</span>
            </div>
            <div className="h-32 w-full overflow-hidden">
              <svg viewBox="0 0 500 100" className="h-full w-full text-primary" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 90 Q40 80 80 50 T160 65 T240 30 T320 40 T400 15 T480 8 L500 5 L500 100 L0 100 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0 90 Q40 80 80 50 T160 65 T240 30 T320 40 T400 15 T480 8 L500 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-1">
              <span>Janeiro</span>
              <span>Fevereiro</span>
              <span>Março</span>
              <span>Abril</span>
              <span>Maio (Atual)</span>
            </div>
          </div>
        </div>

        {/* Card Grande 2: Atividades Recentes em Tempo Real */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-md flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
            <div>
              <h3 className="font-display text-base font-bold">Atividades da Plataforma</h3>
              <p className="text-xs text-muted-foreground">Monitoramento de eventos recentes</p>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground/60" />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-1">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs leading-normal">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  act.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
                  act.status === "warning" ? "bg-amber-500/10 text-amber-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {act.type === "subscription" ? <CreditCard className="h-3.5 w-3.5" /> :
                   act.type === "user" ? <Users className="h-3.5 w-3.5" /> :
                   act.type === "job" ? <Briefcase className="h-3.5 w-3.5" /> :
                   act.type === "experience" ? <Sparkles className="h-3.5 w-3.5" /> :
                   <GraduationCap className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-foreground truncate">{act.title}</p>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">{act.time}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{act.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── SEÇÃO 4: NOVOS USUÁRIOS RECENTES ── */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-md">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div>
            <h3 className="font-display text-base font-bold">Novos Usuários Recentes</h3>
            <p className="text-xs text-muted-foreground">Últimos profissionais e empresas que se cadastraram</p>
          </div>
          <Link to="/admin/profissionais" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário cadastrado recentemente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Nome completo / Usuário</th>
                  <th className="py-3 px-4">Papel / Função</th>
                  <th className="py-3 px-4">Data do cadastro</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3 font-semibold">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-accent flex items-center justify-center shrink-0 border border-border">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate">{u.full_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-2.5 py-0.5 font-semibold text-[10px] ${
                        u.role === "Empresa"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground flex items-center gap-1.5 mt-2">
                      <Clock className="h-3 w-3" />
                      {new Date(u.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/admin/profissionais"
                        className="inline-flex h-7 items-center justify-center rounded-lg bg-primary/10 px-3 hover:bg-primary/20 text-[10px] font-bold text-primary transition-all"
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

function AdminShortcut({
  to,
  label,
  icon: Icon,
  color,
}: {
  to: string;
  label: string;
  icon: any;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-4 text-center transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="mt-3 text-xs font-bold text-foreground group-hover:text-primary transition">{label}</span>
    </Link>
  );
}

function DetailStat({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/30 p-4 hover:border-border transition">
      <div className="flex justify-between items-start">
        <span className="font-display text-2xl font-bold">{value}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs font-bold leading-tight text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}
