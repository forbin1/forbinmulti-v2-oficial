import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Download, Search, Loader2, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

type UserProfile = {
  user_id: string;
  full_name: string;
};

type UserCertificate = {
  id: string;
  user_id: string;
  name: string;
  pdf_url: string;
  issued_at: string;
  hours: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
};

export function UserCertificatesAdmin() {
  const [items, setItems] = useState<UserCertificate[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<UserCertificate | null>(null);
  const [q, setQ] = useState("");
  
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    pdf_url: "",
    hours: "",
    issued_at: new Date().toISOString().split("T")[0],
  });

  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    const [certs, profs] = await Promise.all([
      supabase
        .from("user_certificates")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);

    if (certs.error) {
      console.error(certs.error);
      // If table doesn't exist yet, we'll show an empty state but warn the user
      if (certs.error.code === "PGRST116" || certs.error.message.includes("does not exist")) {
        toast.error("Tabela 'user_certificates' não encontrada. Verifique o banco de dados.");
      }
    }

    setItems((certs.data as any) || []);
    setUsers((profs.data as UserProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      return toast.error("Por favor, envie apenas arquivos PDF");
    }

    setUploading(true);
    const path = `user-certs/${crypto.randomUUID()}.pdf`;
    const { error } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: false });

    if (error) {
      setUploading(false);
      toast.error("Erro no upload: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("certificates").getPublicUrl(path);
    setForm((f) => ({ ...f, pdf_url: data.publicUrl }));
    setUploading(false);
    toast.success("PDF enviado com sucesso!");
  };

  const save = async () => {
    if (!form.user_id) return toast.error("Selecione um usuário");
    if (!form.name.trim()) return toast.error("Informe o nome do certificado");
    if (!form.pdf_url) return toast.error("Faça upload do PDF");

    setSaving(true);
    const { error } = await supabase.from("user_certificates").insert({
      user_id: form.user_id,
      name: form.name,
      pdf_url: form.pdf_url,
      hours: form.hours || null,
      issued_at: form.issued_at,
    });

    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);

    toast.success("Certificado vinculado ao usuário!");
    setOpen(false);
    setForm({
      user_id: "",
      name: "",
      pdf_url: "",
      hours: "",
      issued_at: new Date().toISOString().split("T")[0],
    });
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("user_certificates")
      .delete()
      .eq("id", toDelete.id);
    
    if (error) return toast.error("Erro ao excluir: " + error.message);
    toast.success("Certificado removido");
    setToDelete(null);
    load();
  };

  const filtered = q
    ? items.filter((i) =>
        [i.name, i.profiles?.full_name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q.toLowerCase()))
      )
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por usuário ou curso..."
            className="pl-10 rounded-full"
          />
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full shadow-gold">
          <Plus className="mr-2 h-4 w-4" /> Vincular Certificado
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
          Nenhum certificado individual encontrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{item.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{item.profiles?.full_name || "Usuário não encontrado"}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground uppercase">
                    Emitido em: {new Date(item.issued_at).toLocaleDateString("pt-BR")} {item.hours ? `· ${item.hours}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 rounded-full text-xs">
                  <a href={item.pdf_url} target="_blank" rel="noreferrer">
                    <Download className="mr-1.5 h-3 w-3" /> Ver PDF
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                  onClick={() => setToDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Certificado ao Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Curso / Certificado</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Supervisor de Segurança Patrimonial"
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Carga Horária (opcional)</Label>
                <Input
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                  placeholder="Ex: 40h"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Arquivo PDF</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {form.pdf_url ? "Trocar PDF" : "Selecionar PDF"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </div>
              {form.pdf_url && (
                <p className="text-[10px] text-emerald-500 font-medium text-center">PDF carregado com sucesso!</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || uploading} className="rounded-full px-8">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover certificado?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário não terá mais acesso a este documento. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
