import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Users, Calendar, TrendingUp, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JOBS } from "@/data/mock";

export const Route = createFileRoute("/empresa/")({
  component: EmpresaDashboard,
});

function EmpresaDashboard() {
  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral das suas vagas e desempenho.</p>
        </div>
        <Button className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nova vaga
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Vagas ativas" value="12" trend="+2 esta semana" />
        <Kpi icon={Users} label="Candidatos totais" value="248" trend="+47 hoje" />
        <Kpi icon={Calendar} label="Reuniões agendadas" value="9" trend="3 esta semana" />
        <Kpi icon={TrendingUp} label="Taxa de conversão" value="18%" trend="+4% mês" highlight />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Vagas Ativas</h2>
        <div className="space-y-3">
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
        </div>
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
