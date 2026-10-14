import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Video, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const Route = createFileRoute("/admin/vsl")({
  component: VslPage,
});

const BUCKET = "vsl";
// Limite global do projeto Supabase (plano Free = 50 MB por arquivo).
const MAX_SIZE_MB = 50;
const ALLOWED_EXT = ["mp4", "webm", "mov", "m4v", "ogg", "ogv"];
const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogg: "video/ogg",
  ogv: "video/ogg",
};

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Extrai o caminho do objeto a partir da URL pública do bucket. */
function pathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

function friendlyError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 413 || lower.includes("maximum allowed size") || lower.includes("too large"))
    return "Arquivo maior que o limite permitido pelo servidor de armazenamento.";
  if (status === 401 || status === 403 || lower.includes("row-level security") || lower.includes("unauthorized"))
    return "Sem permissão. Verifique se sua conta é administradora e faça login novamente.";
  if (lower.includes("bucket not found")) return "Bucket 'vsl' não encontrado no Supabase.";
  if (lower.includes("mime")) return "Formato de vídeo não aceito pelo servidor.";
  try {
    const j = JSON.parse(body);
    return j.message || j.error || `Erro ${status}`;
  } catch {
    return body || `Erro ${status}`;
  }
}

/** Salva vsl_url sem depender de upsert: atualiza; se não existir, insere. */
async function saveVslUrl(value: string): Promise<{ message: string } | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: now })
    .eq("key", "vsl_url")
    .select("key");
  if (error) return error;
  if (data && data.length > 0) return null;
  const { error: insErr } = await supabase
    .from("site_settings")
    .insert({ key: "vsl_url", value, updated_at: now });
  return insErr ?? null;
}

function VslPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "vsl_url")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar VSL: " + error.message);
        setCurrentUrl(data?.value ?? null);
        setLoading(false);
      });
  }, []);

  // Evita fechar a aba durante o envio
  useEffect(() => {
    if (!uploading) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [uploading]);

  const uploadWithProgress = (path: string, file: File, contentType: string, token: string) =>
    new Promise<void>((resolve, reject) => {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const url = `${baseUrl}/storage/v1/object/${BUCKET}/${encodeURIComponent(path)}`;
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", apiKey);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("cache-control", "max-age=31536000");
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(friendlyError(xhr.status, xhr.responseText)));
      };
      xhr.onerror = () => {
        xhrRef.current = null;
        reject(new Error("Falha de rede durante o envio. Verifique sua conexão."));
      };
      xhr.onabort = () => {
        xhrRef.current = null;
        reject(new Error("__aborted__"));
      };
      xhr.send(file);
    });

  const processFile = useCallback(
    async (file: File) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXT.includes(ext) && !file.type.startsWith("video/")) {
        toast.error("Formato inválido. Use MP4, WEBM ou MOV.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(
          `Vídeo muito grande (${formatBytes(file.size)}). Máximo: ${MAX_SIZE_MB} MB. Comprima o vídeo (ex: HandBrake, 720p) ou use a opção "Usar link".`,
          { duration: 10000 },
        );
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const safeExt = ALLOWED_EXT.includes(ext) ? ext : "mp4";
      const contentType = file.type || MIME_BY_EXT[safeExt] || "video/mp4";
      const path = `vsl-${Date.now()}.${safeExt}`;
      const oldPath = pathFromPublicUrl(currentUrl);

      setUploading(true);
      setProgress(0);
      setFileInfo({ name: file.name, size: file.size });

      try {
        await uploadWithProgress(path, file, contentType, token);

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path);

        const setErr = await saveVslUrl(publicUrl);
        if (setErr) {
          // desfaz o upload para não deixar arquivo órfão
          await supabase.storage.from(BUCKET).remove([path]);
          throw new Error("Vídeo enviado, mas falhou ao salvar configuração: " + setErr.message);
        }

        // remove vídeo antigo (não bloqueante)
        if (oldPath && oldPath !== path) {
          supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
        }

        setCurrentUrl(publicUrl);
        toast.success("VSL atualizada com sucesso!");
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "__aborted__") toast.info("Envio cancelado.");
        else toast.error("Erro ao enviar vídeo: " + msg);
      } finally {
        setUploading(false);
        setProgress(0);
        setFileInfo(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [currentUrl],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleCancel = () => xhrRef.current?.abort();

  const [linkUrl, setLinkUrl] = useState("");
  const handleSaveLink = async () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\/.+/i.test(url)) return toast.error("Informe um link válido (https://...).");
    const error = await saveVslUrl(url);
    if (error) return toast.error("Erro ao salvar link: " + error.message);
    setCurrentUrl(url);
    setLinkUrl("");
    toast.success("VSL atualizada com sucesso!");
  };

  const handleRemove = async () => {
    if (!confirm("Remover a VSL da landing?")) return;
    const oldPath = pathFromPublicUrl(currentUrl);
    const error = await saveVslUrl("");
    if (error) return toast.error("Erro ao remover: " + error.message);
    if (oldPath) supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
    setCurrentUrl(null);
    toast.success("VSL removida");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Video}
        eyebrow="Vídeo de vendas"
        title="VSL da Landing"
        description="Vídeo exibido no topo da página inicial."
      />

      {loading ? (
        <div className="mb-5 flex aspect-video w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : currentUrl ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border/60">
          <video
            key={currentUrl}
            src={currentUrl}
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full bg-black"
          />
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-5 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20"
        }`}
      >
        {uploading && fileInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{fileInfo.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatBytes((fileInfo.size * progress) / 100)} / {formatBytes(fileInfo.size)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {progress < 100 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando... {progress}%
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Finalizando...
                  </>
                )}
              </span>
              {progress < 100 && (
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Não feche esta página durante o envio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste o vídeo aqui ou clique no botão abaixo
              <br />
              <span className="text-xs">MP4 (recomendado), WEBM ou MOV · até {MAX_SIZE_MB} MB</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-primary/90 ${
            uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
          }`}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : currentUrl ? "Substituir vídeo" : "Enviar vídeo"}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.m4v"
            className="hidden"
            disabled={uploading}
            onChange={handleInput}
          />
        </label>
        {currentUrl && !uploading && (
          <Button variant="outline" className="rounded-full" onClick={handleRemove}>
            Remover / Ocultar
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
        <p className="mb-2 text-sm font-medium">Vídeo maior que {MAX_SIZE_MB} MB? Use um link direto (.mp4)</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://.../video.mp4"
            className="min-w-0 flex-1 rounded-full border border-border/60 bg-background px-4 py-2 text-sm"
          />
          <Button className="rounded-full" onClick={handleSaveLink} disabled={uploading}>
            Usar link
          </Button>
        </div>
      </div>
    </div>
  );
}
