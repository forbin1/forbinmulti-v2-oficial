import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Building2, FileCheck2, Users, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro-empresa")({
  head: () => ({
    meta: [
      { title: "Cadastro de Empresa — FORBIN" },
      { name: "description", content: "Cadastre sua empresa e publique vagas para profissionais qualificados." },
    ],
  }),
  component: CadastroEmpresa,
});

const STEPS = [
  { id: 1, title: "Criar conta", icon: Mail },
  { id: 2, title: "Dados da empresa", icon: Building2 },
  { id: 3, title: "Documentação", icon: FileCheck2 },
  { id: 4, title: "Responsável", icon: Users },
];

function CadastroEmpresa() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleCreateAccount = async () => {
    if (!email || !password || !companyName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
          role: "company",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1) {
      handleCreateAccount();
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleFinish = () => {
    toast.success("Cadastro da empresa finalizado!");
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cadastro empresarial</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Cadastre sua empresa</h1>
        <p className="mt-2 text-lg text-muted-foreground">Etapa {step} de {STEPS.length}</p>
      </div>

      <div className="mb-10 grid grid-cols-4 gap-2">
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary/15 text-primary",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <p className={cn("hidden text-center text-xs font-medium sm:block", active && "text-foreground")}>{s.title}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-10 shadow-elevated">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Crie a conta da empresa</h2>
            <p className="text-muted-foreground">Dados de acesso da empresa à plataforma.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome da empresa *">
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="Nome fantasia" />
                </Field>
              </div>
              <Field label="Email corporativo *">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="contato@empresa.com.br" />
              </Field>
              <div />
              <Field label="Senha *">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="Mínimo 6 caracteres" />
              </Field>
              <Field label="Confirmar senha *">
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="Repita a senha" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Sobre a empresa</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Razão social"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="Nome jurídico" /></Field>
              <Field label="CNPJ"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="00.000.000/0000-00" /></Field>
              <Field label="Inscrição estadual"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="Opcional" /></Field>
              <Field label="Setor de atuação">
                <select className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base">
                  <option>Vigilância patrimonial</option>
                  <option>Escolta armada</option>
                  <option>Segurança eletrônica</option>
                  <option>Eventos</option>
                  <option>Portaria</option>
                </select>
              </Field>
              <Field label="Nº de colaboradores">
                <select className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base">
                  <option>1 — 10</option><option>11 — 50</option><option>51 — 200</option><option>200+</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descrição da empresa"><Textarea rows={4} className="rounded-xl bg-surface text-base" placeholder="Conte sobre sua empresa, áreas de atuação, diferenciais..." /></Field>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Documentação</h2>
            <p className="text-muted-foreground">Suas vagas só ficam visíveis após validarmos os documentos.</p>
            {[
              "Cartão CNPJ",
              "Autorização de funcionamento (Polícia Federal)",
              "Contrato social",
            ].map((doc) => (
              <div key={doc} className="flex items-center justify-between rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-5">
                <div>
                  <p className="font-semibold">{doc}</p>
                  <p className="text-sm text-muted-foreground">PDF, máximo 10MB</p>
                </div>
                <Button variant="outline" className="rounded-full">Enviar</Button>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Responsável pela conta</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome completo"><Input className="h-12 rounded-xl bg-surface text-base" /></Field>
              <Field label="Cargo"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="Ex: Diretor de RH" /></Field>
              <Field label="WhatsApp"><Input className="h-12 rounded-xl bg-surface text-base" /></Field>
            </div>

            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">Tudo pronto!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Após a validação dos documentos, sua empresa ficará visível e poderá publicar vagas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="h-12 rounded-full px-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          {step < STEPS.length ? (
            <Button onClick={handleNext} disabled={loading} className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === 1 ? "Criar conta" : "Continuar"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90">
              Finalizar cadastro <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
