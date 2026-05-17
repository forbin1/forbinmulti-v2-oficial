import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Download, Search, Loader2, FileText, User, CheckCircle2, X } from "lucide-react";
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

type CompletedEnrollment = {
  id: string;
  user_id: string;
  course_id: string;
  completed_at: string;
  profiles?: {
    full_name: string;
  };
  courses?: {
    title: string;
  };
};

export function UserCertificatesAdmin() {
  const [items, setItems] = useState<UserCertificate[]>([]);
  const [completions, setCompletions] = useState<CompletedEnrollment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<UserCertificate | null>(null);
  const [q, setQ] = useState("");
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const [viewPdfName, setViewPdfName] = useState("");
  
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
    const [certs, profs, enrolls] = await Promise.all([
      supabase
        .from("user_certificates")
        .select(`*, profiles:user_id (full_name)`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
      supabase
        .from("enrollments")
        .select(`
          id, user_id, course_id, completed_at,
          profiles:user_id (full_name),
          courses:course_id (title)
        `)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
    ]);

    if (certs.error && certs.error.code !== "PGRST116") {
      console.error(certs.error);
    }

    setItems((certs.data as any) || []);
    setUsers((profs.data as UserProfile[]) || []);
    setCompletions((enrolls.data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    
    // Subscribe to enrollments to update completions in real-time
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrollments',
          filter: 'completed_at=not.is.null',
        },
        () => load()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="space-y-10">
      
      {/* SEÇÃO: Alunos Aguardando Certificado */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="font-display text-xl font-bold">Cursos Concluídos (Aguardando/Aprovação)</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : completions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Nenhum curso recém-concluído encontrado.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completions.map((comp) => (
              <div key={comp.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40">
                <p className="font-semibold text-sm truncate">{comp.profiles?.full_name || "Usuário"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> {comp.courses?.title || "Curso Removido"}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground uppercase">
                  Concluído em: {new Date(comp.completed_at).toLocaleDateString("pt-BR")}
                </p>
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    className="w-full rounded-full text-xs shadow-gold bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      setForm({
                        user_id: comp.user_id,
                        name: comp.courses?.title || "",
                        pdf_url: "",
                        hours: "",
                        issued_at: new Date(comp.completed_at).toISOString().split("T")[0],
                      });
                      setOpen(true);
                    }}
                  >
                    <Plus className="mr-1.5 h-3 w-3" /> Aprovar / Enviar PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO: Certificados Emitidos */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">Certificados Emitidos</h2>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar certificado..."
              className="pl-10 rounded-full h-9"
            />
          </div>
          <Button onClick={() => setOpen(true)} className="rounded-full shadow-gold" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Novo Emissão Avulsa
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-sm text-muted-foreground">
            Nenhum certificado emitido encontrado.
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
                      Emitido: {new Date(item.issued_at).toLocaleDateString("pt-BR")} {item.hours ? `· ${item.hours}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-full text-xs"
                    onClick={() => {
                      setViewPdfUrl(item.pdf_url);
                      setViewPdfName(`Certificado - ${item.name}`);
                    }}
                  >
                    <FileText className="mr-1.5 h-3 w-3" /> Visualizar PDF
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
      </section>

      <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setForm({
            user_id: "",
            name: "",
            pdf_url: "",
            hours: "",
            issued_at: new Date().toISOString().split("T")[0],
          });
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Aprovar / Vincular Certificado</DialogTitle>
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
              <Label>Arquivo PDF do Certificado</Label>
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
                  {form.pdf_url ? "Trocar PDF" : "Enviar PDF Aprovado"}
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
            <Button onClick={save} disabled={saving || uploading} className="rounded-full px-8 shadow-gold bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Certificado
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

      {/* Visualizador de PDF em Tela Cheia */}
      {viewPdfUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Visualização de Certificado</h3>
                <p className="text-xs text-white/50">{viewPdfName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="default" 
                className="rounded-full shadow-gold bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:flex"
                onClick={async () => {
                  try {
                    toast.loading("Iniciando download...", { id: "dl-cert" });
                    const res = await fetch(viewPdfUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${viewPdfName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Download concluído!", { id: "dl-cert" });
                  } catch (e) {
                    toast.error("Erro ao tentar baixar.", { id: "dl-cert" });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Baixar
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setViewPdfUrl(null)}
                title="Fechar visualizador"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full overflow-hidden p-2 sm:p-4">
            <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <iframe 
                src={`${viewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full"
                title="Visualizador de PDF"
                frameBorder="0"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
