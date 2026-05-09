import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  MoreVertical,
  CheckCircle2,
  Eye,
  MessageSquare,
  XCircle,
  ShieldCheck,
  MapPin,
  Globe,
  Phone,
  Mail,
  Building2,
  Award,
  Star,
  Linkedin,
  Instagram,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JOBS } from "@/data/mock";

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: "Painel da Empresa — FORBIN" },
      { name: "description", content: "Gerencie vagas, candidatos e reuniões da sua empresa." },
    ],
  }),
  component: PainelEmpresa,
});

const CANDIDATES = [
  { name: "Carlos Mendes", role: "Vigilante Líder", years: 8, courses: 5, status: "Novo", initials: "CM" },
  { name: "André Lima", role: "Escolta Armada", years: 6, courses: 4, status: "Em análise", initials: "AL" },
  { name: "Renata Oliveira", role: "Operadora CFTV", years: 4, courses: 3, status: "Reunião marcada", initials: "RO" },
  { name: "Marcos Tavares", role: "Supervisor", years: 10, courses: 6, status: "Novo", initials: "MT" },
  { name: "Juliana Costa", role: "Vigilante", years: 3, courses: 2, status: "Em análise", initials: "JC" },
];

function PainelEmpresa() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Capa */}
      <div className="relative mb-[-72px] h-44 overflow-hidden rounded-3xl border border-border/60 sm:h-56">
        <div className="absolute inset-0 bg-gradient-gold opacity-25" />
        <div className="absolute inset-0 bg-radial-gold" />
      </div>

      {/* Header card da empresa */}
      <div className="relative rounded-3xl border border-border/60 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-gradient-gold font-display text-3xl font-extrabold text-primary-foreground shadow-gold sm:h-32 sm:w-32">
            VT
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Empresa de segurança</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Vigilância Total LTDA</h1>
              <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verificada FORBIN
              </Badge>
              <Badge className="rounded-full border-primary/40 bg-primary/10 text-primary">
                <Star className="mr-1 h-3.5 w-3.5" /> 4.8 · 142 avaliações
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Empresa de segurança patrimonial com 18 anos de mercado, atuando em São Paulo e Grande SP.
              Especializada em condomínios premium, eventos corporativos e escolta de valores.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> São Paulo, SP</span>
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> CNPJ 12.345.678/0001-90</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> vigilanciatotal.com.br</span>
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> (11) 4002-8922</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> rh@vigilanciatotal.com.br</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Nova vaga
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["Condomínios", "Eventos", "Escolta", "CFTV", "Portaria 24h"].map((s) => (
            <Badge key={s} variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Vagas ativas" value="12" trend="+2 esta semana" />
        <Kpi icon={Users} label="Candidatos totais" value="248" trend="+47 hoje" />
        <Kpi icon={Calendar} label="Reuniões agendadas" value="9" trend="3 esta semana" />
        <Kpi icon={TrendingUp} label="Taxa de conversão" value="18%" trend="+4% mês" highlight />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Tabs defaultValue="candidatos">
            <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-card p-1">
              <TabsTrigger value="candidatos" className="flex-1 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Candidatos
              </TabsTrigger>
              <TabsTrigger value="vagas" className="flex-1 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Vagas
              </TabsTrigger>
              <TabsTrigger value="reunioes" className="flex-1 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Agenda
              </TabsTrigger>
              <TabsTrigger value="sobre" className="flex-1 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sobre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidatos" className="mt-6">
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                <div className="border-b border-border/60 p-5">
                  <h2 className="font-display text-lg font-bold">Candidatos recentes</h2>
                  <p className="text-sm text-muted-foreground">Analise perfis e marque reuniões.</p>
                </div>
                <ul>
                  {CANDIDATES.map((c) => (
                    <li key={c.name} className="flex flex-wrap items-center gap-4 border-b border-border/40 p-5 last:border-0 hover:bg-surface/60">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-bold text-primary-foreground">
                        {c.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.role} · {c.years} anos · {c.courses} cursos</p>
                      </div>
                      <StatusBadge status={c.status} />
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link to="/profissional"><Eye className="mr-1 h-4 w-4" /> Ver</Link>
                        </Button>
                        <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <Calendar className="mr-1 h-4 w-4" /> Marcar reunião
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="vagas" className="mt-6 space-y-3">
              {JOBS.slice(0, 5).map((j) => (
                <div key={j.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
                    {j.companyInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{j.title}</p>
                    <p className="text-sm text-muted-foreground">{j.location} · {j.shift}</p>
                  </div>
                  <Badge className="rounded-full bg-primary/15 text-primary">{j.applicants} candidatos</Badge>
                  <Badge className="rounded-full border-success/40 bg-success/15 text-success">Ativa</Badge>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reunioes" className="mt-6 space-y-3">
              {[
                { name: "Carlos Mendes", role: "Vigilante Líder", when: "Hoje · 14:00", mode: "Vídeo" },
                { name: "Renata Oliveira", role: "CFTV", when: "Amanhã · 10:30", mode: "Presencial" },
                { name: "André Lima", role: "Escolta", when: "Sex · 16:00", mode: "Vídeo" },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.role} · {r.when}</p>
                  </div>
                  <Badge className="rounded-full bg-surface-elevated text-muted-foreground">{r.mode}</Badge>
                  <Button variant="outline" size="sm" className="rounded-full"><MessageSquare className="mr-1 h-4 w-4" /> Entrar</Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="sobre" className="mt-6 space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold">Sobre a empresa</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Fundada em 2007, a Vigilância Total LTDA atua na proteção de patrimônios e pessoas
                  com equipe própria altamente treinada. Investimos continuamente em tecnologia e
                  capacitação para entregar excelência operacional e tranquilidade aos nossos clientes.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Fundação", "2007"],
                    ["Funcionários", "+450"],
                    ["Cidades atendidas", "12"],
                    ["Frota", "38 veículos"],
                    ["Postos ativos", "62"],
                    ["ISO 9001", "Certificada"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border/60 bg-surface p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                      <p className="mt-1 font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold">Serviços oferecidos</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Vigilância patrimonial 24h",
                    "Portaria e controle de acesso",
                    "Escolta armada",
                    "Segurança em eventos",
                    "Operação e instalação de CFTV",
                    "Consultoria em segurança",
                  ].map((s) => (
                    <li key={s} className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface p-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold">Certificações & autorizações</h2>
                <ul className="mt-4 space-y-3">
                  {[
                    { name: "Autorização Polícia Federal", id: "Nº 12.345/SP" },
                    { name: "ISO 9001:2015", id: "Gestão da qualidade" },
                    { name: "Sindesp-SP", id: "Filiada desde 2010" },
                    { name: "Certificado Origem", id: "Empresa nacional" },
                  ].map((c) => (
                    <li key={c.name} className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-3">
                      <Award className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.id}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="font-display text-xl font-bold">Endereço & redes</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Av. Paulista, 1.500 — Bela Vista, São Paulo/SP · CEP 01310-200
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-sm hover:border-primary" href="#">
                    <Linkedin className="h-4 w-4 text-primary" /> /vigilancia-total
                  </a>
                  <a className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-sm hover:border-primary" href="#">
                    <Instagram className="h-4 w-4 text-primary" /> @vigilanciatotal
                  </a>
                  <a className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-sm hover:border-primary" href="#">
                    <Globe className="h-4 w-4 text-primary" /> vigilanciatotal.com.br
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-6">
            <h3 className="font-display text-lg font-bold">Plano Premium</h3>
            <p className="mt-1 text-sm text-muted-foreground">Vagas ilimitadas, destaque no marketplace e selo verificado.</p>
            <Button asChild className="mt-4 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/planos">Conhecer planos</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Atividade recente</h3>
            <ul className="space-y-3 text-sm">
              {[
                { icon: CheckCircle2, color: "text-success", text: "Reunião com Carlos confirmada" },
                { icon: Users, color: "text-primary", text: "5 novos candidatos para Escolta" },
                { icon: Eye, color: "text-muted-foreground", text: "Sua vaga de CFTV teve 89 visualizações" },
                { icon: XCircle, color: "text-destructive", text: "Vaga de Porteiro expirou" },
              ].map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <a.icon className={`mt-0.5 h-4 w-4 shrink-0 ${a.color}`} />
                  <span className="text-muted-foreground">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, trend, highlight }: { icon: React.ElementType; label: string; value: string; trend: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? "border-primary/40 bg-gradient-to-br from-primary/15 to-transparent" : "border-border/60 bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${highlight ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs text-success">{trend}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Novo": "bg-primary/15 text-primary",
    "Em análise": "bg-surface-elevated text-muted-foreground",
    "Reunião marcada": "bg-success/15 text-success",
  };
  return <Badge className={`rounded-full ${styles[status] ?? "bg-surface-elevated"}`}>{status}</Badge>;
}
