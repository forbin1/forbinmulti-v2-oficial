import { useEffect, useState, useRef } from "react";
import {
  Pencil, Trash2, Plus, Loader2, Layers, Video, ArrowUp, ArrowDown, Upload, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
};

type Lesson = {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
};

export function ModulesManager({
  open,
  courseId,
  courseTitle,
  onClose,
}: {
  open: boolean;
  courseId: string | null;
  courseTitle: string;
  onClose: () => void;
}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<string | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (open && courseId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

  async function load() {
    if (!courseId) return;
    setLoading(true);
    const [{ data: mods }, { data: less }] = await Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", courseId).order("sort_order"),
      supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order"),
    ]);
    setModules((mods as Module[]) || []);
    setLessons((less as Lesson[]) || []);
    setLoading(false);
  }

  async function moveModule(m: Module, dir: -1 | 1) {
    const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === m.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("course_modules").update({ sort_order: swap.sort_order }).eq("id", m.id),
      supabase.from("course_modules").update({ sort_order: m.sort_order }).eq("id", swap.id),
    ]);
    void load();
  }

  async function removeModule(id: string) {
    // remove aulas do módulo (não desassocia, exclui)
    await supabase.from("lessons").delete().eq("module_id", id);
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Módulo excluído");
    setDeleteModuleId(null);
    void load();
  }

  async function removeLesson(id: string) {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Aula excluída");
    setDeleteLessonId(null);
    void load();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Módulos · {courseTitle}
            </DialogTitle>
            <DialogDescription>
              Organize as aulas do curso em módulos e faça upload dos vídeos.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex justify-end">
            <Button size="sm" className="rounded-full" onClick={() => setCreatingModule(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo módulo
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : modules.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Nenhum módulo criado. Comece adicionando o primeiro módulo do curso.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {modules.map((m, idx) => {
                const ls = lessons.filter((l) => l.module_id === m.id);
                return (
                  <div key={m.id} className="rounded-2xl border border-border/60 bg-card">
                    <div className="flex items-center gap-2 border-b border-border/60 p-4">
                      <div className="flex flex-col gap-0.5">
                        <button
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => moveModule(m, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === modules.length - 1}
                          onClick={() => moveModule(m, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                          Módulo {idx + 1}
                        </p>
                        <p className="truncate font-semibold">{m.title}</p>
                        {m.description && (
                          <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingModule(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteModuleId(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <ul className="divide-y divide-border/40">
                      {ls.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-muted-foreground">Nenhuma aula neste módulo.</li>
                      ) : (
                        ls.map((l, i) => (
                          <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{l.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {l.video_url ? "🎬 vídeo enviado" : "sem vídeo"}
                                {l.duration_minutes ? ` · ${l.duration_minutes}min` : ""}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditingLesson(l)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteLessonId(l.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>

                    <div className="border-t border-border/40 p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => setCreatingLessonFor(m.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Adicionar aula
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Module dialog */}
      {(creatingModule || editingModule) && courseId && (
        <ModuleDialog
          open={true}
          courseId={courseId}
          module={editingModule}
          nextSort={modules.length}
          onClose={() => { setCreatingModule(false); setEditingModule(null); }}
          onSaved={() => { setCreatingModule(false); setEditingModule(null); void load(); }}
        />
      )}

      {/* Lesson dialog */}
      {(creatingLessonFor || editingLesson) && courseId && (
        <LessonDialog
          open={true}
          courseId={courseId}
          moduleId={creatingLessonFor ?? editingLesson!.module_id!}
          lesson={editingLesson}
          nextSort={lessons.filter((l) => l.module_id === (creatingLessonFor ?? editingLesson!.module_id)).length}
          onClose={() => { setCreatingLessonFor(null); setEditingLesson(null); }}
          onSaved={() => { setCreatingLessonFor(null); setEditingLesson(null); void load(); }}
        />
      )}

      <AlertDialog open={!!deleteModuleId} onOpenChange={(o) => !o && setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir módulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as aulas deste módulo também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteModuleId && removeModule(deleteModuleId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLessonId} onOpenChange={(o) => !o && setDeleteLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLessonId && removeLesson(deleteLessonId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ModuleDialog({
  open, courseId, module, nextSort, onClose, onSaved,
}: {
  open: boolean;
  courseId: string;
  module: Module | null;
  nextSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    setSaving(true);
    const payload = {
      course_id: courseId,
      title: title.trim(),
      description: description.trim() || null,
    };
    const { error } = module
      ? await supabase.from("course_modules").update(payload).eq("id", module.id)
      : await supabase.from("course_modules").insert({ ...payload, sort_order: nextSort });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(module ? "Módulo atualizado" : "Módulo criado");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{module ? "Editar módulo" : "Novo módulo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Introdução" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonDialog({
  open, courseId, moduleId, lesson, nextSort, onClose, onSaved,
}: {
  open: boolean;
  courseId: string;
  moduleId: string;
  lesson: Lesson | null;
  nextSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [duration, setDuration] = useState(lesson?.duration_minutes ?? 0);
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      return toast.error("Vídeo muito grande (máx. 500MB)");
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${courseId}/${moduleId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("lesson-videos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("lesson-videos").getPublicUrl(path);
      setVideoUrl(data.publicUrl);
      toast.success("Vídeo enviado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    setSaving(true);
    const payload = {
      course_id: courseId,
      module_id: moduleId,
      title: title.trim(),
      description: description.trim() || null,
      duration_minutes: Number(duration) || 0,
      video_url: videoUrl.trim() || null,
    };
    const { error } = lesson
      ? await supabase.from("lessons").update(payload).eq("id", lesson.id)
      : await supabase.from("lessons").insert({ ...payload, sort_order: nextSort });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(lesson ? "Aula atualizada" : "Aula criada");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{lesson ? "Editar aula" : "Nova aula"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duração (minutos)</Label>
            <Input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-border/60 bg-surface/40 p-4">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Video className="h-3.5 w-3.5" /> Vídeo da aula
            </Label>
            {videoUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-xs">
                  <span className="truncate text-emerald-500">✓ Vídeo configurado</span>
                  <button
                    type="button"
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                    onClick={() => setVideoUrl("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <video src={videoUrl} controls className="aspect-video w-full rounded-lg bg-black" />
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando vídeo...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Fazer upload de vídeo (MP4, até 500MB)</>
                  )}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={onPick}
                />
                <div className="text-center text-[11px] text-muted-foreground">ou cole uma URL</div>
                <Input
                  placeholder="https://... ou link do YouTube/Vimeo"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
