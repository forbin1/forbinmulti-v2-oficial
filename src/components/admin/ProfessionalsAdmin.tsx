import { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff, Users, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Professional = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  cnv_number: string | null;
  experience_years: number | null;
  is_hidden: boolean;
};

export function ProfessionalsAdmin() {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Professional | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Professional[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleHidden = async (p: Professional) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_hidden: !p.is_hidden })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_hidden ? "Profissional exibido" : "Profissional ocultado");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profissional excluído");
    setDeleteId(null);
    load();
  };

  const filtered = q
    ? items.filter((p) =>
        [p.full_name, p.city, p.state, p.cnv_number]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q.toLowerCase())),
      )
    : items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Users}
        eyebrow="Pessoas"
        title="Profissionais"
        description="Editar, ocultar e excluir profissionais cadastrados."
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, cidade ou CNV…" className="pl-10" />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Local</th>
                  <th className="hidden px-4 py-3 md:table-cell">CNV</th>
                  <th className="hidden px-4 py-3 md:table-cell">Exp.</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <div className="truncate">{p.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {[p.city, p.state].filter(Boolean).join(" / ") || "—"}
                        {p.cnv_number ? ` · CNV ${p.cnv_number}` : ""}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{[p.city, p.state].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{p.cnv_number || "—"}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{p.experience_years ?? 0}a</td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs " + (p.is_hidden ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-400")}>
                        {p.is_hidden ? "Oculto" : "Visível"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toggleHidden(p)} title={p.is_hidden ? "Exibir" : "Ocultar"}>
                          {p.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProfessionalDialog
        open={!!editing}
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove o perfil permanentemente. Considere ocultar em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && remove(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProfessionalDialog({
  open, item, onClose, onSaved,
}: {
  open: boolean;
  item: Professional | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Professional>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(item ?? {}); }, [item, open]);

  const set = <K extends keyof Professional>(k: K, v: Professional[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!item) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name ?? "",
      phone: form.phone ?? null,
      city: form.city ?? null,
      state: form.state ?? null,
      bio: form.bio ?? null,
      cnv_number: form.cnv_number ?? null,
      experience_years: Number(form.experience_years) || 0,
      is_hidden: form.is_hidden ?? false,
    }).eq("id", item.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profissional atualizado");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Editar profissional</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Nome completo">
            <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="CNV"><Input value={form.cnv_number ?? ""} onChange={(e) => set("cnv_number", e.target.value)} /></Field>
            <Field label="Cidade"><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="UF"><Input maxLength={2} value={form.state ?? ""} onChange={(e) => set("state", e.target.value.toUpperCase())} /></Field>
            <Field label="Anos de experiência"><Input type="number" value={form.experience_years ?? 0} onChange={(e) => set("experience_years", Number(e.target.value))} /></Field>
          </div>
          <Field label="Bio"><Textarea rows={4} value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_hidden ?? false} onChange={(e) => set("is_hidden", e.target.checked)} />
            Ocultar este perfil da plataforma
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
