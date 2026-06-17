import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, User, MapPin, GraduationCap, Camera, Loader2, Mail, Lock, Building2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { COURSES } from "@/data/mock";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ESCOLARIDADE_OPTIONS } from "@/lib/professional-level";
import {
  ExperienceDialog, ExperienceList, AddExperienceButton, toDbDate, type ExperienceDraft,
} from "@/components/ProfessionalExperiences";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro de Profissional — FORBIN" },
      { name: "description", content: "Monte seu currículo profissional na plataforma FORBIN em poucos passos." },
    ],
  }),
  component: CadastroProfissional,
});

const STEPS = [
  { id: 1, title: "Criar conta", icon: Mail },
  { id: 2, title: "Dados pessoais", icon: User },
  { id: 3, title: "Endereço", icon: MapPin },
  { id: 4, title: "Cursos & formação", icon: GraduationCap },
  { id: 5, title: "Foto de Corpo Inteiro", icon: Camera },
];

function CadastroProfissional() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [bio, setBio] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [hasCnv, setHasCnv] = useState<boolean | null>(null);
  const [servedMilitary, setServedMilitary] = useState<boolean | null>(null);
  const [dataNascimento, setDataNascimento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [hasCnh, setHasCnh] = useState(false);
  const [disponibilidadeViagem, setDisponibilidadeViagem] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!userId) {
      toast.error("Crie sua conta primeiro (etapa 1).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `profiles/${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("certificates")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("certificates").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([]);
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceDraft | null>(null);

  // Step 1 - Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const toggleCourse = (c: string) =>
    setSelectedCourses((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleCreateAccount = async () => {
    if (!email || !password || !fullName) {
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "professional",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.user?.id) {
      setUserId(data.user.id);
    }
    toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1) {
      handleCreateAccount();
      return;
    }
    if (step === 2 && !phone.trim()) {
      toast.error("Informe seu número de WhatsApp.");
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (userId) {
        // Save form values to Supabase profiles table
        const { error } = await supabase
          .from("profiles")
          .update({
            phone: phone || null,
            whatsapp: phone || null,
            city: city || null,
            state: state || null,
            courses: selectedCourses,
            bio: bio || null,
            escolaridade: escolaridade || null,
            has_cnv: hasCnv ?? false,
            served_military: servedMilitary,
            data_nascimento: dataNascimento || null,
            estado_civil: estadoCivil || null,
            altura: altura || null,
            peso: peso || null,
            has_cnh: hasCnh,
            disponibilidade_viagem: disponibilidadeViagem,
            avatar_url: avatarUrl || null,
          } as any)
          .eq("user_id", userId);

        if (error) {
          console.error("Error saving profile details:", error);
        }

        // Save professional experiences
        if (experiences.length > 0) {
          const rows = experiences.map((exp) => ({
            user_id: userId,
            company: exp.company,
            position: exp.position,
            category: exp.category,
            start_date: toDbDate(exp.start_date),
            end_date: exp.is_current ? null : toDbDate(exp.end_date),
            is_current: exp.is_current,
            description: exp.description || null,
          }));
          const { error: expError } = await supabase
            .from("professional_experiences")
            .insert(rows as any);
          if (expError) {
            console.error("Error saving experiences:", expError);
          }
        }
      }
    } catch (err) {
      console.error("Error in handleFinish:", err);
    } finally {
      setLoading(false);
      toast.success("Cadastro finalizado com sucesso!");
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {step > 0 && (
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cadastro de profissional</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Monte seu currículo
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">Etapa {step} de {STEPS.length}</p>
        </div>
      )}

      {/* Stepper */}
      {step > 0 && (
        <div className="mb-10 grid grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-primary/15 text-primary",
                    !done && !active && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <p className={cn("hidden text-center text-xs font-medium sm:block", active && "text-foreground")}>
                  {s.title}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {step === 0 && (
        <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-12 shadow-elevated text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold">Crie sua conta</h2>
          <p className="mt-2 text-muted-foreground">Como você deseja utilizar a plataforma Forbin?</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <button
              onClick={() => setStep(1)}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-border/60 bg-surface p-8 transition hover:border-primary hover:bg-primary/5 hover:shadow-gold group"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">Sou Profissional</p>
                <p className="mt-1 text-sm text-muted-foreground">Quero me candidatar a vagas e acessar cursos.</p>
              </div>
            </button>

            <button
              onClick={() => navigate({ to: "/cadastro-empresa" as any })}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-border/60 bg-surface p-8 transition hover:border-primary hover:bg-primary/5 hover:shadow-gold group"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">Sou Empresa</p>
                <p className="mt-1 text-sm text-muted-foreground">Quero anunciar vagas e encontrar profissionais.</p>
              </div>
            </button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entre aqui</Link>
          </p>
        </div>
      )}

      {step > 0 && (
      <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-10 shadow-elevated">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Crie sua conta</h2>
            <p className="text-muted-foreground">Primeiro, vamos criar seu acesso à plataforma.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome completo *">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="Ex: João da Silva" />
                </Field>
              </div>
              <Field label="Email *">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="seu@email.com" />
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
            <h2 className="font-display text-2xl font-bold">Conte sobre você</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="CPF"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="000.000.000-00" /></Field>
              <Field label="Data de nascimento"><Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="h-12 rounded-xl bg-surface text-base" /></Field>
              <Field label="WhatsApp *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="(11) 99999-0000" /></Field>
              <Field label="Estado civil">
                <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base">
                  <option value="">Selecione</option>
                  <option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option><option value="União Estável">União Estável</option>
                </select>
              </Field>
              <Field label="Altura (cm)"><Input value={altura} onChange={(e) => setAltura(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="180" /></Field>
              <Field label="Peso (kg)"><Input value={peso} onChange={(e) => setPeso(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="80" /></Field>
            </div>
            <Field label="Já serviu o quartel?">
              <div className="flex gap-3">
                <Button type="button" variant={servedMilitary === true ? "default" : "outline"} className="h-12 flex-1 rounded-xl" onClick={() => setServedMilitary(true)}>Sim</Button>
                <Button type="button" variant={servedMilitary === false ? "default" : "outline"} className="h-12 flex-1 rounded-xl" onClick={() => setServedMilitary(false)}>Não</Button>
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">Onde você mora?</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="CEP"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="00000-000" /></Field>
              <Field label="Estado">
                <select value={state} onChange={(e) => setState(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base">
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="PR">PR</option>
                  <option value="SC">SC</option>
                </select>
              </Field>
              <Field label="Cidade"><Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 rounded-xl bg-surface text-base" placeholder="São Paulo" /></Field>
              <Field label="Bairro"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="Centro" /></Field>
              <div className="sm:col-span-2">
                <Field label="Endereço completo"><Input className="h-12 rounded-xl bg-surface text-base" placeholder="Rua, número, complemento" /></Field>
              </div>
              <Field label="Disponibilidade para viagem">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                  <Checkbox id="viagem" checked={disponibilidadeViagem} onCheckedChange={(v) => setDisponibilidadeViagem(v === true)} />
                  <Label htmlFor="viagem" className="cursor-pointer text-base">Aceito viajar a trabalho</Label>
                </div>
              </Field>
              <Field label="Possui CNH? (Habilitação)">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                  <Checkbox id="cnh" checked={hasCnh} onCheckedChange={(v) => setHasCnh(v === true)} />
                  <Label htmlFor="cnh" className="cursor-pointer text-base">Sim, categoria B ou superior</Label>
                </div>
              </Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Cursos & Formação</h2>
            <p className="text-muted-foreground">Selecione todos os cursos que você possui. Vamos validar com a FORBIN.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {COURSES.map((c) => {
                const active = selectedCourses.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCourse(c)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition",
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <span className="text-base font-medium">{c}</span>
                    {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Escolaridade">
                <select
                  value={escolaridade}
                  onChange={(e) => setEscolaridade(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
                >
                  <option value="">Selecione</option>
                  {ESCOLARIDADE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Possui CNV? (Carteira Nacional de Vigilante)">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={hasCnv === true ? "default" : "outline"}
                    className="h-12 flex-1 rounded-xl"
                    onClick={() => setHasCnv(true)}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={hasCnv === false ? "default" : "outline"}
                    className="h-12 flex-1 rounded-xl"
                    onClick={() => setHasCnv(false)}
                  >
                    Não
                  </Button>
                </div>
              </Field>
            </div>

            <Field label="Resumo profissional">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-xl bg-surface text-base" placeholder="Conte um pouco sobre sua experiência, anos de atuação, especialidades..." />
            </Field>

            <div className="space-y-3">
              <div>
                <h3 className="font-display text-lg font-bold">Experiências Profissionais</h3>
                <p className="text-sm text-muted-foreground">Adicione empresas onde trabalhou, cargos e períodos. Isso ajuda a definir seu nível na plataforma.</p>
              </div>
              <ExperienceList
                items={experiences}
                editable
                emptyText="Nenhuma experiência adicionada ainda."
                onEdit={(e) => { setEditingExp(e); setExpDialogOpen(true); }}
                onDelete={(e) => setExperiences((prev) => prev.filter((x) => x !== e))}
              />
              <AddExperienceButton onClick={() => { setEditingExp(null); setExpDialogOpen(true); }} />
            </div>

            <ExperienceDialog
              open={expDialogOpen}
              initial={editingExp}
              onClose={() => { setExpDialogOpen(false); setEditingExp(null); }}
              onSave={(draft) => {
                setExperiences((prev) => {
                  if (editingExp && prev.includes(editingExp)) {
                    return prev.map((x) => (x === editingExp ? draft : x));
                  }
                  return [...prev, draft];
                });
                setExpDialogOpen(false);
                setEditingExp(null);
              }}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Foto de Corpo Inteiro (Perfil Profissional)</h2>
            <p className="text-muted-foreground">Envie uma foto de corpo inteiro, de preferência uniformizado. Essa será sua apresentação profissional para as empresas.</p>
            <div className="rounded-3xl border-2 border-dashed border-border bg-surface p-8 text-center sm:p-12">
              {avatarUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={avatarUrl} alt="Sua foto" className="h-44 w-44 rounded-2xl border border-border object-cover" />
                  <Button variant="outline" className="rounded-full" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Trocar foto
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-lg font-semibold">Arraste sua foto de corpo inteiro ou clique para enviar</p>
                  <p className="mt-1 text-sm text-muted-foreground">JPG ou PNG, máximo 5MB</p>
                  <Button className="mt-6 rounded-full" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Selecionar foto"}
                  </Button>
                </>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>

            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">Tudo pronto!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ao finalizar, seu perfil ficará visível para empresas verificadas e você poderá começar a se candidatar.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Cursos selecionados:</span>
              {selectedCourses.length === 0 && <span className="text-sm text-muted-foreground">Nenhum</span>}
              {selectedCourses.map((c) => (
                <Badge key={c} className="rounded-full bg-primary/15 text-primary">{c}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="h-12 rounded-full px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          {step < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === 1 ? "Criar conta" : "Continuar"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="h-12 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-gold hover:bg-primary/90"
            >
              Finalizar cadastro <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      )}

      {step > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
        </p>
      )}
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
