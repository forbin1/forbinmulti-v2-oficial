import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, Loader2, Upload, Award } from "lucide-react";
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

type Template = {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
};

type Course = { id: string; title: string };

const empty: Omit<Template, "id"> = {
  name: "",
  description: "",
  course_id: null,
  image_url: null,
  is_published: true,
  sort_order: 0,
};

export function CertificatesAdmin() {
  const [items, setItems] = useState<Template[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState<Omit<Template, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    const [tpls, crs] = await Promise.all([
      supabase
        .from("certificate_templates")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase.from("courses").select("id, title").order("title"),
    ]);
    if (tpls.error) toast.error("Erro ao carregar modelos");
    setItems(((tpls.data as any) ?? []) as Template[]);
    setCourses(((crs.data as any) ?? []) as Course[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ ...t });
    setOpen(true);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `templates/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error("Erro no upload: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("certificates").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Imagem enviada");
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Informe um nome");
    setSaving(true);
    const payload = {
      ...form,
      description: form.description || null,
      course_id: form.course_id || null,
    };
    const { error } = editing
      ? await supabase
          .from("certificate_templates")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("certificate_templates").insert(payload);
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success(editing ? "Modelo atualizado" : "Modelo criado");
    setOpen(false);
    load();
  };

  const toggle = async (t: Template) => {
    const { error } = await supabase
      .from("certificate_templates")
      .update({ is_published: !t.is_published })
      .eq("id", t.id);
    if (error) return toast.error("Erro");
    toast.success(t.is_published ? "Modelo oculto" : "Modelo publicado");
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", toDelete.id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Modelo excluído");
    setToDelete(null);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Modelos visíveis para profissionais que concluíram cursos.
        </p>
        <Button onClick={openNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo modelo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Nenhum modelo de certificado cadastrado.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => {
            const course = courses.find((c) => c.id === t.course_id);
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card"
              >
                <div className="relative aspect-[4/3] bg-surface/40">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Award className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    {t.is_published ? (
                      <Badge className="bg-emerald-600/90 text-white">
                        Publicado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Oculto</Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  {course && (
                    <p className="text-xs text-muted-foreground">
                      Curso: {course.title}
                    </p>
                  )}
                  {t.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggle(t)}
                      title={t.is_published ? "Ocultar" : "Publicar"}
                    >
                      {t.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setToDelete(t)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar modelo" : "Novo modelo de certificado"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label>Nome do modelo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Certificado de Conclusão — Vigilância Patrimonial"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>Curso vinculado (opcional)</Label>
              <Select
                value={form.course_id ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, course_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Imagem do certificado</Label>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {form.image_url ? "Trocar imagem" : "Enviar imagem"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                  }}
                />
                {form.image_url && (
                  <span className="text-xs text-muted-foreground">
                    Imagem carregada ✓
                  </span>
                )}
              </div>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-3 max-h-48 rounded-lg border border-border/60"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="mt-7 flex items-center gap-2 text-sm">
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
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo "{toDelete?.name}" será
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
