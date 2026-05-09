import { useEffect, useState } from "react";
import { Pencil, Trash2, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

type Post = {
  id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  is_hidden: boolean;
  created_at: string;
};

export function ExperiencesAdmin() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Post[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleHidden = async (p: Post) => {
    const { error } = await supabase.from("posts").update({ is_hidden: !p.is_hidden }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_hidden ? "Publicação visível" : "Publicação ocultada");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Publicação excluída");
    setDeleteId(null);
    load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Sparkles}
        eyebrow="Feed da comunidade"
        title="Experiências"
        description="Moderar publicações de profissionais e empresas."
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma publicação ainda. Quando profissionais publicarem experiências, elas aparecerão aqui.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.author_name || "—"}</p>
                    <span className="text-xs text-muted-foreground">· {p.author_role}</span>
                    <span className={"ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] " + (p.is_hidden ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-400")}>
                      {p.is_hidden ? "Oculta" : "Visível"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{p.content}</p>
                  {p.image_url && <img src={p.image_url} className="mt-3 max-h-60 rounded-xl border border-border/60" />}
                  {p.video_url && <video src={p.video_url} controls className="mt-3 max-h-60 rounded-xl border border-border/60" />}
                  <p className="mt-2 text-[11px] text-muted-foreground/70">{new Date(p.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleHidden(p)} title={p.is_hidden ? "Exibir" : "Ocultar"}>
                    {p.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar publicação</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo</Label>
              <Textarea rows={6} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_hidden} onChange={(e) => setEditing({ ...editing, is_hidden: e.target.checked })} />
                Ocultar publicação
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!editing) return;
                const { error } = await supabase
                  .from("posts")
                  .update({ content: editing.content, is_hidden: editing.is_hidden })
                  .eq("id", editing.id);
                if (error) return toast.error(error.message);
                toast.success("Publicação atualizada");
                setEditing(null);
                load();
              }}
            >Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
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
