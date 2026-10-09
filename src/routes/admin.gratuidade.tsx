import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FreeMode = "lifetime" | "days_90";

const MODE_LABEL: Record<FreeMode, string> = {
  lifetime: "Gratuidade vitalícia",
  days_90: "Gratuidade por 90 dias",
};

export const Route = createFileRoute("/admin/gratuidade")({
  component: FreeModePage,
});

type UserRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  free_grant_type: string | null;
  free_granted_at: string | null;
  created_at: string;
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

function grantLabel(u: UserRow) {
  if (u.free_grant_type === "lifetime") return "Vitalícia";
  if (u.free_grant_type === "days_90") {
    const exp = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null;
    return exp && exp < new Date() ? "90 dias (expirada)" : "90 dias";
  }
  return "—";
}

function UsersList({ reloadKey }: { reloadKey: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "professional" | "company">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, role, subscription_status, subscription_plan, subscription_expires_at, free_grant_type, free_granted_at, created_at")
        .not("role", "is", null)
        .neq("role", "admin")
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar usuários: " + error.message);
      setUsers((data as UserRow[]) ?? []);
      setLoading(false);
    })();
  }, [reloadKey]);

  const isCompany = (u: UserRow) => u.role === "company";
  const shown = users.filter((u) =>
    filter === "all" ? true : filter === "company" ? isCompany(u) : !isCompany(u),
  );
  const companies = users.filter(isCompany).length;
  const granted = users.filter((u) => u.free_grant_type).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários cadastrados</CardTitle>
        <CardDescription>
          {users.length} cadastros · {users.length - companies} profissionais · {companies} empresas · {granted} com gratuidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "Todos"],
            ["professional", "Profissionais"],
            ["company", "Empresas"],
          ] as const).map(([k, l]) => (
            <Button key={k} id={`free-users-filter-${k}`} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
              {l}
            </Button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Plano</th>
                  <th className="px-3 py-2">Expira em</th>
                  <th className="px-3 py-2">Gratuidade</th>
                  <th className="px-3 py-2">Concedida em</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium">{u.full_name || "Sem nome"}</td>
                    <td className="px-3 py-2">{isCompany(u) ? "Empresa" : "Profissional"}</td>
                    <td className="px-3 py-2">{u.subscription_status === "active" ? u.subscription_plan || "Ativo" : "Sem plano"}</td>
                    <td className="px-3 py-2">
                      {u.subscription_status === "active" ? (u.subscription_expires_at ? fmtDate(u.subscription_expires_at) : "Sem expiração") : "—"}
                    </td>
                    <td className="px-3 py-2">{grantLabel(u)}</td>
                    <td className="px-3 py-2">{fmtDate(u.free_granted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FreeModePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<FreeMode>("lifetime");
  const [saved, setSaved] = useState<{ enabled: boolean; mode: FreeMode } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("free_mode_settings")
        .select("enabled, mode")
        .eq("id", 1)
        .maybeSingle();
      if (error) toast.error("Erro ao carregar configurações");
      if (data) {
        setEnabled(!!data.enabled);
        setMode(data.mode as FreeMode);
        setSaved({ enabled: !!data.enabled, mode: data.mode as FreeMode });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any).rpc("save_free_mode", { _enabled: enabled, _mode: mode });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    setSaved({ enabled, mode });
    setReloadKey((k) => k + 1);
    toast.success(enabled ? "Modo de Gratuidade ativado e aplicado aos cadastros" : "Modo de Gratuidade desativado");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Gift}
        eyebrow="Monetização"
        title="Modo de Gratuidade"
        description="Conceda gratuidade a todos os cadastros de profissionais e empresas, existentes e novos."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status atual</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={
                  "rounded-full px-3 py-1 font-semibold " +
                  (saved?.enabled ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")
                }
              >
                {saved?.enabled ? "Ativo" : "Inativo"}
              </span>
              <span className="text-muted-foreground">
                Opção selecionada: <strong className="text-foreground">{MODE_LABEL[saved?.mode ?? "lifetime"]}</strong>
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>
                Ao desativar, novos benefícios deixam de ser concedidos; os já concedidos são preservados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
                <div>
                  <Label htmlFor="free-mode-enabled" className="text-base">Ativar Modo de Gratuidade</Label>
                  <p className="text-xs text-muted-foreground">Aplica-se a profissionais e empresas.</p>
                </div>
                <Switch id="free-mode-enabled" checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <RadioGroup value={mode} onValueChange={(v) => setMode(v as FreeMode)} className="space-y-3">
                <label htmlFor="mode-lifetime" className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 hover:bg-accent/40">
                  <RadioGroupItem id="mode-lifetime" value="lifetime" className="mt-1" />
                  <div>
                    <p className="font-medium">Gratuidade vitalícia</p>
                    <p className="text-xs text-muted-foreground">Sem cobrança e sem prazo de expiração.</p>
                  </div>
                </label>
                <label htmlFor="mode-90" className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 hover:bg-accent/40">
                  <RadioGroupItem id="mode-90" value="days_90" className="mt-1" />
                  <div>
                    <p className="font-medium">Gratuidade por 90 dias</p>
                    <p className="text-xs text-muted-foreground">
                      Sem cobrança por 90 dias a partir da aplicação ao cadastro. Depois, seguem as regras de cobrança atuais.
                    </p>
                  </div>
                </label>
              </RadioGroup>

              <div className="flex justify-end">
                <Button id="free-mode-save" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          <UsersList reloadKey={reloadKey} />
        </div>
      )}
    </div>
  );
}
