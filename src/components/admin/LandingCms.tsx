import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LANDING_DEFAULTS,
  LANDING_PREFIX,
  type LandingContent,
} from "@/hooks/use-landing-content";

type Field = {
  key: keyof LandingContent;
  label: string;
  type?: "text" | "textarea" | "image";
};

const SECTIONS: { id: string; title: string; fields: Field[] }[] = [
  {
    id: "hero",
    title: "Hero (topo da página)",
    fields: [
      { key: "hero_eyebrow", label: "Eyebrow (badge)" },
      { key: "hero_title_1", label: "Título — parte 1" },
      { key: "hero_title_highlight", label: "Título — destaque dourado" },
      { key: "hero_title_2", label: "Título — parte 2" },
      { key: "hero_subtitle", label: "Subtítulo", type: "textarea" },
      { key: "hero_cta_pro", label: "Botão profissional" },
      { key: "hero_cta_company", label: "Botão empresa" },
      { key: "hero_image", label: "Imagem do hero", type: "image" },
    ],
  },
  {
    id: "stats",
    title: "Estatísticas",
    fields: [
      { key: "stat1_value", label: "Stat 1 — valor" },
      { key: "stat1_label", label: "Stat 1 — rótulo" },
      { key: "stat2_value", label: "Stat 2 — valor" },
      { key: "stat2_label", label: "Stat 2 — rótulo" },
      { key: "stat3_value", label: "Stat 3 — valor" },
      { key: "stat3_label", label: "Stat 3 — rótulo" },
    ],
  },
  {
    id: "how",
    title: "Como funciona",
    fields: [
      { key: "how_eyebrow", label: "Eyebrow" },
      { key: "how_title", label: "Título" },
      { key: "how_step1_title", label: "Passo 1 — título" },
      { key: "how_step1_desc", label: "Passo 1 — descrição", type: "textarea" },
      { key: "how_step2_title", label: "Passo 2 — título" },
      { key: "how_step2_desc", label: "Passo 2 — descrição", type: "textarea" },
      { key: "how_step3_title", label: "Passo 3 — título" },
      { key: "how_step3_desc", label: "Passo 3 — descrição", type: "textarea" },
    ],
  },
  {
    id: "jobs",
    title: "Marketplace de vagas",
    fields: [
      { key: "jobs_eyebrow", label: "Eyebrow" },
      { key: "jobs_title", label: "Título" },
      { key: "jobs_subtitle", label: "Subtítulo", type: "textarea" },
    ],
  },
  {
    id: "company",
    title: "Para empresas",
    fields: [
      { key: "company_eyebrow", label: "Eyebrow" },
      { key: "company_title", label: "Título" },
      { key: "company_subtitle", label: "Subtítulo", type: "textarea" },
    ],
  },
  {
    id: "cta",
    title: "CTA final",
    fields: [
      { key: "cta_title", label: "Título" },
      { key: "cta_subtitle", label: "Subtítulo", type: "textarea" },
      { key: "cta_btn_primary", label: "Botão primário" },
      { key: "cta_btn_secondary", label: "Botão secundário" },
    ],
  },
];

export function LandingCms() {
  const [values, setValues] = useState<LandingContent>(LANDING_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .like("key", `${LANDING_PREFIX}%`);
    const merged: LandingContent = { ...LANDING_DEFAULTS };
    (data ?? []).forEach((row: any) => {
      const k = row.key.slice(LANDING_PREFIX.length);
      if (row.value != null) merged[k] = row.value;
    });
    setValues(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const rows = Object.entries(values).map(([k, v]) => ({
      key: `${LANDING_PREFIX}${k}`,
      value: v,
    }));
    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Landing page atualizada");
  };

  const resetField = (k: keyof LandingContent) => {
    set(k as string, LANDING_DEFAULTS[k]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Edite textos e imagens. As alterações refletem instantaneamente em{" "}
          <span className="font-mono">/</span>.
        </p>
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar tudo
        </Button>
      </div>

      <Tabs defaultValue={SECTIONS[0].id} className="w-full">
        <div className="-mx-1 overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max gap-1 bg-surface/40">
            {SECTIONS.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="whitespace-nowrap text-xs">
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {SECTIONS.map((s) => (
          <TabsContent key={s.id} value={s.id} className="mt-6">
            <div className="grid gap-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
              {s.fields.map((f) => (
                <FieldRow
                  key={f.key as string}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => set(f.key as string, v)}
                  onReset={() => resetField(f.key)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  onReset,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${field.key as string}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("landing")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      setUploading(false);
      return toast.error("Erro no upload: " + error.message);
    }
    const { data } = supabase.storage.from("landing").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-sm">{field.label}</Label>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Padrão
        </button>
      </div>

      {field.type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : field.type === "image" ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Enviar imagem
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
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="ou cole uma URL"
              className="flex-1"
            />
          </div>
          {value && (
            <img
              src={value}
              alt="Preview"
              className="max-h-40 rounded-lg border border-border/60"
            />
          )}
        </div>
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
