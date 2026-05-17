import { useEffect, useState, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import { Pencil, Trash2, Eye, EyeOff, Plus, GraduationCap, Loader2, Layers, Upload, FileText } from "lucide-react";
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
  affiliate_available?: boolean;
  commission_percentage?: number | null;
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
  affiliate_available: false,
  commission_percentage: 0,
};

const createCourseServer = createServerFn({ method: "POST" })
  .validator((d: any) => d)
  .handler(async ({ data: payload }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

const updateCourseServer = createServerFn({ method: "POST" })
  .validator((d: { id: string; payload: any }) => d)
  .handler(async ({ data: { id, payload } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

const deleteCourseServer = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const toggleCoursePublishedServer = createServerFn({ method: "POST" })
  .validator((d: { id: string; is_published: boolean }) => d)
  .handler(async ({ data: { id, is_published } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .update({ is_published })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

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
    try {
      await toggleCoursePublishedServer({ data: { id: c.id, is_published: !c.is_published } });
      toast.success(c.is_published ? "Curso ocultado" : "Curso publicado");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar curso");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteCourseServer({ data: id });
      toast.success("Curso excluído");
      setDeleteId(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir curso");
    }
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
  const [supportMaterialUrl, setSupportMaterialUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (course) {
      const { id, ...rest } = course;
      const desc = rest.description || "";
      const match = desc.match(/\[SUPPORT_MATERIAL:(.*?)\]/);
      if (match) {
        setSupportMaterialUrl(match[1]);
        setForm({ 
          ...rest, 
          description: desc.replace(/\[SUPPORT_MATERIAL:(.*?)\]/, "").trim(),
          affiliate_available: rest.affiliate_available ?? false,
          commission_percentage: rest.commission_percentage ?? 0
        });
      } else {
        setSupportMaterialUrl("");
        setForm({
          ...rest,
          affiliate_available: rest.affiliate_available ?? false,
          commission_percentage: rest.commission_percentage ?? 0
        });
      }
    } else {
      setForm(EMPTY);
      setSupportMaterialUrl("");
    }
  }, [course, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleUploadMaterial = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "pdf";
    const rand = Math.random().toString(36).substring(2, 15);
    const path = `materials/${rand}.${ext}`;
    const { error } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: false });

    if (error) {
      setUploading(false);
      toast.error("Erro no upload: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("certificates").getPublicUrl(path);
    setSupportMaterialUrl(data.publicUrl);
    setUploading(false);
    toast.success("Material de apoio carregado!");
  };

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true);
    const ext = file.name.split(".").pop() || "jpg";
    const rand = Math.random().toString(36).substring(2, 15);
    const path = `courses/covers/${rand}.${ext}`;
    
    const { error } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: false });

    if (error) {
      setUploadingCover(false);
      toast.error("Erro no upload da capa: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("certificates").getPublicUrl(path);
    set("thumbnail_url", data.publicUrl);
    setUploadingCover(false);
    toast.success("Capa do curso carregada!");
  };

  const save = async () => {
    if (!form.title.trim() || !form.instructor.trim()) {
      return toast.error("Título e instrutor são obrigatórios");
    }
    setSaving(true);

    let finalDescription = form.description || "";
    if (supportMaterialUrl.trim()) {
      finalDescription = `${finalDescription.trim()} \n\n[SUPPORT_MATERIAL:${supportMaterialUrl.trim()}]`;
    }

    const payload = {
      ...form,
      thumbnail_url: form.thumbnail_url || null,
      description: finalDescription || null,
      duration_hours: Number(form.duration_hours) || 0,
      total_lessons: Number(form.total_lessons) || 0,
      price: form.price ? Number(form.price) : null,
      affiliate_available: form.affiliate_available ?? false,
      commission_percentage: form.affiliate_available ? (Number(form.commission_percentage) || 0) : null,
    };

    try {
      if (course) {
        await updateCourseServer({ data: { id: course.id, payload } });
      } else {
        await createCourseServer({ data: payload });
      }
      setSaving(false);
      toast.success(course ? "Curso atualizado" : "Curso criado");
      onSaved();
    } catch (err: any) {
      setSaving(false);
      toast.error(err.message || "Erro ao salvar curso");
    }
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

            <Field label="Tipo de Curso">
              <Select value={form.price !== null ? "paid" : "free"} onValueChange={(v) => set("price", v === "paid" ? 49.90 : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Grátis (Incluso na mensalidade)</SelectItem>
                  <SelectItem value="paid">Pago (desbloqueio avulso)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {form.price !== null && (
              <Field label="Preço de Desbloqueio (R$)">
                <Input type="number" step="0.01" min="0.01" value={form.price ?? ""}
                  onChange={(e) => set("price", e.target.value ? Number(e.target.value) : 0)} />
              </Field>
            )}
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Capa do Curso (Thumbnail) *</Label>
            <div className="flex flex-col gap-4">
              {form.thumbnail_url ? (
                <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-border/60 bg-muted">
                  <img src={form.thumbnail_url} alt="Capa do curso" className="h-full w-full object-cover" />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    className="absolute right-2 top-2 rounded-full h-8 px-3"
                    onClick={() => set("thumbnail_url", "")}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="flex aspect-video w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors bg-muted/20 py-8"
                >
                  {uploadingCover ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Clique para enviar imagem da capa</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadCover(f);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/5 p-4 space-y-4">
            <h4 className="font-display text-sm font-bold text-gradient-gold">Opções de Afiliação & Marketplace</h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.affiliate_available || false}
                  onChange={(e) => set("affiliate_available", e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold block">Disponível para Afiliação</span>
                  <span className="text-xs text-muted-foreground">Mostrar no marketplace para empresas</span>
                </div>
              </label>

              {form.affiliate_available && (
                <Field label="Comissão da Afiliação (%)">
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={form.commission_percentage ?? 0}
                    onChange={(e) => set("commission_percentage", Number(e.target.value))} 
                  />
                </Field>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Material de Apoio (Opcional)</Label>
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-xl"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {supportMaterialUrl ? "Alterar Material" : "Enviar Material"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadMaterial(f);
                }}
              />
              {supportMaterialUrl && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <FileText className="h-4 w-4" />
                  <span>Material carregado ✓</span>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
            />
            Publicado (visível na plataforma)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>
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
