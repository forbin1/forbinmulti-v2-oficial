import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, KeyRound, Building2 } from "lucide-react";

export const Route = createFileRoute("/empresa/configuracoes")({
  component: EmpresaConfiguracoes,
});

function EmpresaConfiguracoes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState("");

  // Company info states
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");

  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) return;
      try {
        setLoading(true);
        let { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        // Auto-heal missing company record on load
        if (!data) {
          const defaultName = user.user_metadata?.company_name || "Minha Empresa";
          const { data: newComp, error: insertErr } = await supabase
            .from("companies")
            .insert({
              user_id: user.id,
              company_name: defaultName,
              city: "Rio de Janeiro",
              state: "RJ"
            })
            .select()
            .single();

          if (!insertErr && newComp) {
            data = newComp;
          }
        }

        if (data) {
          setCompanyId(data.id);
          setCompanyName(data.company_name || "");
          setUsername(data.username || "");
          setCnpj(data.cnpj || "");
          setPhone(data.phone || "");
          setWebsite(data.website || "");
          setCity(data.city || "");
          setState(data.state || "");
          setDescription(data.description || "");
          setEmployeeCount(data.employee_count?.toString() || "");
        }
      } catch (err: any) {
        toast.error("Erro ao carregar configurações: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9-_]/g, "");

      if (!companyId) {
        const { data: newComp, error: insertErr } = await supabase
          .from("companies")
          .insert({
            user_id: user.id,
            company_name: companyName,
            username: cleanUsername,
            cnpj,
            phone,
            website,
            city,
            state,
            description,
            employee_count: employeeCount ? parseInt(employeeCount) : null,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        if (newComp) {
          setCompanyId(newComp.id);
        }
      } else {
        const { error } = await supabase
          .from("companies")
          .update({
            company_name: companyName,
            username: cleanUsername,
            cnpj,
            phone,
            website,
            city,
            state,
            description,
            employee_count: employeeCount ? parseInt(employeeCount) : null,
          })
          .eq("id", companyId);

        if (error) throw error;
      }
      toast.success("Configurações atualizadas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Erro ao alterar senha: " + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie os detalhes corporativos e segurança da sua empresa.</p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Profile/Company Details form */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Informações da Empresa</h2>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Nome de Usuário (Slug do Perfil) *</Label>
                <div className="flex rounded-xl border border-border bg-surface overflow-hidden">
                  <span className="flex items-center px-3 bg-muted text-xs text-muted-foreground border-r border-border select-none">
                    forbin.com/perfil/
                  </span>
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 px-3" 
                    placeholder="ex: grupolewis" 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Seu perfil público estará em: <strong className="text-primary">/perfil/{username.toLowerCase().replace(/[^a-z0-9-_]/g, "") || "seu-usuario"}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Telefone de Contato</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Site / Link</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} className="bg-surface" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Funcionários</Label>
                <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} className="bg-surface" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Sobre a Empresa</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-surface" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password form */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4 mb-6">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Alterar Senha</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-surface" />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-surface" />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={passwordLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Alterar Senha
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
