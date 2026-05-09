import { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff, Plus, GraduationCap, Loader2, Layers } from "lucide-react";
import { ModulesManager } from "@/components/admin/ModulesManager";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Course = {
  id: string;
  title: string;
  description: string | null;
  instructor: string;
  category: string;
  level: string;
  duration_hours: number | null;
  total_lessons: number;
  thumbnail_url: string | null;
  price: number | null;
  is_published: boolean;
};

const EMPTY: Omit<Course, "id"> = {
  title: "",
  description: "",
  instructor: "",
  category: "Geral",
  level: "Iniciante",
  duration_hours: 0,
  total_lessons: 0,
  thumbnail_url: "",
  price: null,
  is_published: true,
};

export function CoursesAdmin() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modulesFor, setModulesFor] = useState<Course | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Course[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublished = async (c: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.is_published ? "Curso ocultado" : "Curso publicado");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Curso excluído");
    setDeleteId(null);
    load();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={GraduationCap}
        eyebrow="Conteúdo educacional"
        title="Cursos"
        description="Editar, excluir, adicionar e ocultar cursos da plataforma."
        actions={
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo curso
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum curso cadastrado. Clique em <b>Novo curso</b> para começar.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Categoria</th>
                  <th className="hidden px-4 py-3 md:table-cell">Nível</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <div className="truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{c.category} · {c.level}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{c.category}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{c.level}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                          (c.is_published
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {c.is_published ? "Publicado" : "Oculto"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="rounded-full px-3" onClick={() => setModulesFor(c)} title="Módulos e aulas">
                          <Layers className="mr-1.5 h-4 w-4" /> Módulos
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => togglePublished(c)} title={c.is_published ? "Ocultar" : "Publicar"}>
                          {c.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)} title="Excluir">
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

      <CourseDialog
        open={creating || !!editing}
        course={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. Considere ocultar o curso em vez de excluir.
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
      <ModulesManager
        open={!!modulesFor}
        courseId={modulesFor?.id ?? null}
        courseTitle={modulesFor?.title ?? ""}
        onClose={() => setModulesFor(null)}
      />
    </div>
  );
}

function CourseDialog({
  open,
  course,
  onClose,
  onSaved,
}: {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Omit<Course, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      const { id, ...rest } = course;
      setForm(rest);
    } else {
      setForm(EMPTY);
    }
  }, [course, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.instructor.trim()) {
      return toast.error("Título e instrutor são obrigatórios");
    }
    setSaving(true);
    const payload = {
      ...form,
      thumbnail_url: form.thumbnail_url || null,
      description: form.description || null,
      duration_hours: Number(form.duration_hours) || 0,
      total_lessons: Number(form.total_lessons) || 0,
      price: form.price ? Number(form.price) : null,
    };
    const { error } = course
      ? await supabase.from("courses").update(payload).eq("id", course.id)
      : await supabase.from("courses").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(course ? "Curso atualizado" : "Curso criado");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course ? "Editar curso" : "Novo curso"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Título *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instrutor *">
              <Input value={form.instructor} onChange={(e) => set("instructor", e.target.value)} />
            </Field>
            <Field label="Categoria">
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Nível">
              <Select value={form.level} onValueChange={(v) => set("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Duração (horas)">
              <Input type="number" value={form.duration_hours ?? 0}
                onChange={(e) => set("duration_hours", Number(e.target.value))} />
            </Field>
            <Field label="Total de aulas">
              <Input type="number" value={form.total_lessons}
                onChange={(e) => set("total_lessons", Number(e.target.value))} />
            </Field>
            <Field label="Preço (R$)">
              <Input type="number" step="0.01" value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
          <Field label="URL da capa (thumbnail)">
            <Input value={form.thumbnail_url ?? ""} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://..." />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
            />
            Publicado (visível na plataforma)
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
