import { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff, Plus, Briefcase, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { generateJobDescription } from "@/server/ai-tools.functions";

type Job = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  modality: string;
  contract_type: string;
  salary_min: number | null;
  salary_max: number | null;
  requirements: string | null;
  benefits: string | null;
  is_published: boolean;
};

const EMPTY: Omit<Job, "id"> = {
  title: "",
  description: "",
  city: "",
  state: "",
  modality: "Presencial",
  contract_type: "CLT",
  salary_min: null,
  salary_max: null,
  requirements: "",
  benefits: "",
  is_published: true,
};

export function JobsAdmin() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Job | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Job[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublished = async (j: Job) => {
    const { error } = await supabase
      .from("jobs")
      .update({ is_published: !j.is_published })
      .eq("id", j.id);
    if (error) return toast.error(error.message);
    toast.success(j.is_published ? "Vaga ocultada" : "Vaga publicada");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vaga excluída");
    setDeleteId(null);
    load();
  };

  const fmtSalary = (j: Job) => {
    if (!j.salary_min && !j.salary_max) return "—";
    const f = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
    if (j.salary_min && j.salary_max) return `${f(j.salary_min)} – ${f(j.salary_max)}`;
    return f(j.salary_min ?? j.salary_max ?? 0);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Briefcase}
        eyebrow="Oportunidades"
        title="Vagas"
        description="Editar, excluir, adicionar e ocultar vagas."
        actions={
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova vaga
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma vaga cadastrada. Clique em <b>Nova vaga</b> para começar.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Local</th>
                  <th className="hidden px-4 py-3 md:table-cell">Modalidade</th>
                  <th className="hidden px-4 py-3 md:table-cell">Salário</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((j) => (
                  <tr key={j.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <div className="truncate">{j.title}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {[j.city, j.state].filter(Boolean).join(" / ") || "—"} · {j.modality}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {[j.city, j.state].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{j.modality}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{fmtSalary(j)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                          (j.is_published
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {j.is_published ? "Publicada" : "Oculta"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => togglePublished(j)}>
                          {j.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(j)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(j.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <JobDialog
        open={creating || !!editing}
        job={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { setCreating(false); setEditing(null); load(); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Considere ocultar a vaga em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && remove(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function JobDialog({
  open, job, onClose, onSaved,
}: {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Job, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) {
      const { id, ...rest } = job;
      setForm(rest);
    } else setForm(EMPTY);
  }, [job, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    setSaving(true);
    const payload = {
      ...form,
      description: form.description || null,
      city: form.city || null,
      state: form.state || null,
      requirements: form.requirements || null,
      benefits: form.benefits || null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
    };
    const { error } = job
      ? await supabase.from("jobs").update(payload).eq("id", job.id)
      : await supabase.from("jobs").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(job ? "Vaga atualizada" : "Vaga criada");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? "Editar vaga" : "Nova vaga"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Título *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Vigilante Noturno" />
          </Field>
          <Field label="Descrição">
            <AIDescriptionHelper form={form} onApply={(text) => set("description", text)} />
            <Textarea rows={6} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cidade">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="UF">
              <Input value={form.state ?? ""} maxLength={2} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Modalidade">
              <Select value={form.modality} onValueChange={(v) => set("modality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                  <SelectItem value="Remoto">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo de contrato">
              <Select value={form.contract_type} onValueChange={(v) => set("contract_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Salário mínimo (R$)">
              <Input type="number" value={form.salary_min ?? ""} onChange={(e) => set("salary_min", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Salário máximo (R$)">
              <Input type="number" value={form.salary_max ?? ""} onChange={(e) => set("salary_max", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>

          <Field label="Requisitos">
            <Textarea rows={3} value={form.requirements ?? ""} onChange={(e) => set("requirements", e.target.value)} placeholder="Um por linha" />
          </Field>
          <Field label="Benefícios">
            <Textarea rows={3} value={form.benefits ?? ""} onChange={(e) => set("benefits", e.target.value)} placeholder="Um por linha" />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
            Publicada (visível na plataforma)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

type JobFormShape = {
  title: string;
  city: string | null;
  state: string | null;
  modality: string;
  contract_type: string;
};

function AIDescriptionHelper({
  form,
  onApply,
}: {
  form: JobFormShape;
  onApply: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const run = async () => {
    if (idea.trim().length < 5) {
      toast.error("Descreva a vaga em pelo menos uma frase.");
      return;
    }
    setLoading(true);
    setPreview("");
    try {
      const r = await generateJobDescription({
        data: {
          idea: idea.trim(),
          title: form.title || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          modality: form.modality || undefined,
          contract_type: form.contract_type || undefined,
        },
      });
      setPreview(r.text);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full text-xs"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Gerar com IA
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Gerador de descrição com IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field label="Descreva a vaga em uma frase">
              <Textarea
                rows={3}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex.: vigilante 12x36 noturno em condomínio residencial, com curso de CFTV e experiência de 1 ano"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Os campos já preenchidos (cargo, local, modalidade, contrato) também serão considerados.
            </p>

            <Button
              type="button"
              onClick={run}
              disabled={loading}
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Gerar descrição</>
              )}
            </Button>

            {preview && (
              <div className="rounded-2xl border border-primary/30 bg-surface p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  Prévia
                </div>
                <Textarea
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  rows={12}
                  className="resize-y rounded-xl bg-background text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!preview}
              onClick={() => {
                onApply(preview);
                setOpen(false);
                toast.success("Descrição aplicada");
              }}
            >
              Usar esta descrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

