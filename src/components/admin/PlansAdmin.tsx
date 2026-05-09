import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Plan = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  price_cents: number;
  currency: string;
  period: string;
  description: string | null;
  features: string[];
  cta_label: string | null;
  highlight: boolean;
  is_published: boolean;
  sort_order: number;
};

const empty: Omit<Plan, "id"> = {
  slug: "",
  name: "",
  audience: "professional",
  price_cents: 0,
  currency: "BRL",
  period: "month",
  description: "",
  features: [],
  cta_label: "Assinar",
  highlight: false,
  is_published: true,
  sort_order: 0,
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Omit<Plan, "id">>(empty);
  const [featuresText, setFeaturesText] = useState("");
  const [priceReais, setPriceReais] = useState("0,00");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar planos");
    setPlans(((data as any) ?? []) as Plan[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setFeaturesText("");
    setPriceReais("0,00");
    setOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ ...p });
    setFeaturesText((p.features ?? []).join("\n"));
    setPriceReais((p.price_cents / 100).toFixed(2).replace(".", ","));
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const cents = Math.round(
      parseFloat(priceReais.replace(/\./g, "").replace(",", ".")) * 100
    );
    const features = featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      price_cents: isNaN(cents) ? 0 : cents,
      features,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    };

    const { error } = editing
      ? await supabase.from("plans").update(payload).eq("id", editing.id)
      : await supabase.from("plans").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success(editing ? "Plano atualizado" : "Plano criado");
    setOpen(false);
    load();
  };

  const toggleVisible = async (p: Plan) => {
    const { error } = await supabase
      .from("plans")
      .update({ is_published: !p.is_published })
      .eq("id", p.id);
    if (error) return toast.error("Erro");
    toast.success(p.is_published ? "Plano oculto" : "Plano publicado");
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("plans").delete().eq("id", toDelete.id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Plano excluído");
    setToDelete(null);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Os preços aparecem automaticamente na página{" "}
          <span className="font-mono">/planos</span>.
        </p>
        <Button onClick={openNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo plano
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-surface/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="hidden px-4 py-3 sm:table-cell">Ordem</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="hidden px-4 py-3 md:table-cell">Público</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="hidden px-4 py-3 sm:table-cell">{p.sort_order}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{p.name}</span>
                        {p.highlight && (
                          <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                        <Badge variant="outline" className="text-[10px]">
                          {p.audience === "company" ? "Empresa" : "Profissional"}
                        </Badge>
                        {p.is_published ? (
                          <Badge className="bg-emerald-600/20 text-[10px] text-emerald-400">Publicado</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Oculto</Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge variant="outline">
                        {p.audience === "company" ? "Empresa" : "Profissional"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      {formatBRL(p.price_cents)}
                      <span className="text-xs text-muted-foreground">
                        /{p.period === "month" ? "mês" : p.period}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {p.is_published ? (
                        <Badge className="bg-emerald-600/20 text-emerald-400">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Oculto</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleVisible(p)}
                          title={p.is_published ? "Ocultar" : "Publicar"}
                        >
                          {p.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setToDelete(p)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Nenhum plano cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar plano" : "Novo plano"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Profissional"
              />
            </div>

            <div>
              <Label>Slug (identificador)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="professional"
              />
            </div>

            <div>
              <Label>Público</Label>
              <Select
                value={form.audience}
                onValueChange={(v) => setForm({ ...form, audience: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preço (R$)</Label>
              <Input
                value={priceReais}
                onChange={(e) => setPriceReais(e.target.value)}
                placeholder="19,90"
              />
            </div>

            <div>
              <Label>Período</Label>
              <Select
                value={form.period}
                onValueChange={(v) => setForm({ ...form, period: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Benefícios (um por linha)</Label>
              <Textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={6}
                placeholder={"Acesso a vagas exclusivas\nCursos liberados"}
              />
            </div>

            <div>
              <Label>Texto do botão (CTA)</Label>
              <Input
                value={form.cta_label ?? ""}
                onChange={(e) =>
                  setForm({ ...form, cta_label: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={(e) =>
                  setForm({ ...form, highlight: e.target.checked })
                }
              />
              Destaque (Mais escolhido)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
              />
              Publicado
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O plano "{toDelete?.name}" será
              removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
