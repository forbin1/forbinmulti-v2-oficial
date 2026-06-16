import { useEffect, useState } from "react";
import { Briefcase, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { EXPERIENCE_CATEGORIES } from "@/lib/professional-level";
import { toast } from "sonner";

export type ExperienceDraft = {
  id?: string;
  company: string;
  position: string;
  category: string | null;
  /** "YYYY-MM" (input month) ou null */
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

const DESC_LIMIT = 1000;

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Converte 'YYYY-MM' ou 'YYYY-MM-DD' em "Mmm/AAAA". */
function fmtMonth(value: string | null): string {
  if (!value) return "";
  const [y, m] = value.split("-");
  const idx = Number(m) - 1;
  if (!y || idx < 0 || idx > 11) return value;
  return `${MONTHS[idx]}/${y}`;
}

export function formatPeriod(e: Pick<ExperienceDraft, "start_date" | "end_date" | "is_current">): string {
  const start = fmtMonth(e.start_date);
  const end = e.is_current ? "Atual" : fmtMonth(e.end_date);
  if (!start && !end) return "Período não informado";
  if (!start) return end;
  return `${start} — ${end || "Atual"}`;
}

/** Normaliza valor vindo do banco ('YYYY-MM-DD') para o input month ('YYYY-MM'). */
export function toMonthInput(dbDate: string | null | undefined): string | null {
  if (!dbDate) return null;
  return dbDate.slice(0, 7);
}

/** Normaliza valor do input month ('YYYY-MM') para o banco ('YYYY-MM-01'). */
export function toDbDate(monthInput: string | null | undefined): string | null {
  if (!monthInput) return null;
  return monthInput.length === 7 ? `${monthInput}-01` : monthInput;
}

const EMPTY: ExperienceDraft = {
  company: "",
  position: "",
  category: null,
  start_date: null,
  end_date: null,
  is_current: false,
  description: "",
};

export function ExperienceDialog({
  open,
  initial,
  onClose,
  onSave,
  saving = false,
}: {
  open: boolean;
  initial?: ExperienceDraft | null;
  onClose: () => void;
  onSave: (draft: ExperienceDraft) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<ExperienceDraft>(EMPTY);

  useEffect(() => {
    setForm(initial ? { ...initial } : EMPTY);
  }, [initial, open]);

  const submit = () => {
    if (!form.company.trim()) return toast.error("Informe a empresa onde trabalhou.");
    if (!form.position.trim()) return toast.error("Informe o cargo ocupado.");
    if ((form.description?.length ?? 0) > DESC_LIMIT) return toast.error("A descrição excede 1.000 caracteres.");
    onSave({
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      end_date: form.is_current ? null : form.end_date,
    });
  };

  const descLen = form.description?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar experiência" : "Adicionar experiência"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Empresa onde trabalhou *</Label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Ex: Vigilância Total LTDA"
            />
          </div>
          <div>
            <Label>Cargo ocupado *</Label>
            <Input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Ex: Vigilante Líder"
            />
          </div>
          <div>
            <Label>Área de atuação</Label>
            <select
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value || null })}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione (opcional)</option>
              {EXPERIENCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Início</Label>
              <Input
                type="month"
                value={form.start_date ?? ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="month"
                value={form.end_date ?? ""}
                disabled={form.is_current}
                onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Trabalho atual (ainda atuo aqui)
          </label>
          <div>
            <div className="flex items-center justify-between">
              <Label>Descrição da experiência</Label>
              <span className={`text-xs ${descLen > DESC_LIMIT ? "text-destructive" : "text-muted-foreground"}`}>
                {descLen}/{DESC_LIMIT}
              </span>
            </div>
            <Textarea
              rows={4}
              maxLength={DESC_LIMIT}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva suas atividades, responsabilidades e conquistas (até 1.000 caracteres)."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExperienceList({
  items,
  editable = false,
  onEdit,
  onDelete,
  emptyText = "Nenhuma experiência cadastrada.",
}: {
  items: ExperienceDraft[];
  editable?: boolean;
  onEdit?: (e: ExperienceDraft) => void;
  onDelete?: (e: ExperienceDraft) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground bg-card/20">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((exp, i) => (
        <div key={exp.id ?? i} className="rounded-2xl border border-border/60 bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-tight">{exp.position}</h3>
              <p className="text-sm text-muted-foreground">{exp.company}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">{formatPeriod(exp)}</Badge>
                {exp.category && (
                  <Badge className="rounded-full border-primary/30 bg-primary/10 text-primary text-[10px]">
                    {exp.category}
                  </Badge>
                )}
              </div>
              {exp.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{exp.description}</p>
              )}
            </div>
            {editable && (
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit?.(exp)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(exp)} aria-label="Excluir">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AddExperienceButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} variant="outline" className="w-full rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5">
      <Plus className="mr-2 h-4 w-4" /> Adicionar experiência profissional
    </Button>
  );
}
