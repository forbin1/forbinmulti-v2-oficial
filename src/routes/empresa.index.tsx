import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Users, Calendar, TrendingUp, Plus, MoreVertical, Loader2, Save, X, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
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
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [loadingShell, setLoadingShell] = useState(true); // first load skeleton
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);

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

  // Fetch candidate counts for given job ids in parallel
  const fetchAppCounts = async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const { data } = await supabase
      .from("applications")
      .select("job_id")
      .in("job_id", jobIds);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((a: any) => {
        counts[a.job_id] = (counts[a.job_id] || 0) + 1;
      });
      setAppCounts(counts);
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      // Run company + potential jobs in parallel where possible
      let { data: comp, error: compErr } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (compErr) throw compErr;

      // Self-healing: if company record doesn't exist, insert one on the fly
      if (!comp) {
        const defaultName = user.user_metadata?.company_name || "Minha Empresa";
        try {
          const { data: newComp, error: insertErr } = await supabase
            .from("companies")
            .insert({ user_id: user.id, company_name: defaultName, city: "Rio de Janeiro", state: "RJ" })
            .select()
            .single();
          comp = insertErr
            ? { id: user.id, user_id: user.id, company_name: defaultName, city: "Rio de Janeiro", state: "RJ", username: "empresa-" + user.id.slice(0, 6) }
            : newComp;
        } catch (e) {
          console.error("Erro no auto-insert:", e);
        }
      }

      if (comp) {
        setCompany(comp);

        // Fetch jobs AND application counts in parallel!
        const [jobsRes] = await Promise.all([
          supabase.from("jobs").select("*").eq("company_id", comp.id).order("created_at", { ascending: false }),
          // Prefetch applications count by joining with jobs of this company
        ]);

        const jobList = jobsRes.data || [];
        setJobs(jobList);
        await fetchAppCounts(jobList.map((j: any) => j.id));
      }
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setLoadingShell(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Realtime: update candidate counts when applications change
  useEffect(() => {
    const channel = supabase
      .channel("empresa-dashboard-apps")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => {
        if (jobs.length > 0) fetchAppCounts(jobs.map(j => j.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobs]);



  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      setEditSaving(true);
      const { error } = await supabase.from("jobs").update({
        title: editingJob.title,
        description: editingJob.description,
        city: editingJob.city,
        state: editingJob.state,
        modality: editingJob.modality,
        contract_type: editingJob.contract_type,
        salary_min: editingJob.salary_min ? parseFloat(editingJob.salary_min) : null,
        salary_max: editingJob.salary_max ? parseFloat(editingJob.salary_max) : null,
        requirements: editingJob.requirements,
        benefits: editingJob.benefits,
        banner_url: editingJob.banner_url || null,
        is_published: editingJob.is_published,
      }).eq("id", editingJob.id);
      if (error) throw error;
      toast.success("Vaga atualizada com sucesso!");
      setEditingJob(null);
      loadData();
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

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

  if (loadingShell) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between">
          <div>
            <div className="h-8 w-36 rounded-xl bg-muted" />
            <div className="h-4 w-52 rounded-lg bg-muted mt-2" />
          </div>
          <div className="h-11 w-32 rounded-full bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-10 space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        <Kpi icon={Briefcase} label="Vagas ativas" value={jobs.filter(j => j.is_published).length.toString()} trend="Atualizado" />
        <Kpi icon={Users} label="Candidatos totais" value={Object.values(appCounts).reduce((s, n) => s + n, 0).toString()} trend="Novos inscritos" />
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
                {/* Banner thumbnail or letter fallback */}
                <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-primary/15 flex items-center justify-center font-bold text-primary">
                  {j.banner_url ? (
                    <img src={j.banner_url} alt={j.title} className="h-full w-full object-cover" />
                  ) : (
                    company?.company_name?.charAt(0) || "E"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {j.city}, {j.state} · {j.modality} · {j.contract_type}
                  </p>
                </div>
                <Badge className="rounded-full bg-primary/15 text-primary">
                  {appCounts[j.id] ?? 0} {(appCounts[j.id] ?? 0) === 1 ? "candidato" : "candidatos"}
                </Badge>
                <Badge className={`rounded-full ${j.is_published ? "border-success/40 bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {j.is_published ? "Ativa" : "Pausada"}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={j.is_published ? "Pausar" : "Ativar"}
                    onClick={async () => {
                      const { error } = await supabase.from("jobs").update({ is_published: !j.is_published }).eq("id", j.id);
                      if (error) toast.error(error.message);
                      else { toast.success(j.is_published ? "Vaga pausada" : "Vaga ativada"); loadData(); }
                    }}
                  >
                    {j.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar vaga"
                    onClick={() => setEditingJob({ ...j })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    onClick={async () => {
                      if (!confirm("Tem certeza que deseja excluir esta vaga?")) return;
                      const { error } = await supabase.from("jobs").delete().eq("id", j.id);
                      if (error) toast.error(error.message);
                      else { toast.success("Vaga excluída!"); loadData(); }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
                <Label>Imagem / Banner da Vaga</Label>
                <div className="flex gap-2">
                  <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="Cole o link de uma imagem (Unsplash, etc.)" className="bg-surface flex-1" />
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
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setBannerUrl(reader.result as string);
                      toast.success("Imagem carregada com sucesso!");
                    };
                    reader.readAsDataURL(file);
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

      {/* Edit job dialog */}
      <Dialog open={!!editingJob} onOpenChange={(o) => !o && setEditingJob(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/60 text-foreground overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold">Editar Vaga</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Título da Vaga *</Label>
                  <Input value={editingJob.title} onChange={(e) => setEditingJob((j: any) => ({ ...j, title: e.target.value }))} required className="bg-surface" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={editingJob.city || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, city: e.target.value }))} className="bg-surface" />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={editingJob.state || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, state: e.target.value }))} className="bg-surface" />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <select value={editingJob.modality} onChange={(e) => setEditingJob((j: any) => ({ ...j, modality: e.target.value }))} className="h-10 w-full rounded-xl border border-border bg-surface px-3">
                    <option>Presencial</option>
                    <option>Híbrido</option>
                    <option>Remoto</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Regime de Contrato</Label>
                  <select value={editingJob.contract_type} onChange={(e) => setEditingJob((j: any) => ({ ...j, contract_type: e.target.value }))} className="h-10 w-full rounded-xl border border-border bg-surface px-3">
                    <option>CLT</option>
                    <option>PJ</option>
                    <option>Temporário</option>
                    <option>Freelancer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Salário Mínimo (R$)</Label>
                  <Input type="number" value={editingJob.salary_min || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, salary_min: e.target.value }))} className="bg-surface" />
                </div>
                <div className="space-y-2">
                  <Label>Salário Máximo (R$)</Label>
                  <Input type="number" value={editingJob.salary_max || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, salary_max: e.target.value }))} className="bg-surface" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Descrição da Vaga</Label>
                  <Textarea value={editingJob.description || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, description: e.target.value }))} rows={3} className="bg-surface" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Requisitos</Label>
                  <Textarea value={editingJob.requirements || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, requirements: e.target.value }))} rows={3} className="bg-surface" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Benefícios</Label>
                  <Textarea value={editingJob.benefits || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, benefits: e.target.value }))} rows={2} className="bg-surface" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Banner da Vaga (URL ou upload)</Label>
                  <div className="flex gap-2">
                    <Input value={editingJob.banner_url || ""} onChange={(e) => setEditingJob((j: any) => ({ ...j, banner_url: e.target.value }))} placeholder="Cole um link ou selecione abaixo" className="bg-surface flex-1" />
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 p-3 bg-surface/50">
                    <Input type="file" accept="image/*" className="hidden" id="edit-banner-upload" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setEditingJob((j: any) => ({ ...j, banner_url: reader.result as string }));
                      reader.readAsDataURL(file);
                    }} />
                    <Label htmlFor="edit-banner-upload" className="flex h-14 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-xs text-primary font-semibold hover:bg-primary/10">
                      Selecionar
                    </Label>
                    {editingJob.banner_url && (
                      <div className="h-14 w-24 overflow-hidden rounded-lg border">
                        <img src={editingJob.banner_url} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingJob.is_published} onChange={(e) => setEditingJob((j: any) => ({ ...j, is_published: e.target.checked }))} />
                    Publicada (visível na plataforma)
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingJob(null)}>Cancelar</Button>
                <Button type="submit" disabled={editSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
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
