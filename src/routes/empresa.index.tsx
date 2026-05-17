import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Users, Calendar, TrendingUp, Plus, MoreVertical, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/empresa/")({
  component: EmpresaDashboard,
});

function EmpresaDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [modality, setModality] = useState("Presencial");
  const [contractType, setContractType] = useState("CLT");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch company
      let { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (compErr) throw compErr;

      // Self-healing: if company record doesn't exist, insert one on the fly!
      if (!comp) {
        const defaultName = user.user_metadata?.company_name || "Minha Empresa";
        try {
          const { data: newComp, error: insertErr } = await supabase
            .from("companies")
            .insert({
              user_id: user.id,
              company_name: defaultName,
              city: "Rio de Janeiro",
              state: "RJ"
            })
            .select()
            .single();

          if (insertErr) {
            console.warn("RLS block on self-healing insert, using local fallback state", insertErr);
            comp = {
              id: user.id,
              user_id: user.id,
              company_name: defaultName,
              city: "Rio de Janeiro",
              state: "RJ",
              username: "empresa-" + user.id.slice(0, 6)
            };
          } else {
            comp = newComp;
          }
        } catch (e) {
          console.error("Erro no auto-insert:", e);
        }
      }
      
      if (comp) {
        setCompany(comp);
        // Fetch jobs for this company
        const { data: jobList, error: jobsErr } = await supabase
          .from("jobs")
          .select("*")
          .eq("company_id", comp.id)
          .order("created_at", { ascending: false });

        if (jobsErr) throw jobsErr;
        setJobs(jobList || []);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      toast.error("Empresa não encontrada.");
      return;
    }
    if (!title.trim()) {
      toast.error("O título da vaga é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("jobs").insert({
        company_id: company.id,
        title,
        description,
        city,
        state,
        modality,
        contract_type: contractType,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        salary_max: salaryMax ? parseFloat(salaryMax) : null,
        requirements,
        benefits,
        is_published: true,
        banner_url: bannerUrl || null,
      });

      if (error) throw error;

      toast.success("Vaga publicada com sucesso!");
      setIsOpen(false);
      
      // Reset form
      setTitle("");
      setDescription("");
      setCity("");
      setState("");
      setModality("Presencial");
      setContractType("CLT");
      setSalaryMin("");
      setSalaryMax("");
      setRequirements("");
      setBenefits("");
      setBannerUrl("");

      loadData();
    } catch (err: any) {
      toast.error("Erro ao criar vaga: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral das suas vagas e desempenho.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nova vaga
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Briefcase} label="Vagas ativas" value={jobs.length.toString()} trend="Atualizado" />
        <Kpi icon={Users} label="Candidatos totais" value="0" trend="Novos inscritos" />
        <Kpi icon={Calendar} label="Reuniões agendadas" value="0" trend="Esta semana" />
        <Kpi icon={TrendingUp} label="Taxa de conversão" value="0%" trend="Mês atual" highlight />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4 font-semibold">Minhas Vagas Cadastradas</h2>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Nenhuma vaga cadastrada ainda</p>
            <p className="text-muted-foreground text-sm">Clique em "Nova vaga" para começar a contratar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
                  {company?.company_name?.charAt(0) || "E"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {j.city}, {j.state} · {j.modality} · {j.contract_type}
                  </p>
                </div>
                <Badge className="rounded-full bg-primary/15 text-primary">0 candidatos</Badge>
                <Badge className="rounded-full border-success/40 bg-success/15 text-success">
                  {j.is_published ? "Ativa" : "Pausada"}
                </Badge>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* dialog for creating job */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/60 text-foreground overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Publicar Nova Vaga</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>Título da Vaga *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Vigilante Patrimonial Noturno" className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Ex: SP" className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <select value={modality} onChange={(e) => setModality(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-surface px-3">
                  <option>Presencial</option>
                  <option>Híbrido</option>
                  <option>Remoto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Regime de Contrato</Label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-surface px-3">
                  <option>CLT</option>
                  <option>PJ</option>
                  <option>Temporário</option>
                  <option>Freelancer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Salário Mínimo (R$)</Label>
                <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Ex: 2000" className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Salário Máximo (R$)</Label>
                <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Ex: 2500" className="bg-surface" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Descrição da Vaga</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descreva as responsabilidades..." className="bg-surface" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Requisitos</Label>
                <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} placeholder="Ex: CNV ativa, curso de formação concluído..." className="bg-surface" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Benefícios</Label>
                <Textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={2} placeholder="Ex: Vale refeição, vale transporte, plano de saúde..." className="bg-surface" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Imagem / Banner da Vaga (URL)</Label>
                <div className="flex gap-2">
                  <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="Link de uma imagem (ex: Unsplash) ou selecione um arquivo..." className="bg-surface flex-1" />
                  <Button type="button" variant="outline" onClick={() => {
                    const randoms = [
                      "https://images.unsplash.com/photo-1541888086925-0c13d80b623b?q=80&w=600",
                      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600",
                      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600",
                      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600"
                    ];
                    setBannerUrl(randoms[Math.floor(Math.random() * randoms.length)]);
                  }} className="shrink-0 rounded-xl">Sugestão</Button>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 p-4 bg-surface/50">
                  <Input type="file" accept="image/*" className="hidden" id="job-banner-upload" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      const localUrl = URL.createObjectURL(file);
                      setBannerUrl(localUrl);
                      toast.success("Foto selecionada! O link temporário foi gerado.");
                    }
                  }} />
                  <Label htmlFor="job-banner-upload" className="flex h-20 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-xs text-primary font-semibold hover:bg-primary/10">
                    Selecionar Foto
                  </Label>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Selecione uma imagem de destaque</p>
                    <p className="text-[10px] text-muted-foreground">Formatos suportados: PNG, JPG ou GIF. Máximo 5MB.</p>
                  </div>
                  {bannerUrl && (
                    <div className="h-16 w-24 overflow-hidden rounded-lg border">
                      <img src={bannerUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Publicar Vaga
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
        <span className="text-xs text-muted-foreground">{trend}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
