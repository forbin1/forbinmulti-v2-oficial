import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const Route = createFileRoute("/admin/vsl")({
  component: VslPage,
});

function VslPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "vsl_url")
      .maybeSingle()
      .then(({ data }) => setCurrentUrl(data?.value ?? null));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `vsl-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vsl")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("vsl").getPublicUrl(path);
      const { error: setErr } = await supabase
        .from("site_settings")
        .upsert({ key: "vsl_url", value: publicUrl, updated_at: new Date().toISOString() });
      if (setErr) throw setErr;
      setCurrentUrl(publicUrl);
      toast.success("VSL atualizada com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar vídeo: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "vsl_url", value: null, updated_at: new Date().toISOString() });
    if (error) return toast.error("Erro ao remover");
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

      {currentUrl && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border/60">
          <video src={currentUrl} controls className="aspect-video w-full bg-black" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : currentUrl ? "Substituir vídeo" : "Enviar vídeo"}
          <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={handleUpload} />
        </label>
        {currentUrl && (
          <Button variant="outline" className="rounded-full" onClick={handleRemove}>
            Remover / Ocultar
          </Button>
        )}
      </div>
    </div>
  );
}
